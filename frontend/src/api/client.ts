/**
 * TryLo Reusable API Client Module
 *
 * Configured with credentials: 'include' for secure HttpOnly cookie sessions
 * and automatic X-CSRF-Token header attachment from the trylo_csrf_token cookie.
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieve CSRF token from document.cookie if available.
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)trylo_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Universal JSON fetch helper with timeout, credentials, CSRF, and standardized error handling.
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 8000, ...customFetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;

  // Assemble headers with CSRF protection for mutating requests
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customFetchOptions.headers as Record<string, string>),
  };

  const method = (customFetchOptions.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...customFetchOptions,
      credentials: 'include', // Automatically transmit and store HttpOnly cookies
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage: string | null = null;

      if (typeof data === 'object' && data !== null) {
        const errorObj = data as Record<string, unknown>;
        if (typeof errorObj.error === 'string' && errorObj.error.trim()) {
          errorMessage = errorObj.error.trim();
        } else if (errorObj.detail) {
          if (Array.isArray(errorObj.detail)) {
            errorMessage = errorObj.detail
              .map((item: unknown) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                  const detailItem = item as Record<string, unknown>;
                  const loc = Array.isArray(detailItem.loc)
                    ? detailItem.loc.filter((part) => part !== 'body').join('.')
                    : '';
                  const msg = detailItem.msg || JSON.stringify(item);
                  return loc ? `${loc}: ${msg}` : String(msg);
                }
                return String(item);
              })
              .join('; ');
          } else if (typeof errorObj.detail === 'object') {
            errorMessage = JSON.stringify(errorObj.detail);
          } else {
            errorMessage = String(errorObj.detail);
          }
        }
      }

      if (!errorMessage) {
        errorMessage = `Request failed with status ${response.status}`;
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again in a moment.', 408);
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';

    throw new ApiError(
      message.includes('Failed to fetch')
        ? "We couldn't complete your request. Please try again in a moment."
        : message,
      0
    );
  }
}

