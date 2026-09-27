import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import { startCanvasServer } from "../canvas-server.mjs";
import { decodeSnapshot, emptyDocument, HttpError, SketchStore, validateDocument } from "../document-store.mjs";

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

function chunk(type, data) {
    const name = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, checksum]);
}

function png() {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(1200);
    ihdr.writeUInt32BE(800, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const pixels = Buffer.alloc(800 * (1 + 1200 * 4));
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(pixels)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

async function temporary(t) {
    const directory = await mkdtemp(join(tmpdir(), `sketch-to-app-${randomUUID()}-`));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
}

test("board state persists across store instances and rejects stale writes", async (t) => {
    const directory = await temporary(t);
    const first = new SketchStore(directory, async () => "unused");
    assert.deepEqual(await first.state(), { version: 0, document: emptyDocument() });
    const document = { ...emptyDocument(), notes: "Add a login button" };
    assert.deepEqual(await first.save({ version: 0, document }), { version: 1, document });
    const second = new SketchStore(directory, async () => "unused");
    assert.deepEqual(await second.state(), { version: 1, document });
    await assert.rejects(first.save({ version: 0, document }),
        (error) => error instanceof HttpError && error.status === 409);
    assert.equal((await first.save({ version: 1, document })).version, 2);
});

test("concurrent writes are serialized and invalid sketches are rejected", async (t) => {
    const store = new SketchStore(await temporary(t), async () => "unused");
    const document = emptyDocument();
    await assert.rejects(store.save(null), (error) => error.status === 400);
    const results = await Promise.allSettled([
        store.save({ version: 0, document }),
        store.save({ version: 0, document }),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), ["fulfilled", "rejected"]);
    await assert.rejects(store.save({ version: 1, document: {
        ...document, strokes: [{ tool: "pen", color: "#000000", size: 3,
            points: [{ x: -1, y: 20 }] }],
    } }), (error) => error.status === 400);
});

test("both portable example sketches conform to the same saved board format", async (t) => {
    const store = new SketchStore(await temporary(t), async () => "unused");
    let version = 0;
    for (const name of ["login-flow", "task-list"]) {
        const source = new URL(`../../../../examples/sketches/${name}.json`, import.meta.url);
        const document = validateDocument(JSON.parse(await readFile(source, "utf8")));
        const saved = await store.save({ version, document });
        version = saved.version;
        assert.deepEqual((await store.state()).document, document);
    }
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

test("each build sends a complete immutable PNG and all current notes", async (t) => {
    const directory = await temporary(t);
    const sent = [];
    const store = new SketchStore(directory, async (request) => {
        sent.push(request);
        return `message-${sent.length}`;
    });
    const image = png();
    const pngBase64 = image.toString("base64");
    assert.deepEqual(decodeSnapshot(pngBase64), image);
    const initial = { ...emptyDocument(), notes: "Login with two inputs" };
    const first = await store.build({ version: 0, document: initial, pngBase64 });
    assert.equal(first.version, 1);
    assert.deepEqual(await readFile(first.snapshotPath), image);
    assert.match(sent[0].prompt, /COMPLETE current sketch/);
    assert.match(sent[0].prompt, /Login with two inputs/);
    assert.deepEqual(sent[0].attachments, [{
        type: "blob", mimeType: "image/png", data: pngBase64, displayName: "sketch.png",
    }]);
    const updated = { ...initial, notes: "Login with two inputs AND a button" };
    const second = await store.build({ version: 1, document: updated, pngBase64 });
    assert.notEqual(first.snapshotPath, second.snapshotPath);
    assert.match(sent[1].prompt, /two inputs AND a button/);
    assert.deepEqual(await readFile(first.snapshotPath), image);
    assert.deepEqual(await store.latest(), second);
});

test("invalid PNGs and failed sends are surfaced, not reported as success", async (t) => {
    const invalid = png();
    invalid[30] ^= 1;
    assert.throws(() => decodeSnapshot(invalid.toString("base64")),
        (error) => error.status === 400);
    const store = new SketchStore(await temporary(t), async () => {
        throw new Error("Session is disconnected");
    });
    await assert.rejects(store.build({
        version: 0, document: emptyDocument(), pngBase64: png().toString("base64"),
    }), /Session is disconnected/);
    assert.equal((await store.state()).version, 0);
    assert.equal(await store.latest(), null);
    await assert.rejects(store.build({
        version: 0, document: emptyDocument(), pngBase64: png().toString("base64"),
    }), /Session is disconnected/);
});

test("loopback server serves assets and validates API writes", async (t) => {
    const directory = await temporary(t);
    const root = join(directory, "wwwroot");
    await mkdir(root);
    await writeFile(join(root, "index.html"), "<h1>Ready</h1>");
    const store = new SketchStore(join(directory, "board"), async () => "message-id");
    const publisher = { root, status: "ready", error: null, retry() {} };
    const entry = await startCanvasServer({ store, publisher });
    t.after(() => entry.close());
    const origin = entry.url.slice(0, -1);

    const page = await fetch(entry.url);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Ready/);
    assert.equal((await (await fetch(`${origin}/api/state`)).json()).version, 0);

    const denied = await fetch(`${origin}/api/state`, {
        method: "PUT", headers: { "Content-Type": "application/json", Origin: "https://example.com" },
        body: JSON.stringify({ version: 0, document: emptyDocument() }),
    });
    assert.equal(denied.status, 403);
    const saved = await fetch(`${origin}/api/state`, {
        method: "PUT", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ version: 0, document: emptyDocument() }),
    });
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).version, 1);
    const built = await fetch(`${origin}/api/build`, {
        method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({
            version: 1, document: emptyDocument(), pngBase64: png().toString("base64"),
        }),
    });
    assert.equal(built.status, 200);
    assert.equal((await built.json()).messageId, "message-id");
});

test("the loading page reports publish errors and supports retry", async (t) => {
    const store = new SketchStore(await temporary(t), async () => "unused");
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
