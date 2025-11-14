import { SDKError, SDKErrorType } from './types';

/**
 * HTTP request options
 */
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * HTTP Client with retry logic and error handling
 */
export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private token: string | null = null;
  private debug: boolean;

  constructor(baseUrl: string, apiKey: string, debug: boolean = false) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.debug = debug;
  }

  /**
   * Set the session token for authenticated requests
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear the session token
   */
  public clearToken(): void {
    this.token = null;
  }

  /**
   * Make an HTTP request with retry logic
   */
  public async request<T>(
    endpoint: string,
    options: RequestOptions,
    retries: number = 3
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers
    };

    // Add authorization token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const requestInit: RequestInit = {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    };

    if (this.debug) {
      console.log(`[Lyvely SDK] ${options.method} ${url}`, options.body);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = options.timeout || 30000;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestInit,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (this.debug) {
            console.error(`[Lyvely SDK] Error ${response.status}:`, errorData);
          }

          // Determine error type based on status code
          let errorType: SDKErrorType;
          switch (response.status) {
            case 401:
            case 403:
              errorType = SDKErrorType.AUTH_ERROR;
              break;
            case 404:
              errorType = SDKErrorType.SESSION_EXPIRED;
              break;
            case 429:
              errorType = SDKErrorType.RATE_LIMITED;
              break;
            case 400:
              errorType = SDKErrorType.VALIDATION_ERROR;
              break;
            default:
              errorType = SDKErrorType.NETWORK_ERROR;
          }

          throw new SDKError(
            errorType,
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
          );
        }

        const data = await response.json();

        if (this.debug) {
          console.log(`[Lyvely SDK] Response:`, data);
        }

        return data as T;

      } catch (error: any) {
        lastError = error;

        // Don't retry on auth errors, validation errors, or session expired
        if (
          error instanceof SDKError &&
          (error.type === SDKErrorType.AUTH_ERROR ||
           error.type === SDKErrorType.VALIDATION_ERROR ||
           error.type === SDKErrorType.SESSION_EXPIRED)
        ) {
          throw error;
        }

        // Don't retry if we're out of attempts
        if (attempt >= retries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;

        if (this.debug) {
          console.warn(`[Lyvely SDK] Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        }

        await this.sleep(delay);
      }
    }

    // If we got here, all retries failed
    if (lastError instanceof SDKError) {
      throw lastError;
    }

    throw new SDKError(
      SDKErrorType.NETWORK_ERROR,
      lastError?.message || 'Network request failed',
      undefined,
      lastError
    );
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, body?: any, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, ...options });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, body?: any, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, ...options });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
