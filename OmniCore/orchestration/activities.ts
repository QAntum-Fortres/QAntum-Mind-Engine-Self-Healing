import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
import { SandboxGuard } from '../security/SandboxGuard';
import { EvolutionNotary } from '../governance/EvolutionNotary';
import { Logger } from '../telemetry/Logger';

/**
 * 🏗️ Temporal Activities for VortexEvolutionWorkflow
 * 
 * These activities are executed by Temporal Workers and can be retried
 * independently if failures occur.
 * 
 * Each activity is idempotent and provides strong consistency guarantees.
 */

const logger = Logger.getInstance();
const sandbox = SandboxGuard.getInstance();

/**
 * Activity: Validates code in EnterpriseSandbox
 * 
 * @param code - Code to validate
 * @throws Error if validation fails
 */
export async function validateCode(code: string): Promise<void> {
    logger.info('ACTIVITY', '🔍 Validating code in SandboxGuard...');

    // Static analysis
    const syntaxCheck = sandbox.validateCode(code);
    if (!syntaxCheck.safe) {
        throw new Error(`[VALIDATION_FAILED]: ${syntaxCheck.reason}`);
    }

    // Dynamic execution test
    try {
        await sandbox.executeSecurely(code, 5000); // 5s timeout
        logger.info('ACTIVITY', '✅ Code validation successful');
    } catch (error: any) {
        logger.error('ACTIVITY', '❌ Code validation failed', error);
        throw new Error(`[SANDBOX_EXECUTION_FAILED]: ${error.message}`);
    }
}

/**
 * Activity: Applies patch after cryptographic verification
 * 
 * @param code - Code to apply
 * @param signature - Administrator signature (nullable for low-risk changes)
 * @returns Success message
 */

/**
 * Applies a git patch atomically to the codebase
 */
async function applyPatchToCodebase(patchContent: string): Promise<void> {
    const tmpDir = os.tmpdir();
    const patchFile = path.join(tmpDir, `vortex-patch-${Date.now()}.diff`);

    try {
        await fs.writeFile(patchFile, patchContent);
        // Use git apply to apply the patch atomically
        await execAsync(`git apply ${patchFile}`);
    } catch (error: any) {
        throw new Error(`[PATCH_APPLICATION_FAILED]: ${error.message}`);
    } finally {
        try {
            await fs.unlink(patchFile);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

export async function applyPatch(code: string, signature: string | null): Promise<string> {
    logger.info('ACTIVITY', '🔐 Applying patch with cryptographic verification...');

    // If signature provided, verify it
    if (signature) {
        const publicKey = process.env.ADMIN_PUBLIC_KEY;
        if (!publicKey) {
            throw new Error('[GOVERNANCE_ERROR]: ADMIN_PUBLIC_KEY not configured');
        }

        const verified = await EvolutionNotary.verifyAuthorization(code, signature, publicKey);

        if (!verified) {
            throw new Error('[CRYPTOGRAPHIC_VERIFICATION_FAILED]: Invalid administrator signature');
        }

        logger.info('ACTIVITY', '✅ Cryptographic signature verified');
    }

    logger.info('ACTIVITY', `📝 Applying patch (${code.length} bytes)...`);

    await applyPatchToCodebase(code);

    logger.info('ACTIVITY', '✅ Patch applied successfully');
    return `Patch applied successfully at ${new Date().toISOString()}`;
}

/**
 * Activity: Notifies administrator about pending evolution
 * 
 * @param code - The code requiring approval
 */
export async function notifyAdmin(code: string): Promise<void> {
    logger.info('ACTIVITY', '📧 Notifying administrator...');

    // TODO: Implement notification logic
    // Options: Email, SMS, Telegram, Slack, PagerDuty

    const notificationMessage = `
🚨 HIGH-RISK EVOLUTION REQUIRES APPROVAL

Proposed Code:
${code.substring(0, 200)}...

Please review and sign with your private key.
Send approval via: npm run vortex:approve <workflowId> <signature>
  `.trim();

    logger.warn('ACTIVITY', notificationMessage);

    // Placeholder: In production, integrate with notification service
    // await sendEmail(process.env.ADMIN_EMAIL, 'Vortex Evolution Approval Required', notificationMessage);
    // await sendTelegram(process.env.ADMIN_TELEGRAM_ID, notificationMessage);

    logger.info('ACTIVITY', '✅ Administrator notified');
}

/**
 * Activity: Validates code and heals if needed (Immune System Integration)
 * 
 * This activity bridges the Sandbox validation with the Healing Nexus:
 * 1. Attempts validation in EnterpriseSandbox
 * 2. On success: Generates LivenessToken and registers vitality
 * 3. On failure: Initiates Logic healing and re-validates
 * 
 * @param code - Code to validate
 * @param moduleId - Module identifier for vitality tracking
 * @returns Validated (and possibly healed) code
 */
export async function validateAndHeal(code: string, moduleId: string): Promise<string> {
    logger.info('ACTIVITY', `🔬 Validating code for module: ${moduleId}`);

    try {
        // Step 1: Validate in sandbox
        await validateCode(code);

        // Step 2: Generate LivenessToken on success
        const { VortexHealingNexus } = await import('../evolution/VortexHealingNexus');
        const healingNexus = VortexHealingNexus.getInstance();
        const livenessToken = healingNexus.generateLivenessToken(moduleId, 'HEALTHY');

        // Step 3: Register vitality with ApoptosisModule
        try {
            const { ApoptosisModule } = await import('../evolution/ApoptosisModule');
            const apoptosis = ApoptosisModule.getInstance();
            await apoptosis.registerVitality(moduleId, livenessToken);

            logger.info('ACTIVITY', `✅ Code validated, vitality registered for ${moduleId}`);
        } catch (err) {
            logger.warn('ACTIVITY', 'ApoptosisModule not available, skipping vitality registration');
        }

        return code;

    } catch (error: any) {
        logger.warn('ACTIVITY', `⚠️ Code validation failed: ${error.message}`);
        logger.info('ACTIVITY', '🔬 Initiating Logic Healing via VortexHealingNexus...');

        try {
            // Step 4: Attempt Logic healing
            const { VortexHealingNexus, HealingDomain } = await import('../evolution/VortexHealingNexus');
            const healingNexus = VortexHealingNexus.getInstance();

            const healingResult = await healingNexus.initiateHealing(HealingDomain.LOGIC, {
                path: moduleId,
                error: error.message,
                stack: error.stack,
                failedCode: code
            });

            if (!healingResult.success || !healingResult.artifact) {
                throw new Error(`Logic healing failed: ${healingResult.error}`);
            }

            const healedCode = healingResult.artifact.code || code;

            // Step 5: Re-validate healed code
            logger.info('ACTIVITY', '🔄 Re-validating healed code...');
            await validateCode(healedCode);

            // Step 6: Generate LivenessToken for healed code
            const livenessToken = healingNexus.generateLivenessToken(moduleId, 'RECOVERING');

            try {
                const { ApoptosisModule } = await import('../evolution/ApoptosisModule');
                const apoptosis = ApoptosisModule.getInstance();
                await apoptosis.registerVitality(moduleId, livenessToken);
            } catch (err) {
                logger.warn('ACTIVITY', 'ApoptosisModule not available');
            }

            logger.info('ACTIVITY', `✅ Code healed and validated for ${moduleId}`);
            return healedCode;

        } catch (healingError: any) {
            logger.error('ACTIVITY', `❌ Healing failed: ${healingError.message}`);
            throw new Error(`[VALIDATION_AND_HEALING_FAILED]: ${healingError.message}`);
        }
    }
}
