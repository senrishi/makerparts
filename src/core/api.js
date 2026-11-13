export const api = globalThis.browser || globalThis.chrome;
export async function request(action) {
  const result = await api.runtime.sendMessage({
    channel: "makerparts",
    action,
  });
  if (result.error) throw Error(result.error);
  return result.state;
}
