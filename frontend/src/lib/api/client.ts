import { getBaseUrl } from "../utils/env";

export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | null | undefined | readonly QueryPrimitive[];
export type QueryParams = Record<string, QueryValue>;

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  query?: QueryParams;
  body?: BodyInit | Record<string, unknown> | null;
};

export class ApiError<TPayload = unknown> extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: TPayload | null,
    readonly response: Response,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function appendQuery(url: URL, query?: QueryParams) {
  if (!query) return;

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, String(entry)));
      return;
    }
    url.searchParams.set(key, String(value));
  });
}

function buildUrl(path: string, query?: QueryParams) {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = path.startsWith("http") ? new URL(path) : new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  appendQuery(url, query);
  return url;
}

function isNativeBody(body: NonNullable<ApiFetchOptions["body"]>) {
  return (
    typeof body !== "object" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    body instanceof ReadableStream
  );
}

function serializeBody(body: ApiFetchOptions["body"]): BodyInit | null | undefined {
  if (!body || isNativeBody(body)) {
    return body as BodyInit | null | undefined;
  }
  return JSON.stringify(body);
}

function shouldSetJsonContentType(body: ApiFetchOptions["body"]) {
  return Boolean(body) && !isNativeBody(body as NonNullable<ApiFetchOptions["body"]>);
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204) return null;
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiFetch<TResponse, TError = unknown>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const { query, body, headers, ...init } = options;
  const response = await fetch(buildUrl(path, query), {
    ...init,
    body: serializeBody(body),
    headers: {
      Accept: "application/json",
      ...(shouldSetJsonContentType(body) ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
  });

  const payload = await parsePayload(response);
  if (!response.ok) {
    const detail = typeof payload === "object" && payload && "detail" in payload ? String(payload.detail) : response.statusText;
    throw new ApiError<TError>(`Request failed (${response.status}): ${detail}`, response.status, payload as TError, response);
  }
  return payload as TResponse;
}
