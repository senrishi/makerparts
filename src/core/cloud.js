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
          ? "Hosted library changed. Sync again to review it."
          : response.status === 401
            ? "Session expired. Sign in again."
            : "Could not complete the cloud request.",
      ),
      { status: response.status },
    );
  return response.json();
}

async function digest(value) {
  const json = JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
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
    const [remote] = await call(
      "/rest/v1/libraries?select=revision,library",
      undefined,
      session.access_token,
    );
    const remoteLibrary = remote ? validateState(remote.library) : emptyState();
    const revision = remote?.revision ?? 0;
    const localHash = await digest(library);
    const remoteHash = await digest(remoteLibrary);
    const localChanged = cloud.hash
      ? cloud.hash !== localHash
      : Boolean(library.projects.length || library.parts.length);
    const remoteChanged =
      cloud.revision !== undefined
        ? cloud.revision !== revision
        : Boolean(remote);
    const resolution = ["cloudUseLocal", "cloudUseRemote"].includes(
      action.type,
    );
    if (
      (resolution &&
        (cloud.conflict?.revision !== revision ||
          cloud.conflict?.localHash !== localHash)) ||
      (!resolution && localHash !== remoteHash && localChanged && remoteChanged)
    ) {
      cloud.conflict = { revision, localHash };
      cloud.message =
        "Both copies differ. Choose which library to keep in Settings.";
      await storage.set({ cloud });
      return status(cloud);
    }
    let next = library;
    let nextRevision = revision;
    if (localHash !== remoteHash) {
      if (action.type === "cloudUseLocal" || (!resolution && localChanged)) {
        nextRevision = await call(
          "/rest/v1/rpc/save_library",
          {
            expected_revision: revision,
            new_library: library,
          },
          session.access_token,
        );
      } else next = remoteLibrary;
    }
    cloud.revision = nextRevision;
    cloud.hash = next === library ? localHash : remoteHash;
    cloud.conflict = undefined;
    cloud.reconnect = false;
    cloud.message = "Last synced " + new Date().toLocaleString();
    await storage.set(next === library ? { cloud } : { cloud, library: next });
  } catch (error) {
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
    conflict: Boolean(cloud?.conflict),
    message: cloud?.message || "Sync is off.",
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
