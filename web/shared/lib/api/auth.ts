import client from "./client";
import { createClient } from "@/lib/supabase/client";

interface LoginPayload {
  email: string;
  password: string;
  staySignedIn?: boolean;
}

interface RegisterPayload {
  name: string;
  companyName: string;
  email: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token?: string;
  newPassword: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  role: string;
  roleName?: string;
  description?: string;
  tenantId?: string | null;
  companyName?: string;
  companyLogo?: string | null;
  brandPrimaryColor?: string | null;
  permissions?: string[];
  routes?: string[];
  dashboardWidgets?: string[];
  analyticsVisibility?: "full" | "team" | "self" | "limited" | "hr";
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: AuthUser | null;
  };
}

export const loginUser = async (data: LoginPayload) => {
  // 1. Enforce backend rate limit pre-check
  try {
    await client.post('/auth/login', { email: data.email });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (rateLimitErr: any) {
    if (rateLimitErr?.response?.status === 429) {
      throw new Error(
        rateLimitErr.response.data?.message ||
          'Too many login attempts. Please wait a few minutes before trying again.'
      );
    }
    // For network connectivity errors to backend API, allow fallback to proceed
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("has_session", "1");
  }

  // Fetch current user details to return the expected AuthResponse format
  try {
    const meResponse = await client.get<AuthResponse>("/auth/me");
    return meResponse.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (meError: any) {
    const isNeedsOnboarding =
      meError.response?.status === 403 &&
      (meError.response?.data?.message === "NEEDS_ONBOARDING" ||
        meError.response?.data?.error === "NEEDS_ONBOARDING" ||
        meError.response?.data === "NEEDS_ONBOARDING");
    if (isNeedsOnboarding) {
      throw new Error("NEEDS_ONBOARDING");
    }
    throw meError;
  }
};

export const registerUser = async (data: RegisterPayload) => {
  // 1. Enforce backend rate limit pre-check
  try {
    await client.post('/auth/register', { email: data.email });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (rateLimitErr: any) {
    if (rateLimitErr?.response?.status === 429) {
      throw new Error(
        rateLimitErr.response.data?.message ||
          'Too many registration attempts. Please wait a few minutes before trying again.'
      );
    }
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        companyName: data.companyName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("has_session", "1");
  }

  return { success: true, message: "Registration successful", data: { user: null } };
};

export const forgotPassword = async (data: ForgotPasswordPayload) => {
  // 1. Enforce backend rate limit pre-check
  try {
    await client.post('/auth/forgot-password', { email: data.email });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (rateLimitErr: any) {
    if (rateLimitErr?.response?.status === 429) {
      throw new Error(
        rateLimitErr.response.data?.message ||
          'Too many password reset requests. Please wait a few minutes before trying again.'
      );
    }
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: getAuthRedirectUrl("/reset-password"),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, message: "Password reset email sent" };
};

export const resetPassword = async (data: ResetPasswordPayload) => {
  // 1. Enforce backend rate limit pre-check
  try {
    await client.post('/auth/reset-password', {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (rateLimitErr: any) {
    if (rateLimitErr?.response?.status === 429) {
      throw new Error(
        rateLimitErr.response.data?.message ||
          'Too many password update attempts. Please wait a few minutes before trying again.'
      );
    }
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Notify backend to invalidate previous sessions & caches
  try {
    await client.post('/auth/password-reset-completed', {});
  } catch {
    // Non-fatal if recovery session callback handled separately
  }

  return { success: true, message: "Password updated successfully" };
};

export const changePassword = async (newPassword: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Notify backend to revoke all other active sessions and clear identity caches
  const response = await client.post<{ success: boolean; message: string }>('/auth/change-password', {});
  return response.data;
};

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await client.get<AuthResponse>("/auth/me");
    if (!response.data?.success) {
      return null;
    }
    return response.data.data.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const isNeedsOnboarding =
      error.response?.status === 403 &&
      (error.response?.data?.message === "NEEDS_ONBOARDING" ||
        error.response?.data?.error === "NEEDS_ONBOARDING" ||
        error.response?.data === "NEEDS_ONBOARDING");
    if (isNeedsOnboarding) {
      throw new Error("NEEDS_ONBOARDING");
    }
    return null;
  }
};

export const logoutUser = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("has_session");
  }
  try {
    await client.post('/auth/logout');
  } catch {
    // Ignore server logout errors if token already invalidated
  }
  const supabase = createClient();
  await supabase.auth.signOut();
};

export const updateProfile = async (data: Record<string, ReturnType<typeof JSON.parse>>) => {
  const response = await client.patch<AuthResponse>("/auth/me", data);
  return response.data;
};

export const uploadUserAvatar = async (
  file: File | { fileData: string; fileName?: string }
) => {
  if (file instanceof File) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const response = await client.post<{
      success: boolean;
      data: {
        success: boolean;
        avatar: string;
        user: any;
      };
    }>("/auth/avatar", {
      fileData: base64Data,
      fileName: file.name,
    });
    return response.data?.data;
  }

  const response = await client.post<{
    success: boolean;
    data: {
      success: boolean;
      avatar: string;
      user: any;
    };
  }>("/auth/avatar", file);
  return response.data?.data;
};

/**
 * Helper to get environment-aware auth redirect URL.
 * Local: http://localhost:3000/api/auth/callback
 * Production: https://clixprocrm.vercel.app/api/auth/callback
 */
export const getAuthRedirectUrl = (path: string = "/api/auth/callback"): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${cleanPath}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}${cleanPath}`;
};

/**
 * Opens a centered popup window for Google OAuth.
 * MUST be called synchronously from a user-gesture event handler.
 * Returns the popup reference, or null if blocked by the browser.
 */
export const openGoogleAuthPopup = (): Window | null => {
  if (typeof window === "undefined") return null;

  const width = 500;
  const height = 650;
  const screenLeft = typeof window.screenLeft !== "undefined" ? window.screenLeft : window.screenX;
  const screenTop = typeof window.screenTop !== "undefined" ? window.screenTop : window.screenY;
  const outerWidth = window.outerWidth || document.documentElement.clientWidth || 1024;
  const outerHeight = window.outerHeight || document.documentElement.clientHeight || 768;
  const left = Math.max(0, Math.floor(screenLeft + (outerWidth - width) / 2));
  const top = Math.max(0, Math.floor(screenTop + (outerHeight - height) / 2));

  // IMPORTANT: Do NOT include location=no or status=no.
  // On HTTPS (production), Chromium blocks cross-origin popup navigation when location=no
  // is set — Google's OAuth redirect from about:blank to accounts.google.com gets blocked,
  // causing the parent window to navigate instead. Removing these flags fixes production.
  try {
    return window.open(
      "about:blank",
      "clixprocrm_google_auth",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  } catch {
    return null;
  }
};

let activeOAuthCleanup: (() => void) | null = null;
let activeOAuthPopup: Window | null = null;

/**
 * Drives the Google OAuth popup flow.
 * @param preCreatedPopup - A popup opened synchronously from a click handler (before any await).
 *   If not provided, a new popup is opened here (may lose user-gesture context in some browsers).
 *   If null is explicitly passed, falls back to full-page redirect.
 */
export const signInWithGoogle = async (
  preCreatedPopup?: Window | null
): Promise<{ success: boolean; target?: string; redirected?: boolean }> => {
  if (typeof window === "undefined") {
    return { success: false };
  }

  // Clean up any previously pending OAuth listeners/channels before starting a new flow
  if (activeOAuthCleanup) {
    try {
      activeOAuthCleanup();
    } catch {
      // Ignore previous cleanup errors
    }
    activeOAuthCleanup = null;
  }

  // If a popup from a previous click is still referenced, try to close it cleanly
  if (activeOAuthPopup) {
    try {
      activeOAuthPopup.close();
    } catch {
      // Ignore close errors
    }
    activeOAuthPopup = null;
  }

  const supabase = createClient();
  const callbackUrl = getAuthRedirectUrl("/api/auth/callback");

  // Use pre-created popup if provided; otherwise open one now (fallback path)
  const popup: Window | null =
    preCreatedPopup !== undefined ? preCreatedPopup : openGoogleAuthPopup();

  // If popup is blocked by browser, fall back to standard full-page redirect flow
  if (!popup) {
    activeOAuthPopup = null;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("has_session");
      }
      throw new Error(error.message);
    }

    if (data?.url) {
      window.location.href = data.url;
      return { success: true, redirected: true };
    }

    throw new Error("Failed to initialize Google authentication");
  }

  activeOAuthPopup = popup;

  // Add sleek loading indicator inside the popup while waiting for oauthUrl
  try {
    popup.document.write(`<!DOCTYPE html><html><head><title>Connecting to Google...</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0b0f19;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center}.spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,0.1);border-top:3px solid #10b981;border-radius:50%;animation:s 0.8s linear infinite;margin:0 auto 16px}@keyframes s{to{transform:rotate(360deg)}}p{font-size:14px;color:#94a3b8;margin:0}</style></head><body><div><div class="spinner"></div><p>Connecting to Google...</p></div></body></html>`);
    popup.document.close();
  } catch {
    // Ignore cross-origin write errors
  }

  let oauthUrl = "";
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("has_session");
      }
      throw new Error(error.message);
    }

    if (!data?.url) {
      throw new Error("Failed to initialize Google authentication URL");
    }

    oauthUrl = data.url;
  } catch (err) {
    try {
      popup?.close();
    } catch {
      // Ignore popup close error
    }
    activeOAuthPopup = null;
    throw err;
  }

  // Navigate the popup window to Google OAuth URL
  try {
    popup.location.href = oauthUrl;
  } catch {
    try {
      popup?.close();
    } catch {
      // Ignore popup close error
    }
    activeOAuthPopup = null;
    window.location.href = oauthUrl;
    return { success: true, redirected: true };
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let closedCheckInterval: ReturnType<typeof setInterval> | null = null;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("clixprocrm_google_auth_channel");
      } catch {
        channel = null;
      }
    }

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        try {
          channel.close();
        } catch {
          // Ignore cleanup error
        }
        channel = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      if (closedCheckInterval) {
        clearInterval(closedCheckInterval);
        closedCheckInterval = null;
      }
      activeOAuthPopup = null;
      activeOAuthCleanup = null;
    };

    activeOAuthCleanup = cleanup;

    const processPayload = (payload: { type?: string; target?: string; error?: string }) => {
      if (!payload || resolved) return;

      if (payload.type === "CLIXPROCRM_GOOGLE_AUTH_SUCCESS") {
        resolved = true;
        cleanup();
        if (typeof window !== "undefined") {
          localStorage.setItem("has_session", "1");
          localStorage.removeItem("clixprocrm_google_auth_event");
        }
        try {
          popup?.close();
        } catch {
          // Ignore popup close error
        }
        resolve({ success: true, target: payload.target || "/dashboard" });
      } else if (payload.type === "CLIXPROCRM_GOOGLE_AUTH_ERROR") {
        resolved = true;
        cleanup();
        if (typeof window !== "undefined") {
          localStorage.removeItem("clixprocrm_google_auth_event");
        }
        try {
          popup?.close();
        } catch {
          // Ignore popup close error
        }
        reject(new Error(payload.error || "Authentication failed"));
      }
    };

    const handleMessage = (event: MessageEvent) => {
      // Secure check: verify origin matches exact origin
      if (event.origin !== window.location.origin) return;
      processPayload(event.data);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "clixprocrm_google_auth_event" && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          processPayload(data);
        } catch {
          // Ignore JSON parse error
        }
      }
    };

    if (channel) {
      channel.onmessage = (event) => {
        processPayload(event.data);
      };
    }

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    // Periodically check if the user manually closed the popup window without completing auth
    closedCheckInterval = setInterval(() => {
      try {
        if (popup && popup.closed) {
          if (closedCheckInterval) {
            clearInterval(closedCheckInterval);
            closedCheckInterval = null;
          }
          // Give a short grace period (1000ms) in case postMessage/storage event arrives at the exact same moment
          setTimeout(() => {
            if (!resolved) {
              cleanup();
              reject(new Error("Google sign-in was cancelled."));
            }
          }, 1000);
        }
      } catch {
        // Ignore cross-origin access errors
      }
    }, 600);

    // Timeout fallback (5 minutes) if the popup is closed or abandoned without completing
    timeoutTimer = setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(new Error("Google sign-in timed out. Please try again."));
      }
    }, 5 * 60 * 1000);
  });
};

export const deleteAccount = async (confirmation: { confirm1: string; confirm2: string }) => {
  const response = await client.delete<{ success: boolean; message: string }>("/auth/account", {
    data: confirmation,
  });
  return response.data;
};
