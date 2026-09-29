// Verify session board persistence, snapshot retrieval, and the loopback API.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { fingerprint, startCanvasServer, UiPublisher } from "../canvas-server.mjs";
import { decodeSnapshot, emptyDocument, HttpError, SketchStore, validateDocument } from "../document-store.mjs";
import { end, point, start } from "../ui/wwwroot/touch-canvas.js";

// Compute PNG chunk checksums for image-validation tests.
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

// Encode one PNG chunk with its length and checksum.
function chunk(type, data) {
    const name = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, checksum]);
}

// Create a complete 1200 x 800 PNG or an intentionally different size.
function png(width = 1200, height = 800, pixels = Buffer.alloc(height * (1 + width * 4))) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(pixels)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

// Pair the saved board with the image rendered by the Blazor app.
function saveRequest(version, document, image = png()) {
    return { version, document, pngBase64: image.toString("base64") };
}

// Isolate file-backed tests from the current Copilot session board.
async function temporary(t) {
    const directory = await mkdtemp(join(tmpdir(), `sketch-to-app-${randomUUID()}-`));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
}

test("TouchCanvas maps pointer positions and releases capture independently of strokes", () => {
    let captured = null;
    const layer = {
        setPointerCapture(id) { captured = id; },
        hasPointerCapture(id) { return captured === id; },
        releasePointerCapture(id) { if (captured === id) captured = null; },
    };
    const board = {
        getBoundingClientRect() { return { left: 10, top: 20, width: 600, height: 400 }; },
        querySelector(selector) { assert.equal(selector, ".pointer-layer"); return layer; },
    };
    assert.deepEqual(start(board, 5, 310, 220, 1200, 800), { x: 600, y: 400 });
    assert.equal(captured, 5);
    assert.deepEqual(point(board, -100, 1000, 1200, 800), { x: 0, y: 800 });
    end(board, 5);
    assert.equal(captured, null);
    end(board, 5);
    assert.throws(() => point({ getBoundingClientRect: () => ({ width: 0, height: 10 }) },
        1, 1, 1200, 800), /no size/);
});

test("the bundled UI is current and contains only served assets", async () => {
    const extension = fileURLToPath(new URL("../", import.meta.url));
    const bundle = join(extension, "prebuilt");
    assert.equal((await readFile(join(bundle, "source.hash"), "utf8")).trim(),
        await fingerprint(join(extension, "ui")));
    assert.match(await readFile(join(bundle, "wwwroot", "index.html"), "utf8"),
        /blazor\.webassembly/);
    const assets = await readdir(join(bundle, "wwwroot", "_framework"));
    assert.ok(assets.some((name) => name.endsWith(".wasm")));
    assert.ok(assets.every((name) => !/\.(?:br|gz|map)$/.test(name)));
    assert.ok(assets.every((name) => !name.startsWith("icudt_")));
});

test("a matching bundle loads without publishing, while changed UI uses the cached build", async (t) => {
    const directory = await temporary(t);
    const ui = join(directory, "ui");
    const bundle = join(directory, "prebuilt");
    const artifacts = join(directory, "artifacts");
    const project = join(ui, "SketchToApp.Web.csproj");
    const source = join(ui, "Home.razor");
    await mkdir(ui);
    await mkdir(join(bundle, "wwwroot"), { recursive: true });
    await writeFile(project, "<Project />");
    await writeFile(source, "Before\r\n");
    const hash = await fingerprint(ui);
    await writeFile(join(bundle, "source.hash"), `${hash}\n`);
    await writeFile(join(bundle, "wwwroot", "index.html"), "<h1>Bundled</h1>");

    const bundled = new UiPublisher(project, artifacts);
    await bundled.start();
    assert.equal(bundled.status, "ready");
    assert.equal(bundled.root, join(bundle, "wwwroot"));
    const entry = await startCanvasServer({ store: new SketchStore(join(directory, "board")), publisher: bundled });
    t.after(() => entry.close());
    assert.match(await (await fetch(entry.url)).text(), /Bundled/);

    await writeFile(source, "Before\n");
    assert.equal(await fingerprint(ui), hash);
    await writeFile(source, "After\n");
    const changedHash = await fingerprint(ui);
    assert.notEqual(changedHash, hash);
    const cached = join(artifacts, "published", changedHash);
    await mkdir(join(cached, "wwwroot"), { recursive: true });
    await writeFile(join(cached, ".ready"), changedHash);
    await writeFile(join(cached, "wwwroot", "index.html"), "<h1>Rebuilt</h1>");
    const rebuilt = new UiPublisher(project, artifacts);
    await rebuilt.start();
    assert.equal(rebuilt.status, "ready");
    assert.equal(rebuilt.root, join(cached, "wwwroot"));
});

