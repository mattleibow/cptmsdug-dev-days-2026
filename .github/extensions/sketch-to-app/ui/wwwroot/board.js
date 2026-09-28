function point(board, clientX, clientY) {
    const rect = board.getBoundingClientRect();
    return {
        x: Math.max(0, Math.min(1200, (clientX - rect.left) * 1200 / rect.width)),
        y: Math.max(0, Math.min(800, (clientY - rect.top) * 800 / rect.height)),
    };
}

export function start(board, pointerId, clientX, clientY) {
    board.querySelector(".pointer-layer").setPointerCapture(pointerId);
    return point(board, clientX, clientY);
}

export { point };

export function end(board, pointerId) {
    const layer = board.querySelector(".pointer-layer");
    if (layer.hasPointerCapture(pointerId))
        layer.releasePointerCapture(pointerId);
}

export function downloadPng(filename, base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
