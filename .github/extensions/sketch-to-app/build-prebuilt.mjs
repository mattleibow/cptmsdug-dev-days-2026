// Regenerate the checked-in browser assets from the current .NET 11 UI source.
import { cp, mkdir, mkdtemp, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fingerprint, publish } from "./canvas-server.mjs";

const extensionDirectory = dirname(fileURLToPath(import.meta.url));
const uiDirectory = join(extensionDirectory, "ui");
const projectPath = join(uiDirectory, "SketchToApp.Web.csproj");
const bundle = join(extensionDirectory, "prebuilt");

async function measure(directory) {
    let bytes = 0;
    let files = 0;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            const result = await measure(path);
            bytes += result.bytes;
            files += result.files;
        } else if (entry.isFile()) {
            bytes += (await stat(path)).size;
            files++;
        }
    }
    return { bytes, files };
}

await mkdir(join(uiDirectory, "obj"), { recursive: true });
const staging = await mkdtemp(join(uiDirectory, "obj", "prebuilt-"));
let preserveStaging = false;
try {
    const hash = await fingerprint(uiDirectory);
    process.stdout.write("Publishing the compact Blazor whiteboard...\n");
    await publish(projectPath, join(staging, "publish"));
    if (hash !== await fingerprint(uiDirectory))
        throw new Error("The UI source changed during publish. Run the command again.");

    const prepared = join(staging, "bundle");
    await cp(join(staging, "publish", "wwwroot"), join(prepared, "wwwroot"), {
        recursive: true,
        filter: (path) => ![".br", ".gz", ".map"].includes(extname(path)),
    });
    await writeFile(join(prepared, "source.hash"), `${hash}\n`);
    const previous = join(staging, "previous");
    let hadPrevious = false;
    try {
        await rename(bundle, previous);
        hadPrevious = true;
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
    try {
        await rename(prepared, bundle);
    } catch (error) {
        if (hadPrevious) {
            try {
                await rename(previous, bundle);
            } catch (rollbackError) {
                preserveStaging = true;
                throw new AggregateError([error, rollbackError],
                    `Could not install or restore the bundle. The previous copy remains at ${previous}.`);
            }
        }
        throw error;
    }
    const { bytes, files } = await measure(join(bundle, "wwwroot"));
    process.stdout.write(`Checked-in UI: ${files} files, ${(bytes / 1048576).toFixed(2)} MiB (source ${hash}).\n`);
} finally {
    if (!preserveStaging)
        await rm(staging, { recursive: true, force: true });
}
