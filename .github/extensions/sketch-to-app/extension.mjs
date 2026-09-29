// Register the project canvas and its chat actions with the Copilot session.
// The Node helpers host/persist the board; Blazor handles drawing in the browser.
import { readFile, realpath, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { startCanvasServer, UiPublisher } from "./canvas-server.mjs";
import { HttpError, SketchStore } from "./document-store.mjs";

const extensionDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(extensionDirectory, "..", "..", "..");
const servers = new Map();
let store;
let publisher;

function isWithin(root, path) {
    const suffix = relative(root, path);
    return !isAbsolute(suffix) && suffix !== ".." && !suffix.startsWith(`..${sep}`);
}

// Allow chat imports from this repository or the session's attachment/artifact area.
async function imagePath(path) {
    if (typeof path !== "string" || !path.trim())
        throw new CanvasError("invalid_image_path", "Provide a PNG or JPEG file path.");
    const fullPath = await realpath(isAbsolute(path) ? path : resolve(repositoryDirectory, path));
    const roots = await Promise.all([repositoryDirectory, session.workspacePath]
        .filter(Boolean).map((root) => realpath(root)));
    if (!roots.some((root) => isWithin(root, fullPath))) {
        throw new CanvasError("image_path_denied",
            "Images must be in the repository or this session's files. Copy the image there first.");
    }
    const info = await stat(fullPath);
    if (!info.isFile() || info.size === 0 || info.size > 8 * 1024 * 1024)
        throw new CanvasError("invalid_image_file", "Choose a nonempty PNG or JPEG under 8 MiB.");
    return fullPath;
}

// Resolve a new repository-relative PNG and sibling Markdown path without following symlinks out.
async function exportPaths(path) {
    if (typeof path !== "string" || !path.trim() || path.includes("\0") || isAbsolute(path.trim())) {
        throw new CanvasError("invalid_export_path",
            "Provide a repository-relative base path or .png path.");
    }
    const requested = path.trim();
    const extension = extname(requested);
    if (extension && extension.toLowerCase() !== ".png") {
        throw new CanvasError("invalid_export_path", "The export path must have no extension or end in .png.");
    }
    const imagePath = resolve(repositoryDirectory, extension ? requested : `${requested}.png`);
    if (!isWithin(repositoryDirectory, imagePath) || !basename(imagePath, extname(imagePath))) {
        throw new CanvasError("export_path_denied", "The export path must stay inside the repository.");
    }

    let ancestor = dirname(imagePath);
    while (true) {
        try {
            ancestor = await realpath(ancestor);
            break;
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw new CanvasError("invalid_export_path", "The export directory is not usable.");
            }
            const parent = dirname(ancestor);
            if (parent === ancestor) {
                throw new CanvasError("invalid_export_path", "The export directory is not usable.");
            }
            ancestor = parent;
        }
    }
    const root = await realpath(repositoryDirectory);
    if (!isWithin(root, ancestor) || !(await stat(ancestor)).isDirectory()) {
        throw new CanvasError("export_path_denied", "The export path must stay inside the repository.");
    }

    const markdownPath = imagePath.slice(0, -extname(imagePath).length) + ".md";
    return { imagePath, markdownPath };
}

// Turn validated board conflicts and invalid input into named canvas errors.
async function canvasAction(operation) {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof HttpError)
            throw new CanvasError(error.code ??
                (error.status === 409 ? "board_conflict" : "invalid_board"), error.message);
        throw error;
    }
}

