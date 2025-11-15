interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}
export declare class HttpClient {
    private baseUrl;
    private apiKey;
    private token;
    private debug;
    constructor(baseUrl: string, apiKey: string, debug?: boolean);
    setToken(token: string): void;
    clearToken(): void;
    request<T>(endpoint: string, options: RequestOptions, retries?: number): Promise<T>;
    get<T>(endpoint: string, options?: Partial<RequestOptions>): Promise<T>;
    post<T>(endpoint: string, body?: any, options?: Partial<RequestOptions>): Promise<T>;
    put<T>(endpoint: string, body?: any, options?: Partial<RequestOptions>): Promise<T>;
    private sleep;
}
export {};
//# sourceMappingURL=http-client.d.ts.map