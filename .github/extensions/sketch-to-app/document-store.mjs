// Persist each session's board, PNG snapshots, and images imported from chat.
// The server revalidates browser uploads before saving; UI checks alone are not authoritative.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const WIDTH = 1200;
const HEIGHT = 800;
const MAX_STROKES = 800;
const MAX_POINTS_PER_STROKE = 4000;
const MAX_POINTS = 80000;
const MAX_PNG_BYTES = 8 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const JPEG_SIGNATURE = Buffer.from([255, 216, 255]);

export class HttpError extends Error {
    // Carry an HTTP status for validation and version conflicts.
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Provide the first board state before any drawing has been saved.
export function emptyDocument() {
    return { width: WIDTH, height: HEIGHT, strokes: [], notes: "", backgroundPngBase64: null };
}

// Reject unexpected fields in requests and stroke data.
function exactKeys(value, keys, name) {
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).some((key) => !keys.includes(key)) ||
        keys.some((key) => !Object.hasOwn(value, key))) {
        throw new HttpError(400, `Invalid ${name}.`);
    }
}

// Enforce board limits before persisting any browser-supplied document.
export function validateDocument(document) {
    if (!document || typeof document !== "object" || Array.isArray(document) ||
        Object.keys(document).some((key) =>
            !["width", "height", "strokes", "notes", "backgroundPngBase64"].includes(key)) ||
        ["width", "height", "strokes", "notes"].some((key) => !Object.hasOwn(document, key))) {
        throw new HttpError(400, "Invalid document.");
    }
    if (document.width !== WIDTH || document.height !== HEIGHT ||
        typeof document.notes !== "string" || document.notes.length > 10000 ||
        !Array.isArray(document.strokes) || document.strokes.length > MAX_STROKES) {
        throw new HttpError(400, "Invalid board dimensions, notes, or stroke count.");
    }
    if (document.backgroundPngBase64 != null) {
        decodeSnapshot(document.backgroundPngBase64);
    }

    let totalPoints = 0;
    for (const stroke of document.strokes) {
        exactKeys(stroke, ["tool", "color", "size", "points"], "stroke");
        if (!["pen", "eraser"].includes(stroke.tool) ||
            typeof stroke.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(stroke.color) ||
            !Number.isFinite(stroke.size) || stroke.size < 1 || stroke.size > 100 ||
            !Array.isArray(stroke.points) || stroke.points.length < 1 ||
            stroke.points.length > MAX_POINTS_PER_STROKE) {
            throw new HttpError(400, "Invalid stroke properties.");
        }
        totalPoints += stroke.points.length;
        if (totalPoints > MAX_POINTS) {
            throw new HttpError(400, "Board contains too many points.");
        }
        for (const point of stroke.points) {
            exactKeys(point, ["x", "y"], "point");
            if (!Number.isFinite(point.x) || !Number.isFinite(point.y) ||
                point.x < 0 || point.x > WIDTH || point.y < 0 || point.y > HEIGHT) {
                throw new HttpError(400, "Invalid stroke coordinates.");
            }
        }
    }
    return document;
}

// Verify checksums on the PNG chunks accepted by the server.
function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

// Decode only complete, correctly sized PNG snapshots within the upload limit.
export function decodeSnapshot(base64) {
    if (typeof base64 !== "string" || base64.length === 0 ||
        base64.length > Math.ceil(MAX_PNG_BYTES / 3) * 4 ||
        base64.length % 4 !== 0) {
        throw new HttpError(400, "Expected a base64-encoded PNG under 8 MB.");
    }
    const png = Buffer.from(base64, "base64");
    if (png.toString("base64") !== base64 ||
        png.length > MAX_PNG_BYTES || png.length < 57 ||
        !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
        throw new HttpError(400, "Invalid PNG snapshot.");
    }
    let offset = 8;
    let hasImageData = false;
    let ended = false;
    while (offset + 12 <= png.length) {
        const length = png.readUInt32BE(offset);
        if (length > png.length - offset - 12) break;
        const type = png.toString("ascii", offset + 4, offset + 8);
        const chunk = png.subarray(offset + 4, offset + 8 + length);
        const checksum = png.readUInt32BE(offset + 8 + length);
        if (!/^[A-Za-z]{4}$/.test(type) || crc32(chunk) !== checksum) break;
        if (offset === 8 && (type !== "IHDR" || length !== 13 ||
            png.readUInt32BE(offset + 8) !== WIDTH ||
            png.readUInt32BE(offset + 12) !== HEIGHT)) break;
        if (type === "IDAT") hasImageData = true;
        offset += length + 12;
        if (type === "IEND") {
            ended = length === 0;
            break;
        }
    }
    if (!hasImageData || !ended || offset !== png.length) {
        throw new HttpError(400, "Invalid or incomplete PNG snapshot.");
    }
    return png;
}

