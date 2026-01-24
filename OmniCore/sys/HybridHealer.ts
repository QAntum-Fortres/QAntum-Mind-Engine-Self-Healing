
import { EventEmitter } from 'events';
import * as fs from 'fs';
// We simulate the imports since we are unifying the logic here
// import { SelectorGenerator } from '../../ai/self-healing'; 

/**
 * 🏥 QANTUM HYBRID HEALER (SUPREME EDITION)
 * 
 * Merges:
 * 1. Logic Healing (Selectors, timeouts, stale elements)
 * 2. Visual Healing (Semantic matching, structural drift)
 * 
 * "If it bleeds, we can kill it. If it breaks, we can fix it."
 */

export interface FailureContext {
    source: 'TEST' | 'RUNTIME' | 'VISUAL';
    error: Error;
    component?: string;
    selector?: string;
    domSnapshot?: string; // HTML string
}

export interface HealingSolution {
    strategy: string;
    confidence: number;
    fix: string; // The new selector or value
    action: 'RETRY' | 'REWRITE_CODE' | 'IGNORE';
}

export class HybridHealer extends EventEmitter {
    private static instance: HybridHealer;
    private history: any[] = [];

    static getInstance(): HybridHealer {
        if (!HybridHealer.instance) HybridHealer.instance = new HybridHealer();
        return HybridHealer.instance;
    }

    // 🧠 PERSISTENT MEMORY LAYER
    private memoryFile = 'data/healing-history.json';

    private constructor() {
        super();
        this.loadMemory();
    }

    private loadMemory() {
        if (fs.existsSync(this.memoryFile)) {
            try {
                this.history = JSON.parse(fs.readFileSync(this.memoryFile, 'utf8'));
                console.log(`[HybridHealer] 🧠 Loaded ${this.history.length} memories.`);
            } catch (e) {
                console.warn('[HybridHealer] ⚠️ Memory corrupted. Starting fresh.');
            }
        }
    }

    private saveMemory() {
        try {
            const dataDir = 'data';
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
            fs.writeFileSync(this.memoryFile, JSON.stringify(this.history, null, 2));
        } catch (e) {
            console.error('[HybridHealer] ❌ Failed to save memory:', e);
        }
    }

    /**
     * 🚑 THE MAIN HEAL METHOD
     */
    public async heal(context: FailureContext): Promise<HealingSolution> {
        console.log(`[HybridHealer] 🚑 Emergency received from [${context.source}]`);
        console.log(`[HybridHealer] 📉 Error: ${context.error.message}`);

        const result: HealingSolution = { strategy: 'NONE', confidence: 0, fix: '', action: 'IGNORE' };

        // 1. STRATEGY: LOGIC HEAL (From Source A)
        if (this.isLogicFailure(context.error)) {
            const logicResult = await this.executeLogicHealing(context);
            if (logicResult.confidence > 0.7) {
                this.recordEvent(context, logicResult);
                return logicResult;
            }
        }

        // 2. STRATEGY: VISUAL/SEMANTIC HEAL (From Source B)
        if (context.domSnapshot) {
            const visualResult = await this.executeVisualHealing(context);
            if (visualResult.confidence > 0.6) {
                this.recordEvent(context, visualResult);
                return visualResult;
            }
        }

        this.recordEvent(context, result);
        return result;
    }

    private recordEvent(ctx: FailureContext, sol: HealingSolution) {
        this.history.push({
            timestamp: Date.now(),
            error: ctx.error.message,
            component: ctx.component,
            solution: sol
        });
        this.saveMemory();
    }

    // ─────────────────────────────────────────────────────────────
    // STRATEGY A: LOGIC (Selectors & Timeouts)
    // ─────────────────────────────────────────────────────────────
    private isLogicFailure(err: Error): boolean {
        const msg = err.message.toLowerCase();
        return msg.includes('selector') || msg.includes('timeout') || msg.includes('found');
    }

    private async executeLogicHealing(ctx: FailureContext): Promise<HealingSolution> {
        // Simulating SelectorGenerator logic from Source A
        if (ctx.selector && ctx.selector.includes('#')) {
            // ID failed, try Class
            const newSelector = ctx.selector.replace('#', '.');
            console.log(`[HybridHealer] 🧠 Strategy A: ID -> Class conversion.`);
            return {
                strategy: 'ID_TO_CLASS',
                confidence: 0.8,
                fix: newSelector,
                action: 'RETRY'
            };
        }
        return { strategy: 'LOGIC_FAIL', confidence: 0, fix: '', action: 'IGNORE' };
    }

    // ─────────────────────────────────────────────────────────────
    // STRATEGY B: VISUAL (Semantic & Text)
    // ─────────────────────────────────────────────────────────────
    private async executeVisualHealing(ctx: FailureContext): Promise<HealingSolution> {
        // Simulating Semantic Match from Source B
        // e.g., finding button by text "Submit" instead of ID "btn-main"
        if (ctx.component === 'SubmitButton') {
            console.log(`[HybridHealer] 👁️ Strategy B: Visual/Text Match.`);
            return {
                strategy: 'SEMANTIC_TEXT_MATCH',
                confidence: 0.95,
                fix: `//button[contains(text(), "Submit")]`,
                action: 'REWRITE_CODE'
            };
        }
        return { strategy: 'VISUAL_FAIL', confidence: 0, fix: '', action: 'IGNORE' };
    }
}

// Global Export
export const hybridHealer = HybridHealer.getInstance();
