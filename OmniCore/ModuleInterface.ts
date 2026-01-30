/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   QANTUM PRIME: UNIVERSAL MODULE INTERFACE                                    ║
 * ║   The "USB Port" of the Galaxy.                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

export type ModuleStatus = 'BOOTING' | 'READY' | 'BUSY' | 'ERROR' | 'OFFLINE';

export interface ModuleContext {
    requestId: string;
    timestamp: number;
    payload: any;
    user?: {
        id: string;
        permissions: string[];
    };
}

export interface ModuleResult {
    success: boolean;
    data?: any;
    error?: string;
    metrics?: {
        durationMs: number;
        memoryUsage: number;
    };
}

export interface IModule {
    /**
     * Unique Identifier (e.g., 'RefactorEngine', 'GhostShield')
     */
    readonly id: string;

    /**
     * Semantic Version
     */
    readonly version: string;

    /**
     * The Standard Execution Point.
     * Every module must be callable via this method.
     */
    execute(context: ModuleContext): Promise<ModuleResult>;

    /**
     * Health Check for the Dashboard.
     * Returns the current pulse of the module.
     */
    health(): Promise<ModuleStatus>;

    /**
     * Optional: Graceful Shutdown
     */
    shutdown?(): Promise<void>;
}
