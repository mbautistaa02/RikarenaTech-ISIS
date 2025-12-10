import { formatErrorMessage, showToast } from "@/lib/toast";

const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "";

const API_BASE_URL = rawApiUrl
  ? rawApiUrl.toString().replace(/\/$/, "")
  : `${window.location.origin}/api`;

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions<TBody> {
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const errorMessages = {
  offline: "No hay conexión. Verifica tu red.",
  unauthorized:
    "Debes iniciar sesión para continuar. Inicia sesión e inténtalo de nuevo.",
  forbidden: "No tienes permisos para esta acción.",
  notFound: "Recurso no encontrado.",
  server: "Error del servidor. Intenta más tarde.",
  generic: "Ocurrió un error. Intenta nuevamente.",
};

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<TResponse, TBody = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${path}`;
    const { body, headers, signal } = options;
    const isFormData = body instanceof FormData;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...headers,
        },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (err) {
      if (signal?.aborted) {
        throw err;
      }
      showToast("error", errorMessages.offline);
      throw err;
    }

    // No content
    if (res.status === 204) {
      return {} as TResponse;
    }

    let raw: unknown;
    try {
      raw = await res.json();
    } catch {
      const message = res.ok && res.status === 204 ? "" : errorMessages.generic;
      if (!res.ok) {
        showToast("error", message);
        throw new Error(message);
      }
      return {} as TResponse;
    }

    if (!res.ok) {
      const payload = raw as { detail?: string; message?: string };
      const message =
        mapStatusToMessage(res.status, payload.detail || payload.message) ||
        formatErrorMessage(payload.detail || payload.message || res.statusText);
      showToast("error", message);
      throw new Error(message);
    }

    const normalized =
      typeof raw === "object" &&
      raw !== null &&
      "success" in raw &&
      "data" in raw
        ? (raw as { data: TResponse }).data
        : (raw as TResponse);

    return normalized;
  }

  get<TResponse>(path: string, signal?: AbortSignal) {
    return this.request<TResponse>("GET", path, { signal });
  }

  patch<TResponse, TBody = unknown>(path: string, body: TBody) {
    return this.request<TResponse, TBody>("PATCH", path, { body });
  }

  post<TResponse, TBody = FormData>(
    path: string,
    body: TBody,
    signal?: AbortSignal,
  ) {
    // TBody tiene un valor predeterminado de FormData.
    return this.request<TResponse, TBody>("POST", path, {
      body,
      signal,
    });
  }

  delete<TResponse>(path: string, signal?: AbortSignal) {
    return this.request<TResponse>("DELETE", path, { signal });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

function mapStatusToMessage(status: number, detail?: string) {
  const normalizedDetail = detail?.toLowerCase() ?? "";
  const missingAuth =
    normalizedDetail.includes("authentication credentials") ||
    normalizedDetail.includes("not authenticated");

  if (status === 401 || (status === 403 && missingAuth)) {
    return errorMessages.unauthorized;
  }

  if (status === 403) return errorMessages.forbidden;
  if (status === 404) return errorMessages.notFound;
  if (status >= 500) return errorMessages.server;
  return null;
}
