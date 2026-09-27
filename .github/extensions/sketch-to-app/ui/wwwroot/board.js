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

export function downloadJson(filename, json) {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
