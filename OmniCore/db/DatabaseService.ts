export class DatabaseService {
  async getActiveTests(): Promise<string[]> {
    return ['test-login', 'test-api-latency'];
  }
}
