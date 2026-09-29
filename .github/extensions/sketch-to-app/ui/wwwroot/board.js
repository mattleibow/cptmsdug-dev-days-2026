// Deliver version notifications to the Blazor component; C# fetches the actual board.
export function listenForChanges(dotNet) {
    const events = new EventSource("/api/events");
    events.addEventListener("board", (event) => {
        const version = Number(event.data);
        if (!Number.isSafeInteger(version) || version < 0) {
            console.error("Invalid board version from event stream:", event.data);
            return;
        }
        dotNet.invokeMethodAsync("OnBoardChanged", version).catch(console.error);
    });
    events.addEventListener("open", () =>
        dotNet.invokeMethodAsync("OnEventConnectionChanged", true).catch(console.error));
    events.addEventListener("error", () =>
        dotNet.invokeMethodAsync("OnEventConnectionChanged", false).catch(console.error));
    return { close: () => events.close() };
}