// Accept portable PNG/JPEG uploads for the Blazor image importer.
function imageType(bytes) {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_PNG_BYTES)
        throw new HttpError(400, "The image must be nonempty and no larger than 8 MiB.");
    if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return { extension: "png", mimeType: "image/png" };
    if (bytes.subarray(0, 3).equals(JPEG_SIGNATURE))
        return { extension: "jpg", mimeType: "image/jpeg" };
    throw new HttpError(400, "Choose a PNG or JPEG image.");
}

// Resolve only server-generated pending image names within this session.
function pendingPath(directory, filename) {
    if (typeof filename !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg)$/.test(filename))
        throw new Error("Invalid pending image metadata.");
    return join(directory, "pending", filename);
}

// Read a JSON artifact while allowing a missing, not-yet-created file.
async function readJson(path, missingValue) {
    let contents;
    try {
        contents = await readFile(path, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") return missingValue;
        throw error;
    }
    return JSON.parse(contents);
}

// Replace a JSON artifact atomically to avoid partially written boards.
async function writeJson(path, value) {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, JSON.stringify(value));
        await rename(temporary, path);
    } finally {
        await rm(temporary, { force: true });
    }
}

// Serialize mutations so saved versions, images, and notes stay in sync.
export class SketchStore {
    #pending = Promise.resolve();
    #listeners = new Set();

    // Bind storage to this session's artifact directory.
    constructor(directory) {
        this.directory = directory;
    }

    // Notify each open panel when a board version is committed.
    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    // Broadcast a committed version without carrying image bytes over SSE.
    #notify(version) {
        for (const listener of this.#listeners)
            listener(version);
    }

