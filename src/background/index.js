import { api } from "../core/api.js";
import { libraryAction } from "../core/library-store.js";
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || message?.channel !== "makerparts") return;
  if (["openCapture", "openCartCapture"].includes(message.action?.type)) {
    if (
      !sender.tab ||
      !/^https:\/\/(www\.)?makerbazar\.in\//.test(sender.tab.url || "")
    ) {
      respond({ error: "This button is only available on MakerBazar." });
      return;
    }
    api.windows
      .create({
        url: api.runtime.getURL(
          `pages/${message.action.type === "openCartCapture" ? "cart" : "popup"}.html?sourceTab=${sender.tab.id}`,
        ),
        type: "popup",
        width: 490,
        height: 660,
      })
      .then(
        () => respond({ ok: true }),
        (error) => respond({ error: error.message }),
      );
    return true;
  }
  const job = libraryAction(message.action);
  job.then(
    (state) => respond({ state }),
    (error) => respond({ error: error.message }),
  );
  return true;
});
