/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  APOPTOSIS MODULE: PROGRAMMED DIGITAL DEATH                               ║
 * ║  The Seventh Pillar - Controlled Necrosis Prevention                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  "In biology, cells that cannot die become cancer."                       ║
 * ║  — VORTEX must be mortal to remain healthy.                               ║
 * ║                                                                           ║
 * ║  This module periodically scans the codebase and "kills" (archives)       ║
 * ║  anything that hasn't been used in the last N work cycles.                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { LivenessTokenManager } from './LivenessTokenManager';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES: The Language of Digital Mortality
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CodeEntity {
    id: string;
    path: string;
    type: 'FILE' | 'FUNCTION' | 'CLASS' | 'MODULE' | 'VARIABLE';
    name: string;
    lastAccessed: number;
    accessCount: number;
    createdAt: number;
    size: number;
    dependencies: string[];
    dependents: string[];
}

export interface ApoptosisReport {
    timestamp: number;
    totalEntities: number;
    scanned: number;
    markedForDeath: number;
    archived: number;
    preserved: number;
    savings: {
        files: number;
        bytes: number;
    };
    deathList: ApoptosisTarget[];
}

export interface ApoptosisTarget {
    entity: CodeEntity;
    reason: ApoptosisReason;
    ageInCycles: number;
    lastAccessedHuman: string;
}

export type ApoptosisReason =
    | 'STALE_CODE'           // Not accessed in threshold cycles
    | 'ORPHAN_DEPENDENCY'    // No dependents, not an entry point
    | 'DUPLICATE_LOGIC'      // Functionally identical to another entity
    | 'DEPRECATED_API'       // Uses deprecated patterns
    | 'DEAD_IMPORT'          // Imported but never used
    | 'ZOMBIE_EXPORT'        // Exported but never consumed
    | 'BLOAT_THRESHOLD';     // File size exceeds reasonable bounds

