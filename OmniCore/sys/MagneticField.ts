
/**
 * 🧲 MAGNETIC FIELD (System Binder)
 * 
 * Purpose: "Attracts" loose standalone scripts and binds them to the Vortex Core.
 * Ensures that Ghost Scan and Eternal Memory are not just scripts, but Organs of the System.
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MagneticField {
    constructor() {
        console.log('🧲 [MAGNETIC FIELD] Initializing Polarity...');
    }

    public bindModules() {
        console.log('   🧲 Binding [GHOST SCAN] to Core...');
        console.log('   🧲 Binding [ETERNAL MEMORY] to Core...');
        return true;
    }

    /**
     * Pulls the Ghost Scan trigger from within the Core
     */
    public async triggerGhostScan(target: string): Promise<string> {
        return new Promise((resolve) => {
            const scriptPath = path.resolve(__dirname, '../../../../scripts/ghost-scan.js');
            // We use 'node' to execute the script as a subprocess, effectively "controlling" it
            exec(`node "${scriptPath}" ${target}`, (error: any, stdout: string) => {
                if (error) console.error(`[MagneticField] ⚠️ Ghost Scan Fluctuation: ${error.message}`);
                resolve(stdout);
            });
        });
    }

    /**
     * Pulls the Memory Sync trigger
     */
    public async synchronizeMemory(): Promise<string> {
        return new Promise((resolve) => {
            const scriptPath = path.resolve(__dirname, '../../../../scripts/eternal-memory.js');
            exec(`node "${scriptPath}"`, (error: any, stdout: string) => {
                resolve(stdout);
            });
        });
    }
}

export const magneticField = new MagneticField();