test("board state persists across store instances and rejects stale writes", async (t) => {
    const directory = await temporary(t);
    const first = new SketchStore(directory);
    assert.deepEqual(await first.state(), { version: 0, document: emptyDocument(), pendingImport: false });
    const document = { ...emptyDocument(), notes: "Add a login button" };
    assert.deepEqual(await first.save(saveRequest(0, document)), { version: 1, document });
    const second = new SketchStore(directory);
    assert.deepEqual(await second.state(), { version: 1, document, pendingImport: false });
    await assert.rejects(first.save(saveRequest(0, document)),
        (error) => error instanceof HttpError && error.status === 409);
    assert.equal((await first.save(saveRequest(1, document))).version, 2);
});

test("concurrent writes are serialized and invalid sketches are rejected", async (t) => {
    const store = new SketchStore(await temporary(t));
    const document = emptyDocument();
    await assert.rejects(store.save(null), (error) => error.status === 400);
    const results = await Promise.allSettled([
        store.save(saveRequest(0, document)),
        store.save(saveRequest(0, document)),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), ["fulfilled", "rejected"]);
    await assert.rejects(store.save(saveRequest(1, {
        ...document, strokes: [{ tool: "pen", color: "#000000", size: 3,
            points: [{ x: -1, y: 20 }] }],
    })), (error) => error.status === 400);
});

test("old boards and imported raster backgrounds are valid and persisted", async (t) => {
    const store = new SketchStore(await temporary(t));
    const oldDocument = { width: 1200, height: 800, strokes: [], notes: "" };
    assert.deepEqual(validateDocument(oldDocument), oldDocument);
    const raster = png().toString("base64");
    const document = { ...oldDocument, backgroundPngBase64: raster };
    const saved = await store.save(saveRequest(0, document));
    assert.equal(saved.version, 1);
    assert.equal((await store.state()).document.backgroundPngBase64, raster);
    await assert.rejects(store.save(saveRequest(1,
        { ...document, backgroundPngBase64: "not an image" })),
    (error) => error.status === 400);
    await assert.rejects(store.save(saveRequest(1,
        { ...document, backgroundPngBase64: png(240, 160).toString("base64") })),
    (error) => error.status === 400);
});

test("chat reads an immutable snapshot of each auto-saved board and can append notes", async (t) => {
    const directory = await temporary(t);
    const store = new SketchStore(directory);
    assert.deepEqual(await store.snapshot(),
        { version: 0, snapshotPath: null, notes: "", mimeType: null, pendingImport: false });

    const initial = { ...emptyDocument(), notes: "User's layout" };
    const firstImage = png();
    await store.save(saveRequest(0, initial, firstImage));
    const first = await store.snapshot();
    assert.deepEqual(await readFile(first.snapshotPath), firstImage);
    assert.deepEqual({ version: first.version, notes: first.notes },
        { version: 1, notes: initial.notes });

    const pixels = Buffer.alloc(800 * (1 + 1200 * 4));
    pixels[1] = 255;
    const secondImage = png(1200, 800, pixels);
    const updated = { ...initial, strokes: [
        { tool: "pen", color: "#273449", size: 4, points: [{ x: 30, y: 40 }] },
    ] };
    await store.save(saveRequest(1, updated, secondImage));
    const second = await store.snapshot();
    assert.deepEqual(await readFile(second.snapshotPath), secondImage);
    assert.deepEqual(await readFile(first.snapshotPath), firstImage);

    assert.deepEqual(await store.addNote("Copilot: use native controls"),
        { version: 3, notes: "User's layout\nCopilot: use native controls" });
    const third = await store.snapshot();
    assert.equal(third.notes, "User's layout\nCopilot: use native controls");
    assert.equal(third.version, 3);
    assert.deepEqual(await readFile(third.snapshotPath), secondImage);
    assert.deepEqual(await (new SketchStore(directory)).version(), { version: 3 });
    await assert.rejects(store.save(saveRequest(2, updated)),
        (error) => error.status === 409);
    await assert.rejects(store.addNote("  "), (error) => error.status === 400);
    await assert.rejects(store.addNote("n".repeat(10000)), (error) => error.status === 400);
    assert.equal((await store.state()).version, 3);
});