export interface ApoptosisConfig {
    cycleThreshold: number;           // Cycles before marking as stale
    archiveDirectory: string;          // Where to move dead code
    protectedPaths: string[];          // Never touch these
    protectedPatterns: RegExp[];       // Patterns to preserve
    dryRun: boolean;                   // If true, report but don't delete
    maxArchiveSize: number;            // Max bytes in archive before cleanup
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THE APOPTOSIS MODULE: Programmed Digital Death
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class ApoptosisModule extends EventEmitter {
    private static instance: ApoptosisModule;

    private registry: Map<string, CodeEntity> = new Map();
    private accessLog: Map<string, number[]> = new Map();
    private currentCycle: number = 0;
    private config: ApoptosisConfig;
    private reports: ApoptosisReport[] = [];

    private constructor() {
        super();
        this.config = this.getDefaultConfig();
        this.loadState();
    }

    public static getInstance(): ApoptosisModule {
        if (!ApoptosisModule.instance) {
            ApoptosisModule.instance = new ApoptosisModule();
        }
        return ApoptosisModule.instance;
    }

    /**
     * Default configuration for the Apoptosis Module
     */
    private getDefaultConfig(): ApoptosisConfig {
        return {
            cycleThreshold: 10000,  // 10,000 work cycles before death
            archiveDirectory: path.join(process.cwd(), '.apoptosis', 'graveyard'),
            protectedPaths: [
                'node_modules',
                '.git',
                'package.json',
                'tsconfig.json',
                'src/core',           // Core system is protected
                'src/index.ts',
                '.env'
            ],
            protectedPatterns: [
                /\.config\.(ts|js)$/,
                /^index\.(ts|js)$/,
                /\.d\.ts$/,           // Type definitions are sacred
                /migration/i,          // Migrations must be preserved
                /schema/i
            ],
            dryRun: true,           // Start in safe mode
            maxArchiveSize: 100 * 1024 * 1024  // 100MB max archive
        };
    }

    /**
     * Load persistent state from disk
     */
    private async loadState(): Promise<void> {
        try {
            const statePath = path.join(process.cwd(), '.apoptosis', 'state.json');
            const data = await fs.readFile(statePath, 'utf-8');
            const state = JSON.parse(data);

            this.currentCycle = state.currentCycle || 0;
            this.registry = new Map(Object.entries(state.registry || {}));
            this.accessLog = new Map(Object.entries(state.accessLog || {}));

            console.log(`🦴 [APOPTOSIS] State loaded. Current cycle: ${this.currentCycle}`);
        } catch {
            console.log('🦴 [APOPTOSIS] No previous state found. Starting fresh.');
        }
    }

    /**
     * Save persistent state to disk
     */
    private async saveState(): Promise<void> {
        try {
            const stateDir = path.join(process.cwd(), '.apoptosis');
            await fs.mkdir(stateDir, { recursive: true });

            const state = {
                currentCycle: this.currentCycle,
                registry: Object.fromEntries(this.registry),
                accessLog: Object.fromEntries(this.accessLog)
            };

            await fs.writeFile(
                path.join(stateDir, 'state.json'),
                JSON.stringify(state, null, 2)
            );
        } catch (error) {
            console.error('❌ [APOPTOSIS] Failed to save state:', error);
        }
    }

    /**
     * Record an access to a code entity
     */
    public recordAccess(entityPath: string): void {
        const id = this.pathToId(entityPath);

        // Update or create entity
        let entity = this.registry.get(id);
        if (!entity) {
            entity = {
                id,
                path: entityPath,
                type: this.inferEntityType(entityPath),
                name: path.basename(entityPath),
                lastAccessed: this.currentCycle,
                accessCount: 0,
                createdAt: this.currentCycle,
                size: 0,
                dependencies: [],
                dependents: []
            };
            this.registry.set(id, entity);
        }

        entity.lastAccessed = this.currentCycle;
        entity.accessCount++;

        // Record in access log
        const log = this.accessLog.get(id) || [];
        log.push(this.currentCycle);
        if (log.length > 1000) log.shift(); // Keep last 1000 accesses
        this.accessLog.set(id, log);
    }

    /**
     * Register vitality from LivenessToken (Immune System Integration)
     * 
     * When a module successfully heals or validates, it receives a LivenessToken
     * that certifies its health. This method parses the token and resets entropy,
     * effectively extending the module's lifespan.
     * 
     * SECURITY:
     * ❌ Forged Tokens: HMAC-SHA256 signature prevents unauthorized vitality registration
     * ❌ Replay Attacks: Timestamp validation ensures tokens are time-bound (5-minute window)
     * ❌ Module ID Spoofing: Token verification checks moduleId match
     * 
     * @param moduleId - Module identifier
     * @param livenessToken - Base64-encoded LivenessToken from VortexHealingNexus
     * @throws Error if token validation fails
     */
    public async registerVitality(moduleId: string, livenessToken: string): Promise<void> {
        try {
            // Step 1: Decode Base64 token
            const decoded = Buffer.from(livenessToken, 'base64').toString('utf-8');
            const [tokenModuleId, timestampStr, status, providedSignature] = decoded.split(':');

            // Step 2: Verify module ID match (防止 Module ID Spoofing)
            if (tokenModuleId !== moduleId) {
                const safeTokenId = tokenModuleId.replace(/[^\x20-\x7E]/g, '?');
                throw new Error(
                    `Security Alert: LivenessToken moduleId mismatch. Expected '${moduleId}', got '${safeTokenId}'`
                );
            }

            // Step 3: Verify timestamp to prevent replay attacks
            const tokenTimestamp = parseInt(timestampStr, 10);
            const now = Date.now();
            const tokenAgeMs = now - tokenTimestamp;
            const MAX_TOKEN_AGE_MS = 5 * 60 * 1000; // 5 minutes

            if (tokenAgeMs > MAX_TOKEN_AGE_MS) {
                throw new Error(
                    `LivenessToken expired: token is ${Math.floor(tokenAgeMs / 1000)}s old (max: ${MAX_TOKEN_AGE_MS / 1000}s)`
                );
            }

            if (tokenTimestamp > now + 60000) {
                throw new Error('LivenessToken from future - possible clock skew attack');
            }

            // Step 4: Cryptographically verify HMAC-SHA256 signature
            const tokenManager = LivenessTokenManager.getInstance();
            const TOKEN_SECRET = tokenManager.getSecret();
            const payload = `${tokenModuleId}:${timestampStr}:${status}`;
            const expectedSignature = crypto
                .createHmac('sha256', TOKEN_SECRET)
                .update(payload)
                .digest('hex');

            if (providedSignature !== expectedSignature) {
                throw new Error('LivenessToken signature verification FAILED - token is forged or corrupted');
            }

            // ✅ ALL SECURITY CHECKS PASSED - Token is AUTHENTIC

            const id = this.pathToId(moduleId);

            // Get or create entity
            let entity = this.registry.get(id);
            if (!entity) {
                entity = {
                    id,
                    path: moduleId,
                    type: 'MODULE',
                    name: path.basename(moduleId),
                    lastAccessed: this.currentCycle,
                    accessCount: 0,
                    createdAt: this.currentCycle,
                    size: 0,
                    dependencies: [],
                    dependents: []
                };
                this.registry.set(id, entity);
            }

            // Reset entropy by updating last accessed time
            entity.lastAccessed = this.currentCycle;
            entity.accessCount++;

            // Update access log
            const log = this.accessLog.get(id) || [];
            log.push(this.currentCycle);
            if (log.length > 1000) log.shift();
            this.accessLog.set(id, log);

            console.log(`💚 [APOPTOSIS] Vitality registered for ${moduleId} (status: ${status}) - Entropy RESET ✅`);
            this.emit('vitality:registered', { moduleId, status, timestamp: tokenTimestamp });

            // Save state after vitality registration
            await this.saveState();

        } catch (error: any) {
            console.error(`❌ [APOPTOSIS] Vitality registration FAILED: ${error.message}`);
            this.emit('vitality:rejected', { moduleId, reason: error.message });
            throw error; // Re-throw to propagate security failures
        }
    }

    /**
     * Advance the work cycle counter
     */
    public advanceCycle(): void {
        this.currentCycle++;

        // Periodic auto-save
        if (this.currentCycle % 100 === 0) {
            this.saveState();
        }

        // Periodic apoptosis scan
        if (this.currentCycle % 1000 === 0) {
            this.emit('cycle:milestone', this.currentCycle);
        }
    }

    /**
     * THE REAPER: Main apoptosis scan
     */
    public async executeApoptosis(): Promise<ApoptosisReport> {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('💀 [APOPTOSIS] Initiating Programmed Death Cycle');
        console.log(`   └─ Current Cycle: ${this.currentCycle}`);
        console.log(`   └─ Threshold: ${this.config.cycleThreshold} cycles`);
        console.log(`   └─ Mode: ${this.config.dryRun ? 'DRY RUN (safe)' : '⚠️ LIVE EXECUTION'}`);
        console.log('═══════════════════════════════════════════════════════════');

        this.emit('apoptosis:start');

        const report: ApoptosisReport = {
            timestamp: Date.now(),
            totalEntities: this.registry.size,
            scanned: 0,
            markedForDeath: 0,
            archived: 0,
            preserved: 0,
            savings: { files: 0, bytes: 0 },
            deathList: []
        };

        // Phase 1: Scan all registered entities
        for (const [id, entity] of this.registry) {
            report.scanned++;

            // Check if protected
            if (this.isProtected(entity)) {
                report.preserved++;
                continue;
            }

            // Check for death conditions
            const deathReason = this.evaluateForDeath(entity);

            if (deathReason) {
                const target: ApoptosisTarget = {
                    entity,
                    reason: deathReason,
                    ageInCycles: this.currentCycle - entity.lastAccessed,
                    lastAccessedHuman: this.cycleToHuman(entity.lastAccessed)
                };

                report.deathList.push(target);
                report.markedForDeath++;
            } else {
                report.preserved++;
            }
        }

        // Phase 2: Execute apoptosis (archive dead code)
        if (!this.config.dryRun && report.deathList.length > 0) {
            for (const target of report.deathList) {
                const success = await this.archiveEntity(target);
                if (success) {
                    report.archived++;
                    report.savings.files++;
                    report.savings.bytes += target.entity.size;
                }
            }
        }

        // Phase 3: Report
        this.logApoptosisReport(report);
        this.reports.push(report);
        this.emit('apoptosis:complete', report);

        await this.saveState();
        return report;
    }

    /**
     * Check if an entity is protected from apoptosis
     */
    private isProtected(entity: CodeEntity): boolean {
        // Check protected paths
        for (const protectedPath of this.config.protectedPaths) {
            if (entity.path.includes(protectedPath)) {
                return true;
            }
        }

        // Check protected patterns
        for (const pattern of this.config.protectedPatterns) {
            if (pattern.test(entity.path)) {
                return true;
            }
        }

        // Check for dependents (if something uses this, preserve it)
        if (entity.dependents.length > 0) {
            return true;
        }

        return false;
    }

    /**
     * Evaluate if an entity should die
     */
    private evaluateForDeath(entity: CodeEntity): ApoptosisReason | null {
        const cyclesSinceAccess = this.currentCycle - entity.lastAccessed;

        // Check for staleness
        if (cyclesSinceAccess >= this.config.cycleThreshold) {
            return 'STALE_CODE';
        }

        // Check for orphan (no dependents and not recently accessed)
        if (entity.dependents.length === 0 && cyclesSinceAccess > this.config.cycleThreshold / 2) {
            return 'ORPHAN_DEPENDENCY';
        }

        // Additional heuristics could be added here:
        // - DUPLICATE_LOGIC detection via AST comparison
        // - DEPRECATED_API detection via pattern matching
        // - DEAD_IMPORT detection via import graph analysis

        return null;
    }

    /**
     * Archive an entity (move to graveyard)
     */
    private async archiveEntity(target: ApoptosisTarget): Promise<boolean> {
        try {
            const graveyardPath = path.join(
                this.config.archiveDirectory,
                `${Date.now()}_${target.entity.name}`
            );

            // Ensure graveyard exists
            await fs.mkdir(path.dirname(graveyardPath), { recursive: true });

            // Create archive manifest
            const manifest = {
                originalPath: target.entity.path,
                archivedAt: new Date().toISOString(),
                reason: target.reason,
                ageInCycles: target.ageInCycles,
                entity: target.entity,
                resurrectionHash: crypto.randomUUID()  // For potential revival
            };

            // Move file and create manifest
            try {
                await fs.copyFile(target.entity.path, graveyardPath);
                await fs.writeFile(
                    `${graveyardPath}.manifest.json`,
                    JSON.stringify(manifest, null, 2)
                );

                // Only delete after successful archive
                if (!this.config.dryRun) {
                    await fs.unlink(target.entity.path);
                }
            } catch (fileError) {
                // File might not exist on disk (could be a tracked function/class)
                console.warn(`⚠️ [APOPTOSIS] Could not archive file: ${target.entity.path}`);
            }

            // Remove from registry
            this.registry.delete(target.entity.id);
            this.accessLog.delete(target.entity.id);

            console.log(`   └─ ☠️ Archived: ${target.entity.name} (${target.reason})`);
            return true;
        } catch (error) {
            console.error(`   └─ ❌ Failed to archive: ${target.entity.name}`, error);
            return false;
        }
    }

    /**
     * Resurrect an archived entity
     */
    public async resurrect(resurrectionHash: string): Promise<boolean> {
        try {
            const graveyardPath = this.config.archiveDirectory;
            const files = await fs.readdir(graveyardPath);

            for (const file of files) {
                if (file.endsWith('.manifest.json')) {
                    const manifestPath = path.join(graveyardPath, file);
                    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

                    if (manifest.resurrectionHash === resurrectionHash) {
                        const archivePath = manifestPath.replace('.manifest.json', '');

                        // Restore the file
                        await fs.copyFile(archivePath, manifest.originalPath);

                        // Re-register in the registry
                        this.registry.set(manifest.entity.id, {
                            ...manifest.entity,
                            lastAccessed: this.currentCycle,
                            accessCount: manifest.entity.accessCount + 1
                        });

                        // Clean up archive
                        await fs.unlink(archivePath);
                        await fs.unlink(manifestPath);

                        console.log(`🔄 [APOPTOSIS] Resurrected: ${manifest.entity.name}`);
                        this.emit('entity:resurrected', manifest.entity);
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('❌ [APOPTOSIS] Resurrection failed:', error);
            return false;
        }
    }

    /**
     * Clean the graveyard if it exceeds max size
     */
    public async cleanGraveyard(): Promise<number> {
        try {
            const graveyardPath = this.config.archiveDirectory;
            const files = await fs.readdir(graveyardPath);

            let totalSize = 0;
            const fileStats: { file: string; size: number; mtime: number }[] = [];

            for (const file of files) {
                if (!file.endsWith('.manifest.json')) {
                    const filePath = path.join(graveyardPath, file);
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                    fileStats.push({ file, size: stats.size, mtime: stats.mtimeMs });
                }
            }

            if (totalSize <= this.config.maxArchiveSize) {
                return 0;
            }

            // Sort by oldest first
            fileStats.sort((a, b) => a.mtime - b.mtime);

            let cleaned = 0;
            let freedBytes = 0;

            while (totalSize > this.config.maxArchiveSize && fileStats.length > 0) {
                const oldest = fileStats.shift()!;
                const filePath = path.join(graveyardPath, oldest.file);
                const manifestPath = `${filePath}.manifest.json`;

                await fs.unlink(filePath);
                try {
                    await fs.unlink(manifestPath);
                } catch { /* manifest might not exist */ }

                totalSize -= oldest.size;
                freedBytes += oldest.size;
                cleaned++;
            }

            console.log(`🧹 [APOPTOSIS] Graveyard cleaned: ${cleaned} files, ${this.bytesToHuman(freedBytes)} freed`);
            return cleaned;
        } catch (error) {
            console.error('❌ [APOPTOSIS] Graveyard cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Log the apoptosis report
     */
    private logApoptosisReport(report: ApoptosisReport): void {
        console.log('');
        console.log('📊 [APOPTOSIS REPORT]');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`   Total Entities:     ${report.totalEntities}`);
        console.log(`   Scanned:            ${report.scanned}`);
        console.log(`   Marked for Death:   ${report.markedForDeath}`);
        console.log(`   Archived:           ${report.archived}`);
        console.log(`   Preserved:          ${report.preserved}`);
        console.log(`   Space Saved:        ${this.bytesToHuman(report.savings.bytes)}`);
        console.log('─────────────────────────────────────────────────────────────');

        if (report.deathList.length > 0) {
            console.log('');
            console.log('☠️ DEATH LIST:');
            for (const target of report.deathList.slice(0, 10)) {
                console.log(`   └─ ${target.entity.name}`);
                console.log(`      Reason: ${target.reason}`);
                console.log(`      Age: ${target.ageInCycles} cycles`);
            }
            if (report.deathList.length > 10) {
                console.log(`   └─ ... and ${report.deathList.length - 10} more`);
            }
        }
        console.log('═══════════════════════════════════════════════════════════');
    }

    /**
     * Convert path to unique ID
     */
    private pathToId(entityPath: string): string {
        return crypto.createHash('md5').update(entityPath).digest('hex');
    }

    /**
     * Infer entity type from path
     */
    private inferEntityType(entityPath: string): CodeEntity['type'] {
        const ext = path.extname(entityPath);

        if (ext === '.ts' || ext === '.js') {
            if (entityPath.includes('/functions/') || entityPath.includes('/utils/')) {
                return 'FUNCTION';
            }
            if (entityPath.includes('/classes/') || entityPath.includes('/models/')) {
                return 'CLASS';
            }
            return 'MODULE';
        }

        return 'FILE';
    }

    /**
     * Convert cycle number to human readable time
     */
    private cycleToHuman(cycle: number): string {
        const cyclesSinceNow = this.currentCycle - cycle;

        if (cyclesSinceNow < 60) return `${cyclesSinceNow} cycles ago`;
        if (cyclesSinceNow < 3600) return `${Math.floor(cyclesSinceNow / 60)} minutes ago`;
        if (cyclesSinceNow < 86400) return `${Math.floor(cyclesSinceNow / 3600)} hours ago`;
        return `${Math.floor(cyclesSinceNow / 86400)} days ago`;
    }

    /**
     * Convert bytes to human readable size
     */
    private bytesToHuman(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(2)} ${units[i]}`;
    }

    /**
     * Update configuration
     */
    public configure(config: Partial<ApoptosisConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('🦴 [APOPTOSIS] Configuration updated');
    }

    /**
     * Enable live mode (actually delete files)
     */
    public enableLiveMode(): void {
        if (this.config.dryRun) {
            console.warn('⚠️ [APOPTOSIS] LIVE MODE ENABLED - Files will be DELETED');
            this.config.dryRun = false;
        }
    }

    /**
     * Get current statistics
     */
    public getStatistics(): {
        currentCycle: number;
        registeredEntities: number;
        recentReports: number;
        totalArchived: number;
        totalPreserved: number;
    } {
        const totalArchived = this.reports.reduce((sum, r) => sum + r.archived, 0);
        const totalPreserved = this.reports.reduce((sum, r) => sum + r.preserved, 0);

        return {
            currentCycle: this.currentCycle,
            registeredEntities: this.registry.size,
            recentReports: this.reports.length,
            totalArchived,
            totalPreserved
        };
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT SINGLETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const apoptosis = ApoptosisModule.getInstance();
