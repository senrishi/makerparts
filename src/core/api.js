import { BUILD_ID } from "./build-info.js";
import { createRequest } from "./messaging.js";
export const api = globalThis.browser || globalThis.chrome;
export const request = createRequest(api.runtime, BUILD_ID);