const session = await joinSession({
    canvases: [
        createCanvas({
            id: "sketch-to-app",
            displayName: "Sketch to app",
            description: "A shared sketch and notes whiteboard. Chat can view or export its PNG and notes, load an image, and edit notes; drawing auto-saves.",
            inputSchema: { type: "object", additionalProperties: false },
            actions: [
                {
                    name: "get_snapshot",
                    description: "Get the current image path, notes, and version without starting a build. View the returned path to see the pixels; null means blank. A pending import may still be a JPEG until the panel normalizes it.",
                    inputSchema: { type: "object", additionalProperties: false },
                    // Expose an immutable image without sending a build message.
                    handler: async () => {
                        if (!store) {
                            throw new CanvasError("workspace_unavailable", "A session workspace is required to store sketches.");
                        }
                        return store.snapshot();
                    },
                },
                {
                    name: "export_board",
                    description: "Export the current board as a version-matched PNG and Markdown notes sidecar. Path is repository-relative and may be a base path or end in .png. Existing files are never overwritten.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string", minLength: 1, maxLength: 240,
                                description: "Repository-relative base path or .png path.",
                            },
                        },
                        required: ["path"],
                        additionalProperties: false,
                    },
                    handler: async (ctx) => {
                        if (!store) {
                            throw new CanvasError("workspace_unavailable",
                                "A session workspace is required to store sketches.");
                        }
                        const { imagePath, markdownPath } = await exportPaths(ctx.input.path);
                        return canvasAction(() => store.exportBoard(imagePath, markdownPath));
                    },
                },
                {
                    name: "import_image",
                    description: "Load a PNG/JPEG from the repository or this session's files into the whiteboard. Pass expectedVersion from get_snapshot; optional notes replaces current notes. Replaces pixels without a confirmation prompt; the panel fits and auto-saves the image.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            path: { type: "string", minLength: 1 },
                            expectedVersion: { type: "integer", minimum: 0 },
                            notes: { type: "string", maxLength: 10000 },
                        },
                        required: ["path", "expectedVersion"],
                        additionalProperties: false,
                    },
                    // Queue a source image for Blazor to normalize when the panel is available.
                    handler: async (ctx) => {
                        if (!store)
                            throw new CanvasError("workspace_unavailable", "A session workspace is required to store sketches.");
                        const path = await imagePath(ctx.input.path);
                        return canvasAction(async () =>
                            store.importImage(ctx.input.expectedVersion, await readFile(path), ctx.input.notes));
                    },
                },
                {
                    name: "set_notes",
                    description: "Replace the whiteboard notes, including with an empty string. Pass expectedVersion from get_snapshot to avoid overwriting another edit.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            expectedVersion: { type: "integer", minimum: 0 },
                            notes: { type: "string", maxLength: 10000 },
                        },
                        required: ["expectedVersion", "notes"],
                        additionalProperties: false,
                    },
                    // Replace notes without changing the pixels.
                    handler: async (ctx) => {
                        if (!store)
                            throw new CanvasError("workspace_unavailable", "A session workspace is required to store sketches.");
                        return canvasAction(() => store.setNotes(ctx.input.expectedVersion, ctx.input.notes));
                    },
                },
                {
                    name: "add_note",
                    description: "Append a note to the canvas Notes for Copilot box without replacing existing notes or building the app.",
                    inputSchema: {
                        type: "object",
                        properties: { text: { type: "string", minLength: 1, maxLength: 10000 } },
                        required: ["text"],
                        additionalProperties: false,
                    },
                    // Append rather than replace the user's existing notes.
                    handler: async (ctx) => {
                        if (!store) {
                            throw new CanvasError("workspace_unavailable", "A session workspace is required to store sketches.");
                        }
                        return canvasAction(() => store.addNote(ctx.input.text));
                    },
                },
            ],
            // Serve the canvas UI once per panel; reopen an existing panel on demand.
            open: async (ctx) => {
                if (!store) {
                    throw new CanvasError("workspace_unavailable", "A session workspace is required to store sketches.");
                }
                publisher.start();
                let entry = servers.get(ctx.instanceId);
                if (!entry) {
                    entry = startCanvasServer({ store, publisher });
                    servers.set(ctx.instanceId, entry);
                    entry.catch(() => servers.delete(ctx.instanceId));
                }
                const { url } = await entry;
                return { title: "Sketch to app", url };
            },
            // Release the panel's loopback server when it closes.
            onClose: async (ctx) => {
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    servers.delete(ctx.instanceId);
                    await (await entry).close();
                }
            },
        }),
    ],
});

if (session.workspacePath) {
    const directory = join(session.workspacePath, "files", "sketch-to-app");
    store = new SketchStore(directory);
    publisher = new UiPublisher(
        join(extensionDirectory, "ui", "SketchToApp.Web.csproj"),
        directory,
        // Surface publish errors in chat rather than writing to RPC stdout.
        (error) => {
            void session.log(`Sketch canvas build failed: ${error.message}`, { level: "error" })
                .catch((logError) => process.stderr.write(`${logError}\n`));
        },
    );
}
