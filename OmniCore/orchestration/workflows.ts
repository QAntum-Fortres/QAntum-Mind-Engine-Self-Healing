import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

// We use the ReturnType of the factory to get the correct activity types
const {
    validateRequirement,
    synthesizeArchitecture,
    deployInfrastructure,
    notifyCompletion
} = proxyActivities<ReturnType<typeof activities.createActivities>>({
    startToCloseTimeout: '1 minute',
    retry: {
        initialInterval: '1s',
        backoffCoefficient: 2,
        maximumAttempts: 5,
    },
});

/**
 * 🌀 VORTEX EVOLUTION WORKFLOW
 * Deterministic logic for the autonomous evolution of the system.
 */
export async function vortexEvolutionWorkflow(requirement: string): Promise<string> {
    const isValid = await validateRequirement(requirement);
    if (!isValid) throw new Error('Invalid requirement signature.');

    const plan = await synthesizeArchitecture(requirement);
    const deployId = await deployInfrastructure(plan);

    await notifyCompletion(deployId);

    return deployId;
}
