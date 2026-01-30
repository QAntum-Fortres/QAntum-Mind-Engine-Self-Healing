import { proxyActivities, defineSignal, condition, setHandler } from '@temporalio/workflow';
import type * as activities from './activities';

/**
 * Proxy activities with 5-minute timeout for each step
 */
const { validateCode, applyPatch, notifyAdmin } = proxyActivities<typeof activities>({
    startToCloseTimeout: '5 minutes',
});

/**
 * Signal for administrator approval.
 * Allows external approval process to provide cryptographic signature.
 */
export const approvalSignal = defineSignal<[string]>('approveEvolution');

/**
 * 🔄 VortexEvolutionWorkflow - Durable Evolution Execution
 * 
 * Temporal Workflow that orchestrates the entire evolution process
 * with transactional security.
 * 
 * Workflow Steps:
 * 1. Isolated testing in EnterpriseSandbox
 * 2. Governance Gate for high-risk changes (riskScore > 0.8)
 * 3. Wait for cryptographic signature (Signal)
 * 4. Atomic patch application
 * 
 * Durability Guarantees:
 * - Survives worker crashes
 * - Survives deployment rollouts
 * - 24-hour timeout for administrator approval
 * - Full audit trail in Temporal UI
 * 
 * @param proposedCode - The code evolution to apply
 * @param riskScore - Risk assessment (0.0 to 1.0)
 * @returns Patch application result
 */
export async function vortexEvolutionWorkflow(
    proposedCode: string,
    riskScore: number
): Promise<string> {
    let adminSignature: string | null = null;

    // Setup signal handler for approval
    setHandler(approvalSignal, (signature: string) => {
        adminSignature = signature;
    });

    // Step 1: Isolated testing in sandbox
    await validateCode(proposedCode);

    // Step 2: Governance Gate for high-risk changes
    if (riskScore > 0.8) {
        // Notify administrator via email/SMS/Telegram
        await notifyAdmin(proposedCode);

        // Wait for cryptographic signature (Signal)
        // Timeout after 24 hours if no approval received
        const approved = await condition(() => adminSignature !== null, '24h');

        if (!approved) {
            throw new Error('[GOVERNANCE_GATE]: Evolution rejected - timeout waiting for administrator approval');
        }
    }

    // Step 3: Atomic patch application
    // Signature is verified inside applyPatch activity
    return await applyPatch(proposedCode, adminSignature);
}
