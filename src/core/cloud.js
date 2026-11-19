import {
  browserDeviceLabel,
  canonical,
  encodeDevices,
  readDevices,
  updateDevice,
} from "./cloud-projects.js";
import { api } from "./api.js";
import { emptyState, MISC_ID, validateState } from "./model.js";

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

const storage = api.storage.local;

export async function cloudAction(action, library, cloud) {
  let { cloudDevice } = await storage.get("cloudDevice");
  if (action.type === "cloudRenameDevice") {
    const name = action.name.trim();
    if (name.length > 48) throw Error("Use 48 characters or fewer.");
    cloudDevice = { id: cloudDevice?.id ?? crypto.randomUUID(), name };
    const { cloudCatalog } = await storage.get("cloudCatalog");
    if (cloud && Array.isArray(cloudCatalog)) {
      const label = browserDeviceLabel(navigator.userAgent, name);
      await storage.set({
        cloudDevice,
        cloudCatalog: cloudCatalog.map((entry) =>
          entry.id === cloudDevice.id ? { ...entry, label } : entry,
        ),
      });
    } else {
      await storage.set({ cloudDevice });
    }
  }
  if (action.type === "cloudLogout") {
    await storage.remove(["cloud", "cloudCatalog"]);
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
    else {
      cloud = { session };
      await storage.remove("cloudCatalog");
    }
    await storage.set({ cloud });
  }
  if (!cloud) {
    if (["cloudBrowse", "cloudCopy", "cloudDelete"].includes(action.type))
      throw Error("Sign in from Settings to view cloud projects.");
    return status(cloud);
  }
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
    if (!cloudDevice) {
      cloudDevice = { id: crypto.randomUUID() };
      await storage.set({ cloudDevice });
    }
    const label = browserDeviceLabel(navigator.userAgent, cloudDevice.name);
    const { cloudProgress = {} } = await storage.get("cloudProgress");
    const account = session.user.id;
    const previous = cloudProgress[account] || emptyState();
    for (let attempt = 0; attempt < 2; attempt++) {
      const [remote] = await call(
        "/rest/v1/libraries?select=revision,library",
        undefined,
        session.access_token,
      );
      const devices = readDevices(remote?.library || emptyState());
      const original = canonical(devices);
      if (action.type === "cloudCopy") {
        const source = devices.find(
          (device) => device.id === action.deviceId,
        )?.snapshot;
        const project = source?.projects.find(
          (item) => item.id === action.projectId,
        );
        const misc = action.projectId === MISC_ID;
        if (!source || (!project && !misc))
          throw Error("That cloud project is no longer available.");
        const next = structuredClone(library);
        const id = crypto.randomUUID();
        const title = project?.name ?? "Miscellaneous";
        let name = title;
        for (
          let i = 2;
          next.projects.some(
            (item) => item.name.toLowerCase() === name.toLowerCase(),
          );
          i++
        )
          name = `${title} (${i})`;
        next.projects.push({ id, name });
        next.parts.push(
          ...source.parts
            .filter((part) => part.projectId === action.projectId)
            .map((part) => ({
              ...part,
              id: crypto.randomUUID(),
              projectId: id,
            })),
        );
        next.lastProjectId = id;
        await storage.set({ library: validateState(next) });
        return { id };
      }
      let device = devices.find((item) => item.id === cloudDevice.id);
      if (!device) {
        device = { id: cloudDevice.id, label, snapshot: emptyState() };
        devices.push(device);
      }
      device.label = label;
      device.snapshot = updateDevice(device.snapshot, library, previous);
      if (action.type === "cloudDelete") {
        const target = devices.find((item) => item.id === action.deviceId);
        if (target) {
          const { snapshot } = target;
          snapshot.projects = snapshot.projects.filter(
            (p) => p.id !== action.projectId,
          );
          snapshot.parts = snapshot.parts.filter(
            (p) => p.projectId !== action.projectId,
          );
        }
      }
      try {
        const legacyData =
          remote &&
          (!Array.isArray(remote.library.devices) ||
            remote.library.devices.some(({ id }) => id === "legacy"));
        if (legacyData || canonical(devices) !== original) {
          await call(
            "/rest/v1/rpc/save_library",
            {
              expected_revision: remote?.revision ?? 0,
              new_library: encodeDevices(devices),
            },
            session.access_token,
          );
        }
      } catch (error) {
        if (error.status === 409 && attempt === 0) continue;
        throw error;
      }
      cloudProgress[account] = {
        version: 1,
        projects: library.projects,
        parts: library.parts,
      };
      delete cloud.baseline;
      delete cloud.hash;
      delete cloud.revision;
      delete cloud.conflict;
      cloud.reconnect = false;
      cloud.message = "Last synced " + new Date().toLocaleString();
      await storage.set({ cloud, cloudProgress, cloudCatalog: devices });
      if (action.type === "cloudBrowse" || action.type === "cloudDelete")
        return { devices };
      break;
    }
  } catch (error) {
    if (["cloudBrowse", "cloudCopy", "cloudDelete"].includes(action.type))
      throw error;
    delete cloud.conflict;
    cloud.reconnect =
      error.status === 401 ||
      error.message.startsWith("Session expired") ||
      error.message.startsWith("Grant cloud");
    cloud.message = error.message;
    await storage.set({ cloud });
    if (action.type === "cloudRenameDevice")
      return { ...status(cloud), renamePending: true };
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
