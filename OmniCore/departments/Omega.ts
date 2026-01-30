import { Department, DepartmentStatus } from './Department';

/**
 * ⚡ Omega Department
 * Handles High-Frequency Trading, Portfolio Management, and Financial Analytics.
 */
export class OmegaDepartment extends Department {
  private assets: Map<string, any> = new Map();
  private trades: any[] = [];
  private marketFeed: any[] = [];
  private balance: number = 1000000; // Mock initial balance

  constructor() {
    super('Omega', 'dept-omega');
  }

  public async initialize(): Promise<void> {
    this.setStatus(DepartmentStatus.INITIALIZING);
    this.startClock();

    console.log('[Omega] Connecting to Global Liquidity Pools...');
    await this.simulateLoading(1500);

    this.setupMockAssets();
    this.startMarketSimulation();

    console.log('[Omega] System Operational.');
    this.setStatus(DepartmentStatus.OPERATIONAL);
  }

  private async simulateLoading(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private setupMockAssets() {
    this.assets.set('BTC', { amount: 10.5, avgPrice: 42000 });
    this.assets.set('ETH', { amount: 150.0, avgPrice: 2200 });
    this.assets.set('SOL', { amount: 500.0, avgPrice: 95 });
  }

  private startMarketSimulation() {
    setInterval(() => {
      const symbols = ['BTC', 'ETH', 'SOL', 'USDT', 'XRP'];
      const price = Math.random() * 50000;
      this.marketFeed.push({
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        price,
        timestamp: Date.now(),
      });
      if (this.marketFeed.length > 100) this.marketFeed.shift();
    }, 5000);
  }

  public async shutdown(): Promise<void> {
    this.setStatus(DepartmentStatus.OFFLINE);
    console.log('[Omega] Disconnecting from markets...');
    this.trades = [];
  }

  public async getHealth(): Promise<any> {
    return {
      status: this.status,
      portfolioValue: this.calculateTotalValue(),
      tradeCount: this.trades.length,
      balance: this.balance,
      metrics: this.getMetrics(),
    };
  }

  private calculateTotalValue(): number {
    let value = this.balance;
    this.assets.forEach((v, k) => {
      const currentPrice = this.getCurrentPrice(k);
      value += v.amount * currentPrice;
    });
    return value;
  }

  private getCurrentPrice(symbol: string): number {
    const last = this.marketFeed.filter((f) => f.symbol === symbol).pop();
    return last ? last.price : 1000; // Default
  }

  // --- Omega Specific Actions ---

  /**
   * Executes a mock trade on the current market
   */
  public async executeTrade(symbol: string, amount: number, side: 'BUY' | 'SELL'): Promise<any> {
    const startTime = Date.now();
    const price = this.getCurrentPrice(symbol);
    const total = price * amount;

    if (side === 'BUY' && total > this.balance) {
      throw new Error('Insufficient balance for trade');
    }

    const trade = {
      id: `trade_${Date.now()}`,
      symbol,
      amount,
      price,
      side,
      timestamp: Date.now(),
      status: 'COMPLETED',
    };

    if (side === 'BUY') {
      this.balance -= total;
      const current = this.assets.get(symbol) || { amount: 0, avgPrice: 0 };
      const newAmount = current.amount + amount;
      const newAvg = (current.amount * current.avgPrice + total) / newAmount;
      this.assets.set(symbol, { amount: newAmount, avgPrice: newAvg });
    } else {
      const current = this.assets.get(symbol);
      if (!current || current.amount < amount) throw new Error('Insufficient assets to sell');
      this.balance += total;
      this.assets.set(symbol, { ...current, amount: current.amount - amount });
    }

    this.trades.push(trade);
    this.updateMetrics(Date.now() - startTime);
    return trade;
  }

  /**
   * Generates a performance report for the current portfolio
   */
  public async getPerformanceReport(): Promise<any> {
    return {
      totalValue: this.calculateTotalValue(),
      assets: Object.fromEntries(this.assets),
      pnl: this.calculatePNL(),
      recentTrades: this.trades.slice(-5),
    };
  }

  private calculatePNL(): number {
    let pnl = 0;
    this.assets.forEach((v, k) => {
      const current = this.getCurrentPrice(k);
      pnl += (current - v.avgPrice) * v.amount;
    });
    return pnl;
  }
}
