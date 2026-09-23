import type { ApiError, Change, ValidationProblem } from "./generated/koya.ts";

/** What a client hands every generated call: where the server is and how to authenticate. */
export interface Transport {
  baseUrl: string;
  deliveryKey?: string | undefined;
  managementKey?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
}

// optional only because the generated calls take their options optionally; the
// clients always pass it
export type KoyaRequestInit = RequestInit & { transport?: Transport };

/** A non-2xx answer from the server, carrying its `{"error": {...}}` body. */
export class KoyaError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ValidationProblem[] | Change[] | undefined;

  constructor(status: number, code: string, message: string, details?: ValidationProblem[] | Change[]) {
    super(message);
    this.name = "KoyaError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function authHeaders(path: string, transport: Transport): Record<string, string> {
  if (path.startsWith("/api/")) {
    if (!transport.deliveryKey) throw new Error("koya-ts-sdk: the delivery API needs a deliveryKey");
    return { "X-KOYA-DELIVERY-KEY": transport.deliveryKey };
  }
  if (path.startsWith("/admin/api/")) {
    if (!transport.managementKey) throw new Error("koya-ts-sdk: the admin API needs a managementKey");
    return { Authorization: `Bearer ${transport.managementKey}` };
  }
  return {};
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && typeof (value as ApiError).error?.code === "string";
}

/** The mutator every generated call goes through (see orval.config.ts). */
export async function koyaFetch<T>(path: string, init: KoyaRequestInit): Promise<T> {
  const { transport, ...request } = init;
  if (!transport) throw new Error("koya-ts-sdk: call the API through createClient or createAdminClient");
  const headers = new Headers(request.headers);
  headers.set("Accept", "application/json");
  for (const [name, value] of Object.entries(authHeaders(path, transport))) headers.set(name, value);

  const fetch = transport.fetch ?? globalThis.fetch;
  const response = await fetch(transport.baseUrl.replace(/\/+$/, "") + path, { ...request, headers });
  const text = await response.text();
  const json = response.headers.get("content-type")?.includes("application/json") && text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    if (isApiError(json)) {
      throw new KoyaError(response.status, json.error.code, json.error.message, json.error.details);
    }
    throw new KoyaError(response.status, "http_error", `HTTP ${response.status}`);
  }
  return (json ?? text) as T;
}
