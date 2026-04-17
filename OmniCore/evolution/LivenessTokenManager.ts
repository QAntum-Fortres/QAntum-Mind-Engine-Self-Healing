/**
 * 🔐 LIVENESS TOKEN MANAGER - Shared Secret Management
 * 
 * Centralized secret management for LivenessToken cryptographic operations.
 * Ensures VortexHealingNexus and ApoptosisModule use the same secret key.
 * 
 * SECURITY FEATURES:
 * ✅ Single source of truth for TOKEN_SECRET
 * ✅ Lazy initialization with env var fallback
 * ✅ Singleton pattern prevents multiple secrets
 * ✅ Future: Support for key rotation
 * 
 * @module LivenessTokenManager
 * @critical This is essential for token verification to work correctly
 */

import * as crypto from 'crypto';

export class LivenessTokenManager {
    private static instance: LivenessTokenManager;
    private currentSecret: string;
    private previousSecret: string | null = null;
    private rotationTimestamp: number | null = null;
    private readonly GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours grace period
    private secretInitializedAt: number;

    private constructor() {
        // Load from environment or generate ephemeral secret
        this.currentSecret = process.env.LIVENESS_TOKEN_SECRET || this.generateEphemeralSecret();
        this.secretInitializedAt = Date.now();

        if (!process.env.LIVENESS_TOKEN_SECRET) {
            console.warn('⚠️ [LIVENESS-TOKEN] LIVENESS_TOKEN_SECRET not set! Using ephemeral secret.');
            console.warn('⚠️ Tokens will become invalid on restart. Set LIVENESS_TOKEN_SECRET in .env for persistence.');
        } else {
            console.log('✅ [LIVENESS-TOKEN] Secret loaded from environment');
        }
    }

    public static getInstance(): LivenessTokenManager {
        if (!LivenessTokenManager.instance) {
            LivenessTokenManager.instance = new LivenessTokenManager();
        }
        return LivenessTokenManager.instance;
    }

    /**
     * Get the shared TOKEN_SECRET
     */
    public getSecret(): string {
        return this.currentSecret;
    }

    /**
     * Get all currently valid secrets (including previous secret during grace period)
     */
    public getValidSecrets(): string[] {
        const secrets = [this.currentSecret];

        if (this.previousSecret && this.rotationTimestamp) {
            const timeSinceRotation = Date.now() - this.rotationTimestamp;
            if (timeSinceRotation <= this.GRACE_PERIOD_MS) {
                secrets.push(this.previousSecret);
            } else {
                // Grace period expired, cleanup old secret
                this.previousSecret = null;
                this.rotationTimestamp = null;
            }
        }

        return secrets;
    }

    /**
     * Generate cryptographically strong ephemeral secret
     */
    private generateEphemeralSecret(): string {
        const secret = crypto.randomBytes(32).toString('hex');
        console.log(`🔑 [LIVENESS-TOKEN] Generated ephemeral secret (length: ${secret.length})`);
        return secret;
    }

    /**
     * Get secret metadata (for debugging)
     */
    public getMetadata(): {
        isEphemeral: boolean;
        secretAge: number;
        secretLength: number;
    } {
        return {
            isEphemeral: !process.env.LIVENESS_TOKEN_SECRET,
            secretAge: Date.now() - this.secretInitializedAt,
            secretLength: this.currentSecret.length
        };
    }

    /**
     * Future: Support for key rotation
     * 
     * This would be used to rotate the secret every 90 days as recommended.
     * For now, this is a placeholder.
     */
    public async rotateSecret(newSecret: string): Promise<void> {
        if (!newSecret || newSecret.length < 32) {
            throw new Error('New secret must be at least 32 characters long');
        }

        console.log('🔄 [LIVENESS-TOKEN] Rotating secret key. Old secret will remain valid for 24 hours.');

        // Store old secret for grace period
        this.previousSecret = this.currentSecret;
        this.rotationTimestamp = Date.now();

        // Apply new secret
        this.currentSecret = newSecret;
        this.secretInitializedAt = Date.now();
    }
}

// Singleton export
export default LivenessTokenManager.getInstance();
