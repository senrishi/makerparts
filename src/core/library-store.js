import { api } from "./api.js";
import { cloudAction } from "./cloud.js";
import { emptyState, mutate } from "./model.js";
let queue = Promise.resolve();
// Route every mutation through one queue so concurrent windows cannot lose writes.
export function libraryAction(action) {
  const job = queue.then(async () => {
    const data = await api.storage.local.get(["library", "cloud"]);
    const state = data.library || emptyState();
    if (action.type.startsWith("cloud")) {
      const result = await cloudAction(action, state, data.cloud);
      if (action.type === "cloudCopy" && result.id) scheduleSync();
      return result;
    }
    if (action.type === "read") return state;
    const next = mutate(state, action);
    await api.storage.local.set({ library: next });
    if (data.cloud) scheduleSync();
    return next;
  });
  queue = job.catch(() => {});
  return job;
}

let syncQueued = false;
function scheduleSync() {
  if (syncQueued) return;
  syncQueued = true;
  queueMicrotask(() => {
    syncQueued = false;
    libraryAction({ type: "cloudSync" }).catch(console.error);
  });
}
