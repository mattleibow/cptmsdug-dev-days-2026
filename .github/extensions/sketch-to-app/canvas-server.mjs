// Host the Blazor canvas on loopback, publish it on first open, and expose board APIs.
// This Node server owns HTTP and filesystem access that browser-side Blazor cannot use.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { HttpError } from "./document-store.mjs";

const MIME = {
    ".css": "text/css",
    ".dat": "application/octet-stream",
    ".dll": "application/octet-stream",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
    ".webcil": "application/octet-stream",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};
const TEXT_SOURCE_EXTENSIONS = new Set([
    ".cs", ".csproj", ".css", ".html", ".js", ".json", ".props", ".razor", ".svg", ".targets", ".xml",
]);

const LOADING_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Preparing sketch canvas</title>
<style>
body { margin: 0; padding: 2rem; background: var(--background-color-default, #fff); color: var(--text-color-default, #1f2328); font: var(--text-body-medium, 14px) var(--font-sans, sans-serif); }
main { max-width: 36rem; margin: 3rem auto; } button { padding: .5rem 1rem; } pre { white-space: pre-wrap; overflow-wrap: anywhere; }
</style></head>
<body><main><h1>Preparing sketch canvas</h1><p id="message">Publishing the .NET 10 Blazor WebAssembly app for this session...</p><pre id="error"></pre><button id="retry" hidden>Retry build</button></main>
<script>
// Poll until the published Blazor app can replace this temporary page.
async function check() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot check build status: HTTP " + response.status);
    const result = await response.json();
    if (result.status === "ready") { location.reload(); return; }
    if (result.status === "error") {
      document.getElementById("message").textContent = "The canvas could not be published.";
      document.getElementById("error").textContent = result.error;
      document.getElementById("retry").hidden = false;
      return;
    }
    setTimeout(check, 1000);
  } catch (error) {
    document.getElementById("error").textContent = String(error);
    document.getElementById("retry").hidden = false;
  }
}
// Allow retrying a failed publish without closing the canvas.
document.getElementById("retry").onclick = async () => {
  document.getElementById("retry").hidden = true;
  document.getElementById("error").textContent = "";
  try {
    const response = await fetch("/api/retry", { method: "POST" });
    if (!response.ok) throw new Error("Build retry failed: HTTP " + response.status);
    check();
  } catch (error) {
    document.getElementById("error").textContent = String(error);
    document.getElementById("retry").hidden = false;
  }
};
check();
</script></body></html>`;

// Hash UI source files so unchanged builds can reuse their published output.
export async function fingerprint(directory) {
    const hash = createHash("sha256");
    // Include the paths and contents of source files, but not build output.
    async function visit(path, relativePath) {
        const entries = (await readdir(path, { withFileTypes: true }))
            .filter((entry) => !["bin", "obj", "node_modules", ".git"].includes(entry.name))
            .sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            const name = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            const full = join(path, entry.name);
            if (entry.isDirectory()) {
                await visit(full, name);
            } else if (entry.isFile()) {
                hash.update(name);
                const bytes = await readFile(full);
                hash.update(TEXT_SOURCE_EXTENSIONS.has(extname(name).toLowerCase())
                    ? Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n")) : bytes);
            }
        }
    }
    await visit(directory, "");
    return hash.digest("hex").slice(0, 20);
}

// Run the .NET publisher and report its diagnostics on failure.
export function publish(projectPath, destination) {
    return new Promise((resolve, reject) => {
        const args = ["publish", projectPath, "-c", "Release", "-o", destination, "--nologo", "-v", "quiet"];
        const child = spawn("dotnet", args, { windowsHide: true });
        let output = "";
        for (const stream of [child.stdout, child.stderr]) {
            stream.on("data", (chunk) => {
                output = (output + chunk.toString()).slice(-12000);
            });
        }
        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`dotnet publish exited with code ${code}:\n${output}`));
        });
    });
}

// Prefer the matching checked-in UI; otherwise publish once per source version.
export class UiPublisher {
    #running = null;

    // Configure the project and session artifact directory for publishing.
    constructor(projectPath, artifactDirectory, reportError = () => {}) {
        this.projectPath = projectPath;
        this.artifactDirectory = artifactDirectory;
        this.reportError = reportError;
        this.status = "building";
        this.error = null;
        this.root = null;
    }

    // Publish once, or reuse a completed build with the same source hash.
    start() {
        if (this.#running || this.status === "ready") return this.#running;
        this.status = "building";
        this.error = null;
        this.#running = (async () => {
            const hash = await fingerprint(dirname(this.projectPath));
            const bundled = join(dirname(this.projectPath), "..", "prebuilt");
            try {
                const bundledHash = (await readFile(join(bundled, "source.hash"), "utf8")).trim();
                if (bundledHash === hash) {
                    await access(join(bundled, "wwwroot", "index.html"));
                    this.root = join(bundled, "wwwroot");
                    this.status = "ready";
                    return;
                }
            } catch (error) {
                if (error.code !== "ENOENT") throw error;
            }
            const output = join(this.artifactDirectory, "published", hash);
            const index = join(output, "wwwroot", "index.html");
            const marker = join(output, ".ready");
            try {
                await access(marker);
                await access(index);
            } catch (error) {
                if (error.code !== "ENOENT") throw error;
                await mkdir(output, { recursive: true });
                await publish(this.projectPath, output);
                await access(index);
                await writeFile(marker, hash);
            }
            this.root = join(output, "wwwroot");
            this.status = "ready";
        })().catch((error) => {
            this.error = error.message;
            this.status = "error";
            this.reportError(error);
        }).finally(() => {
            this.#running = null;
        });
        return this.#running;
    }

    // Restart publishing only after a failed attempt.
    retry() {
        if (this.status === "error") this.start();
    }
}

// Send a non-cached JSON response to the canvas browser.
function reply(res, status, value) {
    const body = JSON.stringify(value);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
}

// Enforce content type and request size before parsing an upload.
async function requestJson(req, limit) {
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] ?? "")) {
        throw new HttpError(415, "Expected Content-Type: application/json.");
    }
    if (Number(req.headers["content-length"]) > limit) {
        throw new HttpError(413, "Request body is too large.");
    }
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
        size += chunk.length;
        if (size > limit) throw new HttpError(413, "Request body is too large.");
        chunks.push(chunk);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch (error) {
        if (error instanceof SyntaxError) throw new HttpError(400, "Invalid JSON.");
        throw error;
    }
}

// Serve only files under the published UI directory.
async function staticFile(req, res, publisher, pathname) {
    if (publisher.status !== "ready") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        res.end(LOADING_HTML);
        return;
    }
    let decoded;
    try {
        decoded = decodeURIComponent(pathname);
    } catch (error) {
        if (error instanceof URIError) throw new HttpError(400, "Invalid URL encoding.");
        throw error;
    }
    const segments = decoded.split("/").filter(Boolean);
    if (!decoded.startsWith("/") || segments.some((part) =>
        part === "." || part === ".." || part.includes("\\") || part.includes(":") || part.includes("\0"))) {
        throw new HttpError(400, "Invalid asset path.");
    }
    const file = join(publisher.root, ...(segments.length ? segments : ["index.html"]));
    let info;
    try {
        info = await stat(file);
    } catch (error) {
        if (error.code === "ENOENT") throw new HttpError(404, "Asset not found.");
        throw error;
    }
    if (!info.isFile()) throw new HttpError(404, "Asset not found.");
    res.writeHead(200, {
        "Content-Type": `${MIME[extname(file).toLowerCase()] ?? "application/octet-stream"}${extname(file) === ".html" || extname(file) === ".js" || extname(file) === ".css" ? "; charset=utf-8" : ""}`,
        "Content-Length": info.size,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
    });
    createReadStream(file).on("error", (error) => res.destroy(error)).pipe(res);
}

// Start a loopback-only server for one canvas panel.
export async function startCanvasServer({ store, publisher }) {
    const subscribers = new Set();
    // Announce changed versions to every open browser panel.
    const unsubscribe = store.subscribe((version) => {
        for (const res of subscribers) {
            if (res.destroyed) {
                subscribers.delete(res);
            } else {
                try {
                    if (!res.write(`event: board\ndata: ${version}\n\n`)) {
                        subscribers.delete(res);
                        res.end();
                    }
                } catch (error) {
                    subscribers.delete(res);
                    process.stderr.write(`Sketch event stream failed: ${error}\n`);
                    res.destroy();
                }
            }
        }
    });
    // Route canvas API requests and static UI assets.
    const server = createServer(async (req, res) => {
        try {
            const host = `127.0.0.1:${server.address().port}`;
            if (req.headers.host !== host) throw new HttpError(403, "Invalid canvas host.");
            const pathname = (req.url ?? "/").split("?")[0];
            if (req.method === "GET" && pathname === "/api/status") {
                reply(res, 200, { status: publisher.status, error: publisher.error });
            } else if (req.method === "GET" && pathname === "/api/state") {
                reply(res, 200, await store.state());
            } else if (req.method === "GET" && pathname === "/api/version") {
                reply(res, 200, await store.version());
            } else if (req.method === "GET" && pathname === "/api/events") {
                res.writeHead(200, {
                    "Content-Type": "text/event-stream; charset=utf-8",
                    "Cache-Control": "no-cache, no-transform",
                    "X-Content-Type-Options": "nosniff",
                });
                subscribers.add(res);
                req.on("close", () => subscribers.delete(res));
                const { version } = await store.version();
                res.write(`event: board\ndata: ${version}\n\n`);
            } else if (req.method === "GET" && pathname === "/api/import-image") {
                const parameter = new URL(req.url, `http://${host}`).searchParams.get("version");
                if (!parameter || !/^\d+$/.test(parameter))
                    throw new HttpError(400, "A pending image version is required.");
                const { bytes, mimeType } = await store.pendingImage(Number(parameter));
                res.writeHead(200, {
                    "Content-Type": mimeType,
                    "Content-Length": bytes.length,
                    "Cache-Control": "no-store",
                    "X-Content-Type-Options": "nosniff",
                });
                res.end(bytes);
            } else if (["PUT", "POST"].includes(req.method) && pathname.startsWith("/api/")) {
                if (req.headers.origin !== `http://${host}`) {
                    throw new HttpError(403, "Invalid canvas origin.");
                }
                if (pathname === "/api/state" && req.method === "PUT") {
                    reply(res, 200, await store.save(await requestJson(req, 32 * 1024 * 1024)));
                } else if (pathname === "/api/retry" && req.method === "POST") {
                    publisher.retry();
                    reply(res, 200, { status: publisher.status });
                } else {
                    throw new HttpError(404, "Unknown canvas endpoint.");
                }
            } else if (req.method === "GET") {
                await staticFile(req, res, publisher, pathname);
            } else {
                throw new HttpError(405, "Method not allowed.");
            }
        } catch (error) {
            if (res.headersSent) {
                res.destroy(error);
            } else {
                reply(res, error instanceof HttpError ? error.status : 500,
                    { error: error instanceof Error ? error.message : String(error) });
            }
        }
    });
    try {
        await new Promise((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", () => {
                server.off("error", reject);
                resolve();
            });
        });
    } catch (error) {
        unsubscribe();
        throw error;
    }
    return {
        server,
        url: `http://127.0.0.1:${server.address().port}/`,
        // End SSE streams so the panel server can close promptly.
        close: () => {
            unsubscribe();
            for (const res of subscribers)
                res.end();
            subscribers.clear();
            return new Promise((resolve, reject) =>
                server.close((error) => error ? reject(error) : resolve()));
        },
    };
}
