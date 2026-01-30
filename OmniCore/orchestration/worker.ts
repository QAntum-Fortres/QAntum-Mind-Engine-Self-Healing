import { Worker } from '@temporalio/worker';
import { createActivities } from './activities';
import { DepartmentEngine } from '../DepartmentEngine';

async function run() {
    const engine = DepartmentEngine.getInstance();
    await engine.initializeAll();

    const worker = await Worker.create({
        workflowsPath: require.resolve('./workflows'),
        activities: createActivities(engine),
        taskQueue: 'vortex-core-queue',
    });

    console.log('VORTEX Worker is alive. Nervous system active.');
    await worker.run();
}

run().catch((err) => {
    console.error('Fatal Worker Error:', err);
    process.exit(1);
});
