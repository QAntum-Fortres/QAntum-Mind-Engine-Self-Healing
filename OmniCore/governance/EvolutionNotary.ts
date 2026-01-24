import * as ed25519 from '@noble/ed25519';
import { createHash } from 'crypto';

/**
 * 🔐 EvolutionNotary - Cryptographic Sovereignty
 * 
 * Uses Ed25519 for verification of architectural changes.
 * NOT A SINGLE BYTE changes without a valid digital signature.
 * 
 * Security Model:
 * 1. Every evolution proposal is hashed (SHA-256)
 * 2. Administrator signs the hash with their private key
 * 3. System verifies signature with administrator's public key
 * 4. Only verified patches are applied
 * 
 * Compliance: Non-repudiation, audit trail, GDPR Article 32
 */
export class EvolutionNotary {
    /**
     * Creates a deterministic hash of the proposed patch.
     * 
     * @param code - The code/patch to be hashed
     * @returns SHA-256 hash as Uint8Array
     */
    public static createPatchHash(code: string): Uint8Array {
        return createHash('sha256').update(code).digest();
    }

    /**
     * Verifies the administrator's signature.
     * 
     * @param code - The code that was signed
     * @param signature - The Ed25519 signature (hex string)
     * @param publicKey - Administrator's public key (hex string)
     * @returns true if signature is valid, false otherwise
     */
    public static async verifyAuthorization(
        code: string,
        signature: string,
        publicKey: string
    ): Promise<boolean> {
        try {
            const hash = this.createPatchHash(code);
            const signatureBytes = hexToBytes(signature);
            const publicKeyBytes = hexToBytes(publicKey);

            return await ed25519.verify(signatureBytes, hash, publicKeyBytes);
        } catch (error) {
            // Invalid signature format or verification failure
            return false;
        }
    }

    /**
     * Signs a patch with the administrator's private key.
     * 
     * @param code - The code to sign
     * @param privateKey - Administrator's private key (hex string)
     * @returns Ed25519 signature (hex string)
     */
    public static async signPatch(code: string, privateKey: string): Promise<string> {
        const hash = this.createPatchHash(code);
        const privateKeyBytes = hexToBytes(privateKey);
        const signature = await ed25519.sign(hash, privateKeyBytes);
        return bytesToHex(signature);
    }

    /**
     * Generates a new Ed25519 keypair for an administrator.
     * 
     * @returns Object containing privateKey and publicKey (both hex strings)
     */
    public static async generateKeypair(): Promise<{ privateKey: string; publicKey: string }> {
        const privateKey = ed25519.utils.randomPrivateKey();
        const publicKey = await ed25519.getPublicKey(privateKey);

        return {
            privateKey: bytesToHex(privateKey),
            publicKey: bytesToHex(publicKey),
        };
    }
}

/**
 * Utility: Converts hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string length');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

/**
 * Utility: Converts Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
