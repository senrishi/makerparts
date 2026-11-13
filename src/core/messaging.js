export const RELOAD_MESSAGE =
  "MakerParts was updated. Reload it in chrome://extensions (or about:debugging), close this window, and reopen Save Cart. Your saved library and store cart are unchanged.";
export function createRequest(runtime, buildId) {
  async function send(action) {
    const result = await runtime.sendMessage({
      channel: "makerparts",
      buildId,
      action,
    });
    if (!result)
      throw Error(
        "MakerParts did not respond. Reload the extension and try again.",
      );
    if (result.error)
      throw Error(
        result.error === "Unknown action." ? RELOAD_MESSAGE : result.error,
      );
    if (result.buildId !== buildId) throw Error(RELOAD_MESSAGE);
    return result.state;
  }
  return async (action) => {
    // A legacy background may accept reads but not newer mutation types.
    if (action.type !== "read") await send({ type: "read" });
    return send(action);
  };
}
