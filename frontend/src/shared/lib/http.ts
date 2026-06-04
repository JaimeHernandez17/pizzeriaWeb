export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`Request failed with status ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

function getCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) return null;
  const prefix = name + "=";
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.substring(prefix.length));
    }
  }
  return null;
}

export async function httpRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (!SAFE_METHODS.has(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken && !headers["X-CSRFToken"]) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  const init: RequestInit = {
    method,
    credentials: "include",
    headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text();
    }
    throw new ApiError(response.status, payload);
  }

  return response.json() as Promise<T>;
}

export function httpGet<T>(url: string): Promise<T> {
  return httpRequest<T>(url, { method: "GET" });
}
