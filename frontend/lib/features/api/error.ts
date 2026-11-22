function getResponseMessage(data: unknown): string | undefined {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  type ApiErrorResponse = {
    message?: unknown;
    detail?: unknown;
  };

  const response = data as ApiErrorResponse;
  const message = response.message ?? response.detail;
  return typeof message === "string" && message.length > 0
    ? message
    : undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  if ("status" in error) {
    switch (error.status) {
      case "FETCH_ERROR":
        return "Unable to connect to the server. Please make sure the backend is running and try again.";
      case "TIMEOUT_ERROR":
        return "The server took too long to respond. Please try again.";
    }
  }

  if ("data" in error) {
    const message = getResponseMessage(error.data);
    if (message) {
      return message;
    }
  }

  return fallback;
}
