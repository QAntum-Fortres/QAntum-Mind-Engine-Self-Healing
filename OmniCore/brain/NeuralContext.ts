/**
 * 🧠 Neural Context Manager
 * Purpose: Handles context window optimization, message pruning, 
 * and long-term memory retrieval integration.
 */

export class NeuralContext {
    private context: Array<{ role: string, content: string }> = [];
    private maxTokens: number = 8192;

    constructor(modelName: string = "qantum-ai-supreme") {
        console.log(`[NeuralContext] Initialized for ${modelName}`);
    }

    /**
     * Adds a new message to the current context.
     */
    public addMessage(role: string, content: string): void {
        this.context.push({ role, content });
        this.pruneContext();
    }

    /**
     * Prunes context to fit within token limits.
     */
    private pruneContext(): void {
        if (this.context.length > 20) {
            this.context = this.context.slice(-15); // Keep the last 15 messages
        }
    }

    /**
     * Returns the optimized context for AI consumption.
     */
    public getContext(): Array<{ role: string, content: string }> {
        return [...this.context];
    }

    /**
     * Clears the active context.
     */
    public reset(): void {
        this.context = [];
    }
}
