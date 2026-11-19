import { canonical, mergeLibraries } from "./cloud-merge.js";
import { api } from "./api.js";
import { emptyState, validateState } from "./model.js";

export const origin = "https://lwhmajqzjhegqytgfsxb.supabase.co";
const key = "sb_publishable_aycKOuQFmD_IauvMs8JvYw_lJXrPZ4b";
export const dataTypes = [
  "personallyIdentifyingInfo",
  "websiteContent",
  "personalCommunications",
];

async function call(path, body, token) {
  const headers = { apikey: key };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(origin + path, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw Object.assign(
      Error(
        response.status === 409
          ? "Another device is syncing. Retrying shortly."
          : response.status === 401
            ? "Session expired. Sign in again."
            : "Could not complete the cloud request.",
      ),
      { status: response.status },
    );
  return response.json();
}

async function digest(value) {
  const json = canonical(value);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(json),
  );
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

const storage = api.storage.local;

export async function cloudAction(action, library, cloud) {
  if (action.type === "cloudLogout") {
    await storage.remove("cloud");
    return { message: "Signed out. Library available on this device." };
  }
  if (action.type === "cloudStatus") return status(cloud);
  if (action.type === "cloudLogin") {
    await checkConsent();
    const session = await call("/auth/v1/token?grant_type=password", {
      email: action.email,
      password: action.password,
    }).catch((error) => {
      if ([400, 401].includes(error.status))
        throw Error("Sign-in failed. Check your email and password.");
      throw error;
    });
    if (cloud?.session.user.id === session.user.id) cloud.session = session;
    else cloud = { session };
    await storage.set({ cloud });
  }
  if (!cloud) return status(cloud);
  try {
    await checkConsent();
    let session = cloud.session;
    if (session.expires_at * 1000 <= Date.now() + 60_000) {
      session = await call("/auth/v1/token?grant_type=refresh_token", {
        refresh_token: session.refresh_token,
      }).catch((error) => {
        if (error.status === 400)
          throw Error("Session expired. Sign in again.");
        throw error;
      });
      cloud.session = session;
      await storage.set({ cloud });
    }
    const localHash = await digest(library);
    for (let attempt = 0; attempt < 2; attempt++) {
      const [remote] = await call(
        "/rest/v1/libraries?select=revision,library",
        undefined,
        session.access_token,
      );
      const hosted = remote ? validateState(remote.library) : emptyState();
      const hostedHash = await digest(hosted);
      const base =
        cloud.baseline ??
        (cloud.hash === localHash
          ? library
          : cloud.hash === hostedHash
            ? hosted
            : emptyState());
      const next = validateState(mergeLibraries(base, library, hosted));
      const nextHash = await digest(next);
      try {
        if (nextHash !== hostedHash) {
          await call(
            "/rest/v1/rpc/save_library",
            {
              expected_revision: remote?.revision ?? 0,
              new_library: next,
            },
            session.access_token,
          );
        }
      } catch (error) {
        if (error.status === 409 && attempt === 0) continue;
        throw error;
      }
      cloud.baseline = next;
      delete cloud.hash;
      delete cloud.revision;
      delete cloud.conflict;
      cloud.reconnect = false;
      cloud.message = "Last synced " + new Date().toLocaleString();
      await storage.set(
        nextHash === localHash ? { cloud } : { cloud, library: next },
      );
      break;
    }
  } catch (error) {
    delete cloud.conflict;
    cloud.reconnect =
      error.status === 401 ||
      error.message.startsWith("Session expired") ||
      error.message.startsWith("Grant cloud");
    cloud.message = error.message;
    await storage.set({ cloud });
  }
  return status(cloud);
}

function status(cloud) {
  return {
    email: cloud?.session.user.email,
    reconnect: Boolean(cloud?.reconnect),
    message: cloud?.conflict
      ? "Waiting to sync…"
      : cloud?.message || "Sync is off.",
  };
}

async function checkConsent() {
  const request = { origins: [origin + "/*"] };
  if (
    api.runtime.getManifest().browser_specific_settings?.gecko
      ?.data_collection_permissions?.optional
  )
    request.data_collection = dataTypes;
  if (!(await api.permissions.contains(request)))
    throw Error("Grant cloud sync access in Settings to continue.");
}
