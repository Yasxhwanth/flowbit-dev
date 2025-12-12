/**
 * AES-256-GCM Encryption Utilities for Broker Credentials
 * Secure encryption/decryption with random IV and auth tag
 */

import crypto from 'crypto';

// ============================================================================
// Constants
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

// ============================================================================
// Errors
// ============================================================================

export class EncryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EncryptionError';
    }
}

export class DecryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DecryptionError';
    }
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Get encryption key from environment
 * @throws EncryptionError if key is missing or invalid
 */
function getEncryptionKey(): Buffer {
    const keyHex = process.env.CREDENTIALS_KEY;

    if (!keyHex) {
        throw new EncryptionError(
            'CREDENTIALS_KEY environment variable is not set'
        );
    }

    // Key can be hex-encoded (64 chars) or raw string (32 chars)
    let keyBuffer: Buffer;

    if (keyHex.length === 64) {
        // Hex-encoded key
        keyBuffer = Buffer.from(keyHex, 'hex');
    } else if (keyHex.length === 32) {
        // Raw 32-byte string
        keyBuffer = Buffer.from(keyHex, 'utf8');
    } else {
        throw new EncryptionError(
            `CREDENTIALS_KEY must be 32 bytes (got ${keyHex.length} characters). Use a 64-character hex string or 32-character raw string.`
        );
    }

    if (keyBuffer.length !== KEY_LENGTH) {
        throw new EncryptionError(
            `Invalid CREDENTIALS_KEY length: expected ${KEY_LENGTH} bytes, got ${keyBuffer.length}`
        );
    }

    return keyBuffer;
}

// ============================================================================
// Encryption
// ============================================================================

interface EncryptedPayload {
    iv: string;
    authTag: string;
    ciphertext: string;
}

/**
 * Encrypt an object using AES-256-GCM
 * @param obj - Object to encrypt
 * @returns Base64-encoded encrypted payload
 */
export function encryptObject(obj: unknown): string {
    const key = getEncryptionKey();

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    // Encrypt
    const plaintext = JSON.stringify(obj);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Create payload
    const payload: EncryptedPayload = {
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        ciphertext: encrypted.toString('base64'),
    };

    // Return base64-encoded JSON
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// ============================================================================
// Decryption
// ============================================================================

/**
 * Decrypt an AES-256-GCM encrypted payload
 * @param encryptedData - Base64-encoded encrypted payload
 * @returns Decrypted object
 */
export function decryptObject<T = unknown>(encryptedData: string): T {
    const key = getEncryptionKey();

    try {
        // Decode payload
        const payloadJson = Buffer.from(encryptedData, 'base64').toString('utf8');
        const payload: EncryptedPayload = JSON.parse(payloadJson);

        // Extract components
        const iv = Buffer.from(payload.iv, 'base64');
        const authTag = Buffer.from(payload.authTag, 'base64');
        const ciphertext = Buffer.from(payload.ciphertext, 'base64');

        // Validate lengths
        if (iv.length !== IV_LENGTH) {
            throw new DecryptionError('Invalid IV length');
        }
        if (authTag.length !== AUTH_TAG_LENGTH) {
            throw new DecryptionError('Invalid auth tag length');
        }

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
            authTagLength: AUTH_TAG_LENGTH,
        });
        decipher.setAuthTag(authTag);

        // Decrypt
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);

        // Parse and return
        return JSON.parse(decrypted.toString('utf8')) as T;
    } catch (error) {
        if (error instanceof DecryptionError) {
            throw error;
        }

        // Generic error - don't expose internal details
        throw new DecryptionError('Failed to decrypt credentials');
    }
}