test("board export writes a version-matched PNG and Markdown pair without overwriting", async (t) => {
    const directory = await temporary(t);
    const store = new SketchStore(join(directory, "store"));
    const imagePath = join(directory, "exports", "login screen.png");
    const markdownPath = join(directory, "exports", "login screen.md");
    await assert.rejects(store.exportBoard(imagePath, markdownPath),
        (error) => error instanceof HttpError && error.code === "board_blank");

    const image = png();
    const document = { ...emptyDocument(), notes: "Use **native** controls." };
    await store.save(saveRequest(0, document, image));
    assert.deepEqual(await store.exportBoard(imagePath, markdownPath),
        { version: 1, imagePath, markdownPath });
    assert.deepEqual(await readFile(imagePath), image);
    assert.equal(await readFile(markdownPath, "utf8"),
        "# Sketch notes\n\n![Sketch](./login%20screen.png)\n\n" +
        "## Notes\n\nUse **native** controls.\n");

    await assert.rejects(store.exportBoard(imagePath, markdownPath),
        (error) => error instanceof HttpError && error.code === "export_exists");
    assert.deepEqual(await readFile(imagePath), image);

    const partialImage = join(directory, "exports", "existing-notes.png");
    const existingMarkdown = join(directory, "exports", "existing-notes.md");
    await writeFile(existingMarkdown, "Keep me");
    await assert.rejects(store.exportBoard(partialImage, existingMarkdown),
        (error) => error instanceof HttpError && error.code === "export_exists");
    await assert.rejects(readFile(partialImage), (error) => error.code === "ENOENT");
    assert.equal(await readFile(existingMarkdown, "utf8"), "Keep me");
});

test("server limits match the UI's documented board limits", () => {
    const document = {
        ...emptyDocument(),
        notes: "n".repeat(10000),
        strokes: Array.from({ length: 800 }, () => ({
            tool: "eraser", color: "#AABBCC", size: 100, points: [{ x: 1200, y: 800 }],
        })),
    };
    assert.deepEqual(validateDocument(document), document);
    assert.throws(() => validateDocument({ ...document, notes: "n".repeat(10001) }),
        (error) => error.status === 400);
    assert.throws(() => validateDocument({
        ...document, strokes: [...document.strokes, document.strokes[0]],
    }), (error) => error.status === 400);
    assert.throws(() => validateDocument({
        ...document, strokes: [{ ...document.strokes[0], size: 101 }],
    }), (error) => error.status === 400);
    assert.throws(() => validateDocument({
        ...document, strokes: [{ ...document.strokes[0], points: Array(4001).fill({ x: 0, y: 0 }) }],
    }), (error) => error.status === 400);
    assert.deepEqual(validateDocument({
        ...document, strokes: Array(20).fill({
            ...document.strokes[0], points: Array(4000).fill({ x: 0, y: 0 }),
        }),
    }).strokes.length, 20);
});

