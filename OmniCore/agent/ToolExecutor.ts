import { TestRunner } from '../runner/TestRunner';
export class ToolExecutor {
  constructor(private runner: TestRunner) { }

  async execute(action: string, params: any): Promise<any> {
    console.log(`[ToolExecutor] 🔧 Trace Strat: ${action}`, params);
    try {
      switch (action) {
        case 'RUN_TEST':
          if (!params.testId) throw new Error('Missing testId');
          return await this.runner.execute(params.testId);

        case 'GET_SYSTEM_HEALTH':
          return { status: 'Online', traces: 'Active', alerts: 0 };

        case 'QUARANTINE_TEST':
          // Logic to write to DB would go here
          return { success: true, message: `Test ${params.testId} quarantined.` };

        default:
          throw new Error(`Unknown tool: ${action}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Unknown error' };
    }
  }
}
