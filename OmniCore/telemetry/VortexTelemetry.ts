import { trace, Span, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { Telemetry } from './Telemetry';
import { Logger } from './Logger';

/**
 * 🔭 VortexTelemetry - Enterprise-Grade Cognitive Observability
 * 
 * Extends base Telemetry with distributed tracing for cognitive operations.
 * Every "thought", evolution, and consensus decision becomes a traceable span
 * in Jaeger/Honeycomb for complete audit compliance and forensic analysis.
 * 
 * Key Features:
 * - Thought-level tracing with agent attribution
 * - Evolution consensus tracing with twin validation metadata
 * - Apoptosis (code death) tracing for compliance
 * - Context propagation across async Temporal workflows
 * 
 * Integration: Jaeger (localhost:14268) or Honeycomb (cloud SaaS)
 */
export class VortexTelemetry extends Telemetry {
    private static instance: VortexTelemetry;
    private tracer = trace.getTracer('vortex-cognitive-engine', '1.0.0');
    private logger: Logger;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
    }

    public static getInstance(): VortexTelemetry {
        if (!VortexTelemetry.instance) {
            VortexTelemetry.instance = new VortexTelemetry();
        }
        return VortexTelemetry.instance;
    }

    /**
     * Traces a cognitive thought process.
     * Creates a distributed span for a single agent reasoning step.
     * 
     * @param agentId - Unique identifier of the AI agent
     * @param thoughtId - Unique thought/reasoning chain ID
     * @param metadata - Additional context (e.g., tokens, model, temperature)
     * @param action - The async cognitive operation to trace
     * @returns Result of the cognitive action
     */
    async traceCognition<T>(
        agentId: string,
        thoughtId: string,
        metadata: Record<string, any>,
        action: () => Promise<T>
    ): Promise<T> {
        return this.tracer.startActiveSpan(`vortex.cognition.${thoughtId}`, async (span: Span) => {
            const startTime = Date.now();

            span.setAttributes({
                'vortex.agent.id': agentId,
                'vortex.thought.id': thoughtId,
                'vortex.thought.timestamp': startTime,
                'vortex.thought.metadata': JSON.stringify(metadata),
                'vortex.component': 'cognitive_core',
            });

            try {
                this.logger.debug('TELEMETRY', `🧠 Tracing cognition: ${thoughtId} (agent: ${agentId})`);
                const result = await action();

                const duration = Date.now() - startTime;
                span.setAttribute('vortex.thought.duration_ms', duration);
                span.setAttribute('vortex.thought.status', 'success');
                span.setStatus({ code: SpanStatusCode.OK });

                this.record('cognitive.thought', 1, { agentId, thoughtId, status: 'success' });
                this.record('cognitive.latency', duration, { agentId, thoughtId });

                return result;
            } catch (error: any) {
                span.recordException(error);
                span.setAttribute('vortex.thought.error', error.message);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                this.record('cognitive.thought', 1, { agentId, thoughtId, status: 'error' });
                this.logger.critical('TELEMETRY', `❌ Cognitive failure: ${thoughtId}`, error);

                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Traces an evolution consensus process.
     * Captures adversarial twin validation, debate outcomes, and approval status.
     * 
     * @param evolutionId - Unique evolution/mutation ID
     * @param stage - Consensus stage (proposal, validation, debate, approval)
     * @param metadata - Twin responses, risk scores, etc.
     * @param action - The async consensus operation to trace
     * @returns Consensus result
     */
    async traceEvolution<T>(
        evolutionId: string,
        stage: 'proposal' | 'validation' | 'debate' | 'approval',
        metadata: Record<string, any>,
        action: () => Promise<T>
    ): Promise<T> {
        return this.tracer.startActiveSpan(`vortex.evolution.${stage}`, async (span: Span) => {
            const startTime = Date.now();

            span.setAttributes({
                'vortex.evolution.id': evolutionId,
                'vortex.evolution.stage': stage,
                'vortex.evolution.timestamp': startTime,
                'vortex.evolution.metadata': JSON.stringify(metadata),
                'vortex.component': 'adversarial_consensus',
            });

            try {
                this.logger.debug('TELEMETRY', `🔄 Tracing evolution: ${evolutionId} (stage: ${stage})`);
                const result = await action();

                const duration = Date.now() - startTime;
                span.setAttribute('vortex.evolution.duration_ms', duration);
                span.setAttribute('vortex.evolution.approved', (result as any).approved || false);
                span.setStatus({ code: SpanStatusCode.OK });

                this.record('evolution.consensus', 1, { evolutionId, stage, status: 'complete' });
                this.record('evolution.latency', duration, { evolutionId, stage });

                return result;
            } catch (error: any) {
                span.recordException(error);
                span.setAttribute('vortex.evolution.error', error.message);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                this.record('evolution.consensus', 1, { evolutionId, stage, status: 'error' });
                this.logger.critical('TELEMETRY', `❌ Evolution failure: ${evolutionId}`, error);

                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Traces apoptosis (programmed death) execution.
     * Captures which code entities were archived and why.
     * 
     * @param cycleId - Apoptosis cycle identifier
     * @param metadata - Archived entities, graveyard path, cycle threshold
     * @param action - The async apoptosis operation to trace
     * @returns Apoptosis report
     */
    async traceApoptosis<T>(
        cycleId: string,
        metadata: Record<string, any>,
        action: () => Promise<T>
    ): Promise<T> {
        return this.tracer.startActiveSpan('vortex.apoptosis.execution', async (span: Span) => {
            const startTime = Date.now();

            span.setAttributes({
                'vortex.apoptosis.cycle_id': cycleId,
                'vortex.apoptosis.timestamp': startTime,
                'vortex.apoptosis.metadata': JSON.stringify(metadata),
                'vortex.component': 'mortality_engine',
            });

            try {
                this.logger.debug('TELEMETRY', `💀 Tracing apoptosis: ${cycleId}`);
                const result = await action();

                const duration = Date.now() - startTime;
                const archivedCount = (result as any).archived || 0;

                span.setAttribute('vortex.apoptosis.duration_ms', duration);
                span.setAttribute('vortex.apoptosis.archived_count', archivedCount);
                span.setStatus({ code: SpanStatusCode.OK });

                this.record('apoptosis.execution', 1, { cycleId, status: 'complete' });
                this.record('apoptosis.archived_entities', archivedCount, { cycleId });
                this.record('apoptosis.latency', duration, { cycleId });

                return result;
            } catch (error: any) {
                span.recordException(error);
                span.setAttribute('vortex.apoptosis.error', error.message);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                this.record('apoptosis.execution', 1, { cycleId, status: 'error' });
                this.logger.critical('TELEMETRY', `❌ Apoptosis failure: ${cycleId}`, error);

                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Traces governance gate approval process.
     * Captures critical evolution approval requests and administrator responses.
     * 
     * @param evolutionId - Evolution requesting approval
     * @param impact - Risk impact level (LOW, MEDIUM, HIGH, CRITICAL)
     * @param action - The async governance operation to trace
     * @returns Approval decision
     */
    async traceGovernance<T>(
        evolutionId: string,
        impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        action: () => Promise<T>
    ): Promise<T> {
        return this.tracer.startActiveSpan('vortex.governance.approval', async (span: Span) => {
            const startTime = Date.now();

            span.setAttributes({
                'vortex.governance.evolution_id': evolutionId,
                'vortex.governance.impact': impact,
                'vortex.governance.timestamp': startTime,
                'vortex.component': 'governance_gate',
            });

            try {
                this.logger.debug('TELEMETRY', `🛡️ Tracing governance: ${evolutionId} (impact: ${impact})`);
                const result = await action();

                const duration = Date.now() - startTime;
                const approved = (result as any).approved || false;

                span.setAttribute('vortex.governance.duration_ms', duration);
                span.setAttribute('vortex.governance.approved', approved);
                span.setAttribute('vortex.governance.administrator', (result as any).administratorId || 'auto');
                span.setStatus({ code: SpanStatusCode.OK });

                this.record('governance.approval', 1, { evolutionId, impact, approved: approved ? 'yes' : 'no' });
                this.record('governance.latency', duration, { evolutionId, impact });

                return result;
            } catch (error: any) {
                span.recordException(error);
                span.setAttribute('vortex.governance.error', error.message);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                this.record('governance.approval', 1, { evolutionId, impact, status: 'error' });
                this.logger.critical('TELEMETRY', `❌ Governance failure: ${evolutionId}`, error);

                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Propagates trace context to external services (e.g., adversarial twins).
     * Returns trace headers for HTTP requests.
     */
    getTraceHeaders(): Record<string, string> {
        const activeContext = context.active();
        const headers: Record<string, string> = {};

        propagation.inject(activeContext, headers);

        return headers;
    }

    /**
     * Extracts trace context from incoming requests.
     * Allows distributed tracing across services.
     */
    extractTraceContext(headers: Record<string, string>): void {
        const extractedContext = propagation.extract(context.active(), headers);
        context.with(extractedContext, () => {
            this.logger.debug('TELEMETRY', '📥 Trace context extracted from headers');
        });
    }
}