test("chat queues JPEG pixels and notes, then Blazor saves a PNG without losing either", async (t) => {
    const directory = await temporary(t);
    const store = new SketchStore(directory);
    const versions = [];
    const unsubscribe = store.subscribe((version) => versions.push(version));
    const initial = { ...emptyDocument(), notes: "Original note" };
    await store.save(saveRequest(0, initial));
    const previous = await store.snapshot();
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

    assert.deepEqual(await store.importImage(1, jpeg, "Tasks from chat"),
        { version: 2, pendingImport: true });
    assert.deepEqual(await store.state(),
        { version: 2, document: { ...initial, notes: "Tasks from chat" }, pendingImport: true });
    const pending = await store.snapshot();
    assert.equal(pending.version, 2);
    assert.equal(pending.mimeType, "image/jpeg");
    assert.equal(pending.pendingImport, true);
    assert.equal(pending.notes, "Tasks from chat");
    assert.deepEqual(await readFile(pending.snapshotPath), jpeg);
    assert.deepEqual((await store.pendingImage(2)).bytes, jpeg);
    await assert.rejects(store.pendingImage(1), (error) => error.status === 409);

    const normalized = png();
    const document = { ...emptyDocument(),
        notes: "Tasks from chat", backgroundPngBase64: normalized.toString("base64") };
    assert.equal((await store.save(saveRequest(2, document, normalized))).version, 3);
    assert.deepEqual(await readFile((await store.snapshot()).snapshotPath), normalized);
    assert.deepEqual(await readFile(previous.snapshotPath), png());
    assert.deepEqual(await readFile(pending.snapshotPath), jpeg);
    assert.deepEqual(await store.setNotes(3, ""), { version: 4, notes: "" });
    assert.equal((await store.snapshot()).notes, "");
    await assert.rejects(store.setNotes(3, "stale"), (error) => error.status === 409);
    await assert.rejects(store.importImage(3, jpeg), (error) => error.status === 409);
    assert.deepEqual(versions, [1, 2, 3, 4]);
    unsubscribe();
    await store.addNote("After unsubscribe");
    assert.deepEqual(versions, [1, 2, 3, 4]);
});

test("old submitted boards remain readable until the first new autosave", async (t) => {
    const directory = await temporary(t);
    const document = { ...emptyDocument(), notes: "Old session" };
    const snapshotPath = join(directory, "legacy.png");
    await writeFile(snapshotPath, png());
    await writeFile(join(directory, "board.json"), JSON.stringify({ version: 7, document }));
    await writeFile(join(directory, "last-submission.json"),
        JSON.stringify({ version: 7, snapshotPath, notes: document.notes }));
    assert.deepEqual(await (new SketchStore(directory)).snapshot(),
        { version: 7, snapshotPath, notes: document.notes,
            mimeType: "image/png", pendingImport: false });
});

test("invalid images and notes are rejected without changing the board", async (t) => {
    const invalid = png();
    invalid[30] ^= 1;
    assert.throws(() => decodeSnapshot(invalid.toString("base64")),
        (error) => error.status === 400);
    const malformedBase64 = png().toString("base64").replace(/^./, "_");
    assert.throws(() => decodeSnapshot(malformedBase64),
        (error) => error.status === 400);
    const badStore = new SketchStore(await temporary(t));
    await assert.rejects(badStore.save({
        version: 0, document: emptyDocument(), pngBase64: malformedBase64,
    }), (error) => error.status === 400);
    await assert.rejects(badStore.importImage(0, Buffer.from("not an image")),
        (error) => error.status === 400);
    await assert.rejects(badStore.importImage(0, png(), "x".repeat(10001)),
        (error) => error.status === 400);
    await assert.rejects(badStore.setNotes(0, "x".repeat(10001)),
        (error) => error.status === 400);
    assert.deepEqual(await badStore.snapshot(),
        { version: 0, snapshotPath: null, notes: "", mimeType: null, pendingImport: false });
});

