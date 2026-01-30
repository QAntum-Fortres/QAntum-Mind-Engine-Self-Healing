import { z } from 'zod';

// 1. DEFINITION OF REALITY (Validation Schemas)
export const SovereignDataSchema = z.object({
    timestamp: z.string(),
    entropy: z.number().min(0).max(100),
    orchestrator: z.string(),
    bio: z.object({
        stress: z.number().min(0).max(1),
        action: z.string()
    }),
    market: z.object({
        stress: z.number().min(0).max(1),
        action: z.string()
    }),
    energy: z.object({
        stress: z.number().min(0).max(1),
        action: z.string()
    })
});

export type SovereignData = z.infer<typeof SovereignDataSchema>;

export interface ValidationResult {
    valid: boolean;
    data?: SovereignData;
    error?: string;
    timestamp?: number;
}

export class VeritasEngine {
    private static instance: VeritasEngine;
    private history: SovereignData[] = [];
    private readonly MAX_HISTORY = 50;

    // Heuristic Thresholds (Hallucination Detection)
    private readonly MAX_ENTROPY_SHIFT = 20; // Max % shift per cycle
    private readonly MAX_STRESS_SHIFT = 0.5; // Max 0.0-1.0 shift per cycle

    private constructor() {
        console.log("👁️ [VERITAS] Anti-Hallucination Layer Active");
    }

    public static getInstance(): VeritasEngine {
        if (!VeritasEngine.instance) {
            VeritasEngine.instance = new VeritasEngine();
        }
        return VeritasEngine.instance;
    }

    /**
     * Primary Truth Filter
     */
    public verify(_schemaName: string, incomingData: unknown): ValidationResult {
        // Step 1: Structural Verification (Zod)
        const parseResult = SovereignDataSchema.safeParse(incomingData);

        if (!parseResult.success) {
            // Cast error to any to access errors array safely in TS
            const zError = parseResult.error as any;
            const errorMsg = zError.errors?.[0]?.message || "Invalid Data Structure";

            this.triggerCountermeasures(`STRUCTURAL_FAIL: ${errorMsg}`);
            return { valid: false, error: `STRUCTURAL_FAIL: ${errorMsg}` };
        }

        const data = parseResult.data;

        // Step 2: Heuristic Verification (Anomaly Detection)
        if (this.history.length > 0) {
            const lastData = this.history[this.history.length - 1];

            if (this.isHallucination(lastData, data)) {
                this.triggerCountermeasures("COGNITIVE_DISSONANCE: Rapid data shift detected.");
                return { valid: false, error: "COGNITIVE_DISSONANCE: Reality shifted too fast." };
            }
        }

        // Step 3: Update History (Immutable)
        this.history = [...this.history.slice(-(this.MAX_HISTORY - 1)), data];
        this.failureCount = 0; // Reset failure count on success

        return { valid: true, data };
    }

    private failureCount = 0;

    private triggerCountermeasures(reason: string) {
        // 1. Alert the UI (Visual Glitch Effect / Red Alert)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('VERITAS_LOCKDOWN', { detail: { reason } }));
        }

        this.failureCount++;
        if (this.failureCount > 5) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('DATA_STALE'));
            }
        }

        console.warn(`[SENTINEL] Initiating sensor re-calibration due to: ${reason}`);
    }

    private isHallucination(last: SovereignData, current: SovereignData): boolean {
        // Check for massive entropy jumps (e.g., 50% -> 90% in 1 sec)
        const entropyShift = Math.abs(current.entropy - last.entropy);
        if (entropyShift > this.MAX_ENTROPY_SHIFT) return true;

        // Check for biological impossibility (Stress 0.1 -> 0.9 instantly)
        if (Math.abs(current.bio.stress - last.bio.stress) > this.MAX_STRESS_SHIFT) return true;

        return false;
    }

    public getHistory() {
        return this.history;
    }
}
