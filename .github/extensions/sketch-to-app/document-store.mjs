import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";

const WIDTH = 1200;
const HEIGHT = 800;
const MAX_STROKES = 800;
const MAX_POINTS_PER_STROKE = 4000;
const MAX_POINTS = 80000;
const MAX_PNG_BYTES = 8 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export function emptyDocument() {
    return { width: WIDTH, height: HEIGHT, strokes: [], notes: "", backgroundPngBase64: null };
}

function exactKeys(value, keys, name) {
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).some((key) => !keys.includes(key)) ||
        keys.some((key) => !Object.hasOwn(value, key))) {
        throw new HttpError(400, `Invalid ${name}.`);
    }
}

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

async function writeJson(path, value) {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, JSON.stringify(value));
        await rename(temporary, path);
    } finally {
        await rm(temporary, { force: true });
    }
}

export class SketchStore {
    #pending = Promise.resolve();

    constructor(directory, send) {
        this.directory = directory;
        this.send = send;
    }

    #serialize(operation) {
        const result = this.#pending.then(operation);
        // A failed request reaches its caller but must not block later saves.
        this.#pending = result.catch(() => {});
        return result;
    }

    async state() {
        const state = await readJson(join(this.directory, "board.json"), null);
        return state ?? { version: 0, document: emptyDocument() };
    }

    async latest() {
        return readJson(join(this.directory, "last-submission.json"), null);
    }

    async save(payload) {
        return this.#serialize(async () => {
            exactKeys(payload, ["version", "document"], "save request");
            const { version, document } = payload;
            const current = await this.state();
            if (!Number.isSafeInteger(version) || version < 0) {
                throw new HttpError(400, "Invalid board version.");
            }
            if (version !== current.version) {
                throw new HttpError(409, "The board changed in another panel. Reload it before saving.");
            }
            validateDocument(document);
            const updated = { version: version + 1, document };
            await mkdir(this.directory, { recursive: true });
            await writeJson(join(this.directory, "board.json"), updated);
            return updated;
        });
    }

    async build(payload) {
        return this.#serialize(async () => {
            exactKeys(payload, ["version", "document", "pngBase64"], "build request");
            const { version, document, pngBase64 } = payload;
            const png = decodeSnapshot(pngBase64);
            const current = await this.state();
            if (!Number.isSafeInteger(version) || version < 0) {
                throw new HttpError(400, "Invalid board version.");
            }
            if (version !== current.version) {
                throw new HttpError(409, "The board changed in another panel. Reload it before building.");
            }
            validateDocument(document);
            const updated = {
                version: isDeepStrictEqual(document, current.document) ? version : version + 1,
                document,
            };
            const snapshots = join(this.directory, "snapshots");
            await mkdir(snapshots, { recursive: true });
            await writeJson(join(this.directory, "board.json"), updated);
            const snapshotPath = join(snapshots, `${randomUUID()}.png`);
            await writeFile(snapshotPath, png, { flag: "wx" });

            const prompt = [
                "Build or update the app screen(s) using the attached COMPLETE current sketch as the desired state.",
                "This is a full snapshot, not a delta; inspect it afresh rather than tracking changes from previous sketches.",
                "Use the app being worked on in this Copilot session, preserving its current UI paradigm (native MAUI XAML, MAUI Blazor Hybrid, or another app).",
                "If multiple candidate apps exist and the current target is unclear, ask which one before editing.",
                "Notes from the board:",
                document.notes || "(none)",
            ].join("\n");
            const messageId = await this.send({
                prompt,
                attachments: [{ type: "blob", data: pngBase64, mimeType: "image/png", displayName: "sketch.png" }],
                mode: "immediate",
            });
            const submission = { version: updated.version, snapshotPath, notes: document.notes, messageId };
            await writeJson(join(this.directory, "last-submission.json"), submission);
            return submission;
        });
    }
}
