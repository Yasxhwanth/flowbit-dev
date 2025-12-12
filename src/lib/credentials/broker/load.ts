/**
 * Broker Credential Loader
 * Load and decrypt credentials from database
 */

import prisma from '@/lib/db';
import { decryptObject, DecryptionError } from './encrypt';

// ============================================================================
// Errors
// ============================================================================

export class CredentialNotFoundError extends Error {
    constructor(broker: string) {
        super(`No credentials found for broker: ${broker}`);
        this.name = 'CredentialNotFoundError';
    }
}

export class CredentialLoadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CredentialLoadError';
    }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Dhan broker credentials
 */
export interface DhanCredentials {
    accessToken: string;
    clientId: string;
}

/**
 * Fyers broker credentials
 */
export interface FyersCredentials {
    accessToken: string;
    appId: string;
}

/**
 * AngelOne broker credentials
 */
export interface AngelCredentials {
    jwtToken: string;
    refreshToken: string;
    feedToken: string;
    clientCode: string;
}

/**
 * Generic broker credentials
 */
export type BrokerCredentials =
    | DhanCredentials
    | FyersCredentials
    | AngelCredentials
    | Record<string, unknown>;

// ============================================================================
// Load Functions
// ============================================================================

/**
 * Get decrypted broker credentials
 *
 * ⚠️ SERVER-SIDE ONLY - Never expose to client
 *
 * @param userId - User ID
 * @param broker - Broker identifier
 * @returns Decrypted credentials
 *
 * @example
 * ```typescript
 * const creds = await getBrokerCredentials('user123', 'dhan');
 * // { accessToken: 'xxx', clientId: 'yyy' }
 * ```
 */
export async function getBrokerCredentials<T extends BrokerCredentials = BrokerCredentials>(
    userId: string,
    broker: string
): Promise<T> {
    // Validate inputs
    if (!userId?.trim()) {
        throw new CredentialLoadError('User ID is required');
    }

    if (!broker?.trim()) {
        throw new CredentialLoadError('Broker is required');
    }

    try {
        // Load from database
        const record = await prisma.brokerCredential.findUnique({
            where: {
                userId_broker: {
                    userId,
                    broker,
                },
            },
            select: {
                encrypted: true,
            },
        });

        if (!record) {
            throw new CredentialNotFoundError(broker);
        }

        // Decrypt and return
        return decryptObject<T>(record.encrypted);
    } catch (error) {
        if (error instanceof CredentialNotFoundError) {
            throw error;
        }

        if (error instanceof DecryptionError) {
            throw new CredentialLoadError('Failed to decrypt credentials');
        }

        // Generic error
        throw new CredentialLoadError('Failed to load credentials');
    }
}

/**
 * Check if credentials exist for a broker
 *
 * @param userId - User ID
 * @param broker - Broker identifier
 * @returns True if credentials exist
 */
export async function hasBrokerCredentials(
    userId: string,
    broker: string
): Promise<boolean> {
    const count = await prisma.brokerCredential.count({
        where: {
            userId,
            broker,
        },
    });

    return count > 0;
}
