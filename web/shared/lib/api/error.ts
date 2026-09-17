import axios from "axios";

export function extractErrorMessage(data: unknown, fallback = "Something went wrong."): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return d.error;
    if (typeof d.error === "object" && d.error !== null) {
      const errObj = d.error as Record<string, unknown>;
      if (typeof errObj.message === "string") return errObj.message;
    }
    if (Array.isArray(d.message)) return d.message.join(", ");
    if (typeof d.message === "object" && d.message !== null) {
      const msgObj = d.message as Record<string, unknown>;
      if (typeof msgObj.message === "string") return msgObj.message;
      if (typeof msgObj.error === "string") return msgObj.error;
    }
  }
  return fallback;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  const { generalError, fieldErrors } = parseApiErrors(error, fallback);
  const firstField = Object.keys(fieldErrors)[0];
  if (firstField) {
    const formattedField = firstField.charAt(0).toUpperCase() + firstField.slice(1);
    return `${formattedField}: ${fieldErrors[firstField]}`;
  }
  return generalError || fallback;
}

export function parseApiErrors(error: unknown, fallback = "Something went wrong.") {
  const result: { fieldErrors: Record<string, string>; generalError: string | null } = {
    fieldErrors: {},
    generalError: null,
  };

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        result.generalError = 'Request timed out. Please try again.';
      } else {
        result.generalError = 'Unable to connect to the backend server. Please check your connection or server status.';
      }
      return result;
    }

    const data = error.response?.data;

    if (data?.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
      data.error.details.forEach((detail: { path?: string[]; message?: string }) => {
        const field = detail.path && detail.path.length > 0 ? detail.path.join(".") : "";
        if (field && !result.fieldErrors[field]) {
          result.fieldErrors[field] = detail.message ?? "";
        }
      });
      if (!Object.keys(result.fieldErrors).length) {
        result.generalError = extractErrorMessage(data?.error, extractErrorMessage(data, fallback));
      }
      return result;
    }

    result.generalError = extractErrorMessage(data, error.message || fallback);
    return result;
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.toLowerCase().includes('fetch failed') || msg.toLowerCase().includes('failed to fetch')) {
      result.generalError = 'Unable to connect to authentication server. Please check your internet connection or try again.';
    } else if (msg.includes('Invalid login credentials')) {
      result.generalError = 'Invalid email or password. Please check your credentials and try again.';
    } else {
      result.generalError = msg;
    }
    return result;
  }

  result.generalError = fallback;
  return result;
}
