
export enum DepartmentStatus {
    OFFLINE = 'OFFLINE',
    INITIALIZING = 'INITIALIZING',
    OPERATIONAL = 'OPERATIONAL',
    DEGRADED = 'DEGRADED',
    MAINTENANCE = 'MAINTENANCE'
}

export abstract class Department {
    protected name: string;
    protected id: string;
    protected status: DepartmentStatus = DepartmentStatus.OFFLINE;
    private startTime: number = 0;
    private metrics: { latency: number[], requests: number, errors: number } = { latency: [], requests: 0, errors: 0 };

    constructor(name: string, id: string) {
        this.name = name;
        this.id = id;
    }

    public abstract initialize(): Promise<void>;
    public abstract shutdown(): Promise<void>;
    public abstract getHealth(): Promise<any>;

    protected setStatus(status: DepartmentStatus) {
        this.status = status;
        console.log(`[${this.name}] Status changed to: ${status}`);
    }

    protected startClock() {
        this.startTime = Date.now();
    }

    protected updateMetrics(latencyMs: number, isError: boolean = false) {
        this.metrics.requests++;
        this.metrics.latency.push(latencyMs);
        if (this.metrics.latency.length > 100) this.metrics.latency.shift(); // Keep last 100
        if (isError) this.metrics.errors++;
    }

    protected getMetrics() {
        const avgLatency = this.metrics.latency.length > 0
            ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
            : 0;

        return {
            uptime: Date.now() - this.startTime,
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            avgLatency: avgLatency.toFixed(2) + 'ms'
        };
    }
}