    // Run mutations one at a time without letting a failed call block the next.
    #serialize(operation) {
        const result = this.#pending.then(operation);
        // A failed request reaches its caller but must not block later saves.
        this.#pending = result.catch(() => {});
        return result;
    }

    // Load private image metadata together with the public board state.
    async #record() {
        return await readJson(join(this.directory, "board.json"), null)
            ?? { version: 0, document: emptyDocument() };
    }

    // Return only the version and document needed by the Blazor UI.
    async state() {
        const { version, document, pendingImport } = await this.#record();
        return { version, document, pendingImport: pendingImport !== undefined };
    }

    // Let the UI detect chat edits without downloading the full document.
    async version() {
        const { version } = await this.#record();
        return { version };
    }

    // Read pre-existing submissions from older versions of this extension.
    async latest() {
        return readJson(join(this.directory, "last-submission.json"), null);
    }

    // Write a versioned PNG before making its board version visible.
    async #saveImage(current, updated, png) {
        const images = join(this.directory, "images");
        await mkdir(images, { recursive: true });
        const imagePath = join(images, `${updated.version}.png`);
        await writeFile(imagePath, png, { flag: "wx" });
        try {
            await writeJson(join(this.directory, "board.json"),
                { ...updated, imageVersion: updated.version });
        } catch (error) {
            await rm(imagePath, { force: true });
            throw error;
        }
        if (current.imageVersion !== undefined && current.imageVersion !== updated.version)
            await rm(join(images, `${current.imageVersion}.png`), { force: true });
        if (current.pendingImport)
            await rm(pendingPath(this.directory, current.pendingImport), { force: true });
    }

    // Copy the current board PNG or queued source image to an immutable chat artifact.
    async snapshot() {
        return this.#serialize(async () => {
            const current = await this.#record();
            const snapshots = join(this.directory, "snapshots");
            if (current.pendingImport) {
                const image = await readFile(pendingPath(this.directory, current.pendingImport));
                const { extension, mimeType } = imageType(image);
                await mkdir(snapshots, { recursive: true });
                const snapshotPath = join(snapshots, `${randomUUID()}.${extension}`);
                await writeFile(snapshotPath, image, { flag: "wx" });
                return { version: current.version, snapshotPath, notes: current.document.notes,
                    mimeType, pendingImport: true };
            }
            if (current.imageVersion === undefined) {
                const latest = await this.latest();
                return latest?.version === current.version
                    ? { version: current.version, snapshotPath: latest.snapshotPath,
                        notes: current.document.notes, mimeType: "image/png", pendingImport: false }
                    : { version: current.version, snapshotPath: null,
                        notes: current.document.notes, mimeType: null, pendingImport: false };
            }
            await mkdir(snapshots, { recursive: true });
            const snapshotPath = join(snapshots, `${randomUUID()}.png`);
            const image = await readFile(join(this.directory, "images", `${current.imageVersion}.png`));
            await writeFile(snapshotPath, image, { flag: "wx" });
            return { version: current.version, snapshotPath, notes: current.document.notes,
                mimeType: "image/png", pendingImport: false };
        });
    }

    // Queue an image for Blazor to fit, orient, and replace the board with.
    async importImage(version, bytes, notes) {
        return this.#serialize(async () => {
            const { extension } = imageType(bytes);
            if (notes !== undefined && (typeof notes !== "string" || notes.length > 10000))
                throw new HttpError(400, "Notes must contain at most 10000 characters.");
            const current = await this.#record();
            if (!Number.isSafeInteger(version) || version < 0)
                throw new HttpError(400, "Invalid board version.");
            if (version !== current.version)
                throw new HttpError(409, "The board changed in chat or the canvas. Inspect it before replacing it.");
            const filename = `${randomUUID()}.${extension}`;
            const path = pendingPath(this.directory, filename);
            await mkdir(join(this.directory, "pending"), { recursive: true });
            await writeFile(path, bytes, { flag: "wx" });
            const updated = {
                ...current, version: version + 1, pendingImport: filename,
                document: notes === undefined ? current.document : { ...current.document, notes },
            };
            try {
                await writeJson(join(this.directory, "board.json"), updated);
            } catch (error) {
                await rm(path, { force: true });
                throw error;
            }
            if (current.pendingImport)
                await rm(pendingPath(this.directory, current.pendingImport), { force: true });
            this.#notify(updated.version);
            return { version: updated.version, pendingImport: true };
        });
    }

    // Serve only the pending image for the board version Blazor loaded.
    async pendingImage(version) {
        return this.#serialize(async () => {
            const current = await this.#record();
            if (version !== current.version || !current.pendingImport)
                throw new HttpError(409, "The pending image changed. Reload the board.");
            const bytes = await readFile(pendingPath(this.directory, current.pendingImport));
            return { bytes, mimeType: imageType(bytes).mimeType };
        });
    }

    // Save a board and its browser-rendered PNG if its version is current.
    async save(payload) {
        return this.#serialize(async () => {
            exactKeys(payload, ["version", "document", "pngBase64"], "save request");
            const { version, document, pngBase64 } = payload;
            const current = await this.#record();
            if (!Number.isSafeInteger(version) || version < 0) {
                throw new HttpError(400, "Invalid board version.");
            }
            if (version !== current.version) {
                throw new HttpError(409, "The board changed in chat or another panel. Reload it before saving.");
            }
            validateDocument(document);
            const png = decodeSnapshot(pngBase64);
            const updated = { version: version + 1, document };
            await this.#saveImage(current, updated, png);
            this.#notify(updated.version);
            return updated;
        });
    }

    // Replace notes explicitly while retaining the current pixels.
    async setNotes(version, notes) {
        return this.#serialize(async () => {
            if (!Number.isSafeInteger(version) || version < 0 ||
                typeof notes !== "string" || notes.length > 10000)
                throw new HttpError(400, "Invalid board version or notes.");
            const current = await this.#record();
            if (version !== current.version)
                throw new HttpError(409, "The board changed in chat or the canvas. Inspect it before replacing notes.");
            if (notes === current.document.notes)
                return { version: current.version, notes };
            const updated = {
                ...current, version: version + 1,
                document: { ...current.document, notes },
            };
            await mkdir(this.directory, { recursive: true });
            await writeJson(join(this.directory, "board.json"), updated);
            this.#notify(updated.version);
            return { version: updated.version, notes };
        });
    }

    // Append a chat note while preserving user notes and the current image.
    async addNote(text) {
        return this.#serialize(async () => {
            if (typeof text !== "string" || !text.trim() || text.length > 10000)
                throw new HttpError(400, "A note must contain 1 to 10000 characters.");
            const current = await this.#record();
            const notes = [current.document.notes, text].filter(Boolean).join("\n");
            if (notes.length > 10000)
                throw new HttpError(400, "The notes box is full (maximum 10000 characters).");
            const updated = {
                ...current, version: current.version + 1,
                document: { ...current.document, notes },
            };
            await mkdir(this.directory, { recursive: true });
            await writeJson(join(this.directory, "board.json"), updated);
            this.#notify(updated.version);
            return { version: updated.version, notes };
        });
    }
}
