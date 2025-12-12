/**
 * Secure Fetch Wrapper for Broker APIs
 * Handles authentication, timeouts, and error handling
 */

import {
    BrokerAuthError,
    BrokerAPIError,
    BrokerNetworkError,
    type BrokerConfig,
} from './types';

/**
 * Default request timeout in milliseconds
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Fetch options with additional broker-specific fields
 */
interface BrokerFetchOptions extends Omit<RequestInit, 'headers'> {
    headers?: Record<string, string>;
    timeoutMs?: number;
}

/**
 * Create a fetch wrapper configured for a specific broker
 * @param config - Broker configuration with base URL and access token
 * @returns Configured fetch function
 */
export function createBrokerFetch(config: BrokerConfig) {
    const { baseUrl, accessToken, timeoutMs = DEFAULT_TIMEOUT_MS } = config;

    /**
     * Make an authenticated request to the broker API
     * @param endpoint - API endpoint (will be appended to baseUrl)
     * @param options - Fetch options
     * @returns Parsed JSON response
     */
    async function brokerFetch<T>(
        endpoint: string,
        options: BrokerFetchOptions = {}
    ): Promise<T> {
        const url = `${baseUrl}${endpoint}`;
        const requestTimeoutMs = options.timeoutMs ?? timeoutMs;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'access-token': accessToken,
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            // Handle authentication errors
            if (response.status === 401 || response.status === 403) {
                throw new BrokerAuthError();
            }

            // Parse response body
            const data = await parseResponse<T>(response);

            // Check for non-2xx status codes
            if (!response.ok) {
                throw new BrokerAPIError(
                    `Broker API error: ${response.statusText}`,
                    response.status,
                    typeof data === 'object' && data !== null && 'message' in data
                        ? String((data as Record<string, unknown>).message)
                        : undefined
                );
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            // Re-throw broker errors as-is
            if (error instanceof BrokerAuthError || error instanceof BrokerAPIError) {
                throw error;
            }

            // Handle abort (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new BrokerNetworkError(
                    `Request timed out after ${requestTimeoutMs}ms`
                );
            }

            // Handle network errors
            if (error instanceof TypeError) {
                throw new BrokerNetworkError('Failed to connect to broker API');
            }

            // Re-throw unknown errors
            throw error;
        }
    }

    return brokerFetch;
}

/**
 * Parse response body as JSON with error handling
 */
async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
        try {
            return (await response.json()) as T;
        } catch {
            throw new BrokerAPIError(
                'Failed to parse JSON response',
                response.status
            );
        }
    }

    // For non-JSON responses, return empty object or throw
    if (!response.ok) {
        const text = await response.text();
        throw new BrokerAPIError(text || response.statusText, response.status);
    }

    return {} as T;
}

/**
 * Type for the broker fetch function
 */
export type BrokerFetchFn = ReturnType<typeof createBrokerFetch>;
