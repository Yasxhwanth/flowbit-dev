/**
 * Broker Credential Storage
 * Save encrypted credentials to database
 */

import prisma from '@/lib/db';
import { encryptObject, EncryptionError } from './encrypt';

// ============================================================================
// Errors
// ============================================================================

export class CredentialStoreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CredentialStoreError';
    }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Supported broker types
 */
export type BrokerType = 'dhan' | 'fyers' | 'angel';

/**
 * Save result (never contains decrypted data)
 */
export interface SaveResult {
    success: boolean;
    broker: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// ============================================================================
// Store Functions
// ============================================================================

/**
 * Save broker credentials (encrypted)
 *
 * @param userId - User ID
 * @param broker - Broker identifier
 * @param credentials - Credentials to encrypt and store
 * @returns Success result (no decrypted data)
 *
 * @example
 * ```typescript
 * await saveBrokerCredentials('user123', 'dhan', {
 *   accessToken: 'xxx',
 *   clientId: 'yyy'
 * });
 * ```
 */
export async function saveBrokerCredentials(
    userId: string,
    broker: string,
    credentials: unknown
): Promise<SaveResult> {
    // Validate inputs
    if (!userId?.trim()) {
        throw new CredentialStoreError('User ID is required');
    }

    if (!broker?.trim()) {
        throw new CredentialStoreError('Broker is required');
    }

    if (!credentials || typeof credentials !== 'object') {
        throw new CredentialStoreError('Credentials must be an object');
    }

    try {
        // Encrypt credentials
        const encrypted = encryptObject(credentials);

        // Upsert to database
        const result = await prisma.brokerCredential.upsert({
            where: {
                userId_broker: {
                    userId,
                    broker,
                },
            },
            create: {
                userId,
                broker,
                encrypted,
            },
            update: {
                encrypted,
            },
            select: {
                broker: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return {
            success: true,
            broker: result.broker,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };
    } catch (error) {
        if (error instanceof EncryptionError) {
            throw new CredentialStoreError(`Encryption failed: ${error.message}`);
        }

        // Generic error - don't expose database details
        throw new CredentialStoreError('Failed to save credentials');
    }
}
