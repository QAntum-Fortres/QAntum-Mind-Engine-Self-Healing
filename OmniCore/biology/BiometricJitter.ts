/**
 * 🧬 Biometric Jitter Engine
 * Purpose: Simulates human-like behavior (mouse movement, typing rhythm, eye-tracking patterns)
 * to bypass advanced anti-bot telemetries and behavioral analysis.
 */

export class BiometricJitter {
    private baseDelay: number = 50;

    constructor(private noiseLevel: number = 0.2) { }

    /**
     * Generates a randomized delay to simulate human typing rhythm.
     */
    public async humanDelay(): Promise<void> {
        const jitter = Math.random() * this.baseDelay * this.noiseLevel;
        const finalDelay = this.baseDelay + (Math.random() > 0.5 ? jitter : -jitter);
        return new Promise(resolve => setTimeout(resolve, finalDelay));
    }

    /**
     * Simulates a "thinking" pause between actions.
     */
    public async thinkingPause(min: number = 500, max: number = 2000): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Generates a coordinate path for "human" mouse movement.
     */
    public generatePath(startX: number, startY: number, endX: number, endY: number): Array<{ x: number, y: number }> {
        // Basic bezier curve logic would go here
        return [
            { x: startX, y: startY },
            { x: (startX + endX) / 2 + Math.random() * 20, y: (startY + endY) / 2 + Math.random() * 20 },
            { x: endX, y: endY }
        ];
    }
}