test("loopback server serves assets and validates API writes", async (t) => {
    const directory = await temporary(t);
    const root = join(directory, "wwwroot");
    await mkdir(root);
    await writeFile(join(root, "index.html"), "<h1>Ready</h1>");
    const store = new SketchStore(join(directory, "board"));
    const publisher = { root, status: "ready", error: null, retry() {} };
    const entry = await startCanvasServer({ store, publisher });
    t.after(() => entry.close());
    const origin = entry.url.slice(0, -1);

    const page = await fetch(entry.url);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Ready/);
    assert.equal((await (await fetch(`${origin}/api/state`)).json()).version, 0);
    assert.deepEqual(await (await fetch(`${origin}/api/version`)).json(), { version: 0 });
    const connection = new AbortController();
    t.after(() => connection.abort());
    const events = await fetch(`${origin}/api/events`, { signal: connection.signal });
    assert.equal(events.headers.get("content-type"), "text/event-stream; charset=utf-8");
    const reader = events.body.getReader();
    assert.match(new TextDecoder().decode((await reader.read()).value), /event: board\ndata: 0\n\n/);

    const denied = await fetch(`${origin}/api/state`, {
        method: "PUT", headers: { "Content-Type": "application/json", Origin: "https://example.com" },
        body: JSON.stringify(saveRequest(0, emptyDocument())),
    });
    assert.equal(denied.status, 403);
    const saved = await fetch(`${origin}/api/state`, {
        method: "PUT", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify(saveRequest(0, emptyDocument())),
    });
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).version, 1);
    assert.match(new TextDecoder().decode((await reader.read()).value), /event: board\ndata: 1\n\n/);
    assert.deepEqual(await (await fetch(`${origin}/api/version`)).json(), { version: 1 });
    assert.deepEqual(await readFile((await store.snapshot()).snapshotPath), png());
    const imported = png(240, 160);
    await store.importImage(1, imported, "From chat");
    assert.match(new TextDecoder().decode((await reader.read()).value), /event: board\ndata: 2\n\n/);
    const pending = await fetch(`${origin}/api/import-image?version=2`);
    assert.equal(pending.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await pending.arrayBuffer()), imported);
    assert.equal((await fetch(`${origin}/api/import-image?version=1`)).status, 409);

    const pixels = randomBytes(800 * (1 + 1200 * 4));
    for (let row = 0; row < 800; row++) pixels[row * (1 + 1200 * 4)] = 0;
    const largePng = png(1200, 800, pixels).toString("base64");
    const raster = { ...emptyDocument(), notes: "From chat", backgroundPngBase64: largePng };
    const saveBody = JSON.stringify(saveRequest(2, raster, Buffer.from(largePng, "base64")));
    assert.ok(Buffer.byteLength(saveBody) > 4 * 1024 * 1024);
    const savedRaster = await fetch(`${origin}/api/state`, {
        method: "PUT", headers: { "Content-Type": "application/json", Origin: origin },
        body: saveBody,
    });
    const savedRasterResult = await savedRaster.json();
    assert.equal(savedRaster.status, 200, JSON.stringify(savedRasterResult));
    assert.equal(savedRasterResult.version, 3);
    assert.deepEqual(await readFile((await store.snapshot()).snapshotPath),
        Buffer.from(largePng, "base64"));
    assert.equal((await (await fetch(`${origin}/api/state`)).json()).pendingImport, false);
    const oldBuild = await fetch(`${origin}/api/build`, {
        method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
        body: "{}",
    });
    assert.equal(oldBuild.status, 404);
    connection.abort();
});

test("the loading page reports publish errors and supports retry", async (t) => {
    const store = new SketchStore(await temporary(t));
    const publisher = {
        status: "building", error: null, root: null,
        retry() { this.status = "building"; this.error = null; },
    };
    const entry = await startCanvasServer({ store, publisher });
    t.after(() => entry.close());
    const page = await fetch(entry.url);
    assert.match(await page.text(), /Preparing sketch canvas/);
    publisher.status = "error";
    publisher.error = "dotnet publish failed";
    const status = await (await fetch(`${entry.url}api/status`)).json();
    assert.deepEqual(status, { status: "error", error: "dotnet publish failed" });
    const retry = await fetch(`${entry.url}api/retry`, {
        method: "POST", headers: { Origin: entry.url.slice(0, -1) },
    });
    assert.equal(retry.status, 200);
    assert.equal(publisher.status, "building");
});
