// Map pointer coordinates onto any logical canvas size and manage pointer capture.
export function point(board, clientX, clientY, width, height) {
    const rect = board.getBoundingClientRect();
    if (!rect.width || !rect.height)
        throw new Error("The drawing surface has no size.");
    return {
        x: Math.max(0, Math.min(width, (clientX - rect.left) * width / rect.width)),
        y: Math.max(0, Math.min(height, (clientY - rect.top) * height / rect.height)),
    };
}

export function start(board, pointerId, clientX, clientY, width, height) {
    board.querySelector(".pointer-layer").setPointerCapture(pointerId);
    return point(board, clientX, clientY, width, height);
}

export function end(board, pointerId) {
    const layer = board.querySelector(".pointer-layer");
    if (layer.hasPointerCapture(pointerId))
        layer.releasePointerCapture(pointerId);
}
