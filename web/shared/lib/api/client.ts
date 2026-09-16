import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { createClient } from "@/lib/supabase/client";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // When running in the browser on localhost or 127.0.0.1 during development
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return 'http://localhost:4000/api';
    }
  }

  return 'http://localhost:4000/api';
}

export const API_URL = getApiBaseUrl();

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ─── In-Memory Auth Session Cache ───────────────────────────────────────────
let cachedAccessToken: string | null = null;
let sessionInitPromise: Promise<string | null> | null = null;
let isAuthListenerInitialized = false;

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

export function clearCachedAccessToken(): void {
  cachedAccessToken = null;
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

function extractTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (match) {
      const raw = decodeURIComponent(match[1]);
      const cleaned = raw.startsWith("base64-") ? atob(raw.slice(7)) : raw;
      const parsed = JSON.parse(cleaned);
      if (parsed?.access_token && typeof parsed.access_token === "string") {
        return parsed.access_token;
      }
    }
  } catch {
    // Ignore cookie parse error
  }
  return null;
}

function ensureAuthListener(): void {
  if (typeof window === "undefined" || isAuthListenerInitialized) return;
  isAuthListenerInitialized = true;

  try {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        cachedAccessToken = null;
      } else if (session?.access_token) {
        cachedAccessToken = session.access_token;
      } else {
        cachedAccessToken = null;
      }
    });
  } catch {
    // Supabase client initialization fallback
  }
}

// Subscribe to auth state changes immediately in browser context
if (typeof window !== "undefined") {
  ensureAuthListener();
}

/**
 * Retrieve the current access token:
 * 1. Synchronously from memory cache if already populated (0ms fast path).
 * 2. Synchronously from auth cookie if present during cold load.
 * 3. Asynchronously via a deduplicated single-flight Supabase getSession() promise if cache is cold.
 */
async function getOrFetchAccessToken(): Promise<string | null> {
  // 1. In-memory cache (0ms synchronous return)
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // 2. Cookie extraction fallback for immediate cold start
  const cookieToken = extractTokenFromCookie();
  if (cookieToken) {
    cachedAccessToken = cookieToken;
    ensureAuthListener();
    return cookieToken;
  }

  // 3. Concurrency single-flight: if an initialization is already in flight, await it
  if (sessionInitPromise) {
    return sessionInitPromise;
  }

  // 4. Cold-start fallback: query Supabase getSession() once with a timeout safety
  ensureAuthListener();
  sessionInitPromise = (async () => {
    try {
      const supabase = createClient();
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 4000)
      );
      const {
        data: { session },
      } = await Promise.race([sessionPromise, timeoutPromise]);
      cachedAccessToken = session?.access_token || null;
      return cachedAccessToken;
    } catch {
      return null;
    } finally {
      sessionInitPromise = null;
    }
  })();

  return sessionInitPromise;
}

// Add a request interceptor to attach the token and validate API URL
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // If running on a live deployed domain but API_URL still points to 127.0.0.1/localhost
      if (!isLocalhost && (config.baseURL?.includes("127.0.0.1") || config.baseURL?.includes("localhost"))) {
        console.error(
          "[ClixPro API] NEXT_PUBLIC_API_URL environment variable is missing in production. Frontend is attempting to connect to localhost API."
        );
      }

      const currency = localStorage.getItem("orbit_currency") || "INR";
      config.headers["X-Currency"] = currency;
      
      const isRemembered = localStorage.getItem("clixpro_remember_me") === "1";
      config.headers["X-Remember-Me"] = isRemembered ? "true" : "false";

      try {
        const token = await getOrFetchAccessToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      } catch {
        // Continue request even if session retrieval failed
      }

      // Allow browser and Axios to set correct multipart/form-data header with boundary
      if (config.data instanceof FormData && config.headers) {
        if ("delete" in config.headers && typeof config.headers.delete === "function") {
          config.headers.delete("Content-Type");
          config.headers.delete("content-type");
        } else {
          const rawHeaders = config.headers as Record<string, unknown>;
          delete rawHeaders["Content-Type"];
          delete rawHeaders["content-type"];
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== "undefined") {
      if (error?.response?.status === 403) {
        const errorData = error.response?.data;
        const isAal2Required =
          errorData?.code === "AAL2_REQUIRED" ||
          String(errorData?.message || "").includes("AAL2") ||
          String(errorData?.message || "").includes("MFA verification required");

        if (isAal2Required) {
          window.dispatchEvent(
            new CustomEvent("clixpro:aal2-required", {
              detail: {
                message: errorData?.message || "MFA verification required (AAL2)",
                route: window.location.pathname,
              },
            })
          );
        }
      } else if (error?.response?.status === 401) {
        const msg = String(error.response?.data?.message || "");
        const isSessionExpiry =
          msg.includes("expired") ||
          msg.includes("revoked") ||
          msg.includes("inactivity") ||
          msg.includes("duration reached");

        const pathname = window.location.pathname;
        const isAuthPage =
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/forgot-password" ||
          pathname === "/reset-password";

        if (isSessionExpiry && !isAuthPage) {
          clearCachedAccessToken();
          try {
            const supabase = createClient();
            await supabase.auth.signOut();
          } catch {}
          if (!sessionStorage.getItem("clixpro_session_redirected")) {
            sessionStorage.setItem("clixpro_session_redirected", "true");
            setTimeout(() => {
              sessionStorage.removeItem("clixpro_session_redirected");
            }, 3000);
            window.location.href = `/login?reason=session_expired`;
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// In-flight GET request deduplication:
// If multiple components or hooks trigger a GET request to the exact same URL + params concurrently,
// share the existing in-flight Promise and clear it immediately upon completion.
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const originalGet = client.get.bind(client);

client.get = function <T = unknown, R = AxiosResponse<T>, D = unknown>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  if (typeof window === "undefined") {
    return originalGet(url, config);
  }

  const currency = localStorage.getItem("orbit_currency") || "INR";
  const paramKey = config?.params ? JSON.stringify(config.params) : "";
  const dedupeKey = `GET:${url}:${currency}:${paramKey}`;

  if (inFlightGetRequests.has(dedupeKey)) {
    return inFlightGetRequests.get(dedupeKey) as Promise<R>;
  }

  const promise = originalGet<T, R, D>(url, config).finally(() => {
    inFlightGetRequests.delete(dedupeKey);
  });

  inFlightGetRequests.set(dedupeKey, promise);
  return promise;
};

export default client;
