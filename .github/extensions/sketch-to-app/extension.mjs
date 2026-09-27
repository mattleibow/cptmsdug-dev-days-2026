import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { startCanvasServer, UiPublisher } from "./canvas-server.mjs";
import { SketchStore } from "./document-store.mjs";

const extensionDirectory = dirname(fileURLToPath(import.meta.url));
const servers = new Map();
let store;
let publisher;

const session = await joinSession({
    canvases: [
        createCanvas({
            id: "sketch-to-app",
            displayName: "Sketch to app",
            description: "Draw a live screen sketch and send its complete snapshot to this Copilot session to build or update an app.",
            inputSchema: { type: "object", additionalProperties: false },
            actions: [
                {
                    name: "get_snapshot",
                    description: "Read the path and notes of the latest full sketch snapshot submitted from the canvas.",
                    inputSchema: { type: "object", additionalProperties: false },
                    handler: async () => {
                        if (!store) {
                            throw new CanvasError("workspace_unavailable", "A session workspace is required to store sketches.");
                        }
                        const latest = await store.latest();
                        if (!latest) {
                            throw new CanvasError("no_sketch_snapshot", "No sketch has been submitted yet.");
                        }
                        return latest;
                    },
                },
            ],
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
    store = new SketchStore(directory, (options) => session.send(options));
    publisher = new UiPublisher(
        join(extensionDirectory, "ui", "SketchToApp.Web.csproj"),
        directory,
        (error) => {
            void session.log(`Sketch canvas build failed: ${error.message}`, { level: "error" })
                .catch((logError) => process.stderr.write(`${logError}\n`));
        },
    );
}
