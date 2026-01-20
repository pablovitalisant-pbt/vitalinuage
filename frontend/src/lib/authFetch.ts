/**
 * AuthFetch - Centralized Authentication Gateway
 * 
 * This module provides a single, type-safe HTTP client that:
 * - Validates tokens before every request
 * - Blocks invalid tokens (null, undefined, "", "null", whitespace)
 * - Handles 401/403 responses consistently
 * - Provides comprehensive audit logging
 * 
 * CRITICAL: This is the ONLY place where Authorization headers should be constructed.
 */

type AuthFetchOptions = RequestInit & {
    requireAuth?: boolean;
};

type GetTokenFn = () => Promise<string | null>;
type OnUnauthorizedFn = () => Promise<void>;

/**
 * Creates a configured authFetch function
 * 
 * @param getToken - Async function to retrieve current auth token
 * @param onUnauthorized - Callback for 401 responses (typically logout)
 * @returns Configured fetch function with auth handling
 */
export function createAuthFetch(
    getToken: GetTokenFn,
    onUnauthorized: OnUnauthorizedFn
) {
    return async function authFetch(
        url: string,
        init?: RequestInit,
        options: { requireAuth?: boolean } = {}
    ): Promise<Response> {
        const { requireAuth = true } = options;
        const method = init?.method || 'GET';

        // Get token
        let token: string | null = null;
        if (requireAuth) {
            token = await getToken();

            // Strict validation: block any invalid token
            if (!token || token.trim() === '' || token.toLowerCase() === 'null') {
                console.error(
                    '[AUTH AUDIT] authFetch blocked request. Invalid token:',
                    token
                );
                throw new Error('AUTH_TOKEN_MISSING');
            }
        }

        // Build headers
        const headers: HeadersInit = {
            ...(init?.headers || {}),
        };

        if (requireAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Audit log: Request
        const tokenPreview = token ? token.slice(0, 20) + '...' : 'none';
        console.log(
            `[AUTH AUDIT] authFetch request: ${method} ${url} requireAuth=${requireAuth} tokenPreview=${tokenPreview}`
        );

        // Execute request
        const response = await fetch(url, {
            ...init,
            headers,
        });

        // Audit log: Response
        console.log(
            `[AUTH AUDIT] authFetch response: ${response.status} ${url}`
        );

        // Handle auth errors
        if (response.status === 401) {
            console.error('[AUTH AUDIT] 401 Unauthorized -> triggering logout');
            await onUnauthorized();
            throw new Error('AUTH_401');
        }

        if (response.status === 403) {
            console.error('[AUTH AUDIT] 403 Forbidden -> permission denied');
            throw new Error('AUTH_403');
        }

        return response;
    };
}
