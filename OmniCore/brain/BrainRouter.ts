/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ██████╗ ██████╗  █████╗ ██╗███╗   ██╗    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗  ║
 * ║  ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗ ║
 * ║  ██████╔╝██████╔╝███████║██║██╔██╗ ██║    ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝ ║
 * ║  ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗ ║
 * ║  ██████╔╝██║  ██║██║  ██║██║██║ ╚████║    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║ ║
 * ║  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝ ║
 * ║                                                                                               ║
 * ║                    NEURAL INTEGRATION - INTELLIGENT MODEL ROUTER                              ║
 * ║                          "Избор на правилния мозък за задачата"                               ║
 * ║                                                                                               ║
 * ║   Model Routing Logic:                                                                        ║
 * ║     • Selector Repair → Llama 3.1 8B (Fast, CSS/XPath expert)                                 ║
 * ║     • Logic Refactor  → DeepSeek-V3 (Deep reasoning, architecture)                            ║
 * ║                                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import {
  NeuralInference,
  getNeuralInference,
  TaskType,
  AIModel,
  InferenceRequest,
  InferenceResponse,
  ContextPayload,
} from '../../physics/NeuralInference';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - Brain Router Interface
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Model profile with capabilities
 */
export interface ModelProfile {
  id: AIModel;
  name: string;
  vendor: string;
  parameters: string;
  strengths: string[];
  weaknesses: string[];
  optimalTasks: TaskType[];
  vramRequirementMB: number;
  tokensPerSecond: number;
  contextWindow: number;
  costPerMToken: number;
}

/**
 * Routing decision with reasoning
 */
export interface RoutingDecision {
  selectedModel: AIModel;
  alternativeModel: AIModel;
  confidence: number;
  reasoning: string[];
  taskAnalysis: TaskAnalysis;
  resourceCheck: ResourceCheck;
}

/**
 * Task analysis result
 */
export interface TaskAnalysis {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'extreme';
  domain: TaskDomain;
  requiredCapabilities: string[];
  estimatedTokens: number;
  timeEstimateMs: number;
}

/**
 * Task domain
 */
export type TaskDomain =
  | 'selector' // CSS/XPath selectors
  | 'logic' // Business logic
  | 'architecture' // System design
  | 'security' // Security analysis
  | 'testing' // Test generation
  | 'documentation' // Docs generation
  | 'optimization' // Performance tuning
  | 'debugging'; // Bug fixing

/**
 * Resource availability check
 */
export interface ResourceCheck {
  gpuAvailable: boolean;
  gpuMemoryFreeMB: number;
  modelLoaded: boolean;
  queueDepth: number;
  estimatedWaitMs: number;
}

/**
 * Routing history entry
 */
export interface RoutingHistoryEntry {
  timestamp: number;
  task: TaskType;
  input: string;
  selectedModel: AIModel;
  outcome: 'success' | 'failure' | 'partial';
  latencyMs: number;
  passRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Available model profiles
 */
const MODEL_PROFILES: Map<AIModel, ModelProfile> = new Map([
  [
    'llama3.1:8b',
    {
      id: 'llama3.1:8b',
      name: 'Llama 3.1 8B',
      vendor: 'Meta',
      parameters: '8B',
      strengths: [
        'Fast inference',
        'Low VRAM usage',
        'Excellent for structured output',
        'Great at following formats',
        'CSS/XPath expertise',
        'Consistent selector generation',
      ],
      weaknesses: ['Limited reasoning depth', 'Smaller context window', 'Less creative solutions'],
      optimalTasks: ['selector-repair', 'code-review', 'test-generation', 'security-audit'],
      vramRequirementMB: 4500,
      tokensPerSecond: 85,
      contextWindow: 8192,
      costPerMToken: 0,
    },
  ],

  [
    'deepseek-v3',
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      vendor: 'DeepSeek',
      parameters: '67B (MoE)',
      strengths: [
        'Superior reasoning',
        'Deep architectural understanding',
        'Complex refactoring',
        'Multi-step problem solving',
        'Excellent code comprehension',
        'Strong at optimization',
      ],
      weaknesses: ['Slower inference', 'Higher VRAM usage', 'Overkill for simple tasks'],
      optimalTasks: ['logic-refactor', 'bug-fix', 'architecture', 'optimization'],
      vramRequirementMB: 5500,
      tokensPerSecond: 45,
      contextWindow: 32768,
      costPerMToken: 0,
    },
  ],

  [
    'deepseek-coder-v2',
    {
      id: 'deepseek-coder-v2',
      name: 'DeepSeek Coder V2',
      vendor: 'DeepSeek',
      parameters: '16B',
      strengths: [
        'Code-optimized',
        'Fill-in-the-middle support',
        'Multiple programming languages',
        'Function completion',
      ],
      weaknesses: ['Less reasoning than V3', 'Focused only on code'],
      optimalTasks: ['code-generation', 'optimization'],
      vramRequirementMB: 5000,
      tokensPerSecond: 65,
      contextWindow: 16384,
      costPerMToken: 0,
    },
  ],

  [
    'mistral:7b',
    {
      id: 'mistral:7b',
      name: 'Mistral 7B',
      vendor: 'Mistral AI',
      parameters: '7B',
      strengths: [
        'Fast and efficient',
        'Great at documentation',
        'Natural language fluency',
        'Low resource usage',
      ],
      weaknesses: ['Limited complex reasoning', 'Smaller than competitors'],
      optimalTasks: ['documentation'],
      vramRequirementMB: 4000,
      tokensPerSecond: 95,
      contextWindow: 8192,
      costPerMToken: 0,
    },
  ],
]);

// ═══════════════════════════════════════════════════════════════════════════════
// BRAIN ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BrainRouter - Intelligent Model Selection
 *
 * Routes AI tasks to the optimal model based on:
 * - Task type and complexity
 * - Model capabilities and strengths
 * - Available resources (GPU, VRAM)
 * - Historical performance
 */
export class BrainRouter extends EventEmitter {
  private static instance: BrainRouter;

  private neuralInference: NeuralInference;
  private routingHistory: RoutingHistoryEntry[] = [];
  private modelPerformance: Map<AIModel, { success: number; total: number }> = new Map();
  private currentGPUMemoryMB = 6144; // RTX 4050 VRAM

  private readonly MAX_HISTORY = 1000;

  private constructor() {
    super();
    this.neuralInference = getNeuralInference();
    this.initializePerformanceTracking();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BrainRouter {
    if (!BrainRouter.instance) {
      BrainRouter.instance = new BrainRouter();
    }
    return BrainRouter.instance;
  }

  /**
   * Route a task to the optimal model
   */
  async route(task: TaskType, input: string, context?: ContextPayload): Promise<RoutingDecision> {
    console.log(`🧠 BrainRouter: Analyzing task "${task}"...`);

    // Analyze the task
    const taskAnalysis = this.analyzeTask(task, input);
    console.log(`   Complexity: ${taskAnalysis.complexity}, Domain: ${taskAnalysis.domain}`);

    // Check available resources
    const resourceCheck = await this.checkResources();
    console.log(
      `   GPU: ${resourceCheck.gpuAvailable}, Free VRAM: ${resourceCheck.gpuMemoryFreeMB}MB`
    );

    // Select optimal model
    const decision = this.selectModel(task, taskAnalysis, resourceCheck);
    console.log(
      `   Selected: ${decision.selectedModel} (Confidence: ${(decision.confidence * 100).toFixed(0)}%)`
    );

    this.emit('route:decision', decision);
    return decision;
  }

  /**
   * Execute a routed inference
   */
  async execute(
    task: TaskType,
    prompt: string,
    context?: ContextPayload,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<InferenceResponse> {
    const startTime = Date.now();

    // Route to optimal model
    const decision = await this.route(task, prompt, context);

    // Execute inference
    const response = await this.neuralInference.infer({
      task,
      prompt,
      context,
      priority,
      options: {
        model: decision.selectedModel,
      },
    });

    // Record routing outcome
    this.recordOutcome(task, prompt, decision.selectedModel, response, Date.now() - startTime);

    return response;
  }

  /**
   * Execute with automatic fallback
   */
  async executeWithFallback(
    task: TaskType,
    prompt: string,
    context?: ContextPayload
  ): Promise<InferenceResponse> {
    const decision = await this.route(task, prompt, context);

    try {
      return await this.execute(task, prompt, context);
    } catch (primaryError) {
      console.warn(
        `⚠️ Primary model ${decision.selectedModel} failed, trying ${decision.alternativeModel}`
      );

      return this.neuralInference.infer({
        task,
        prompt,
        context,
        priority: 'high',
        options: {
          model: decision.alternativeModel,
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORE ROUTING LOGIC
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Analyze task complexity and domain
   */
  private analyzeTask(task: TaskType, input: string): TaskAnalysis {
    // Determine domain from task type
    const domainMap: Record<TaskType, TaskDomain> = {
      'selector-repair': 'selector',
      'logic-refactor': 'logic',
      'code-generation': 'logic',
      'code-review': 'logic',
      'test-generation': 'testing',
      'bug-fix': 'debugging',
      documentation: 'documentation',
      architecture: 'architecture',
      optimization: 'optimization',
      'security-audit': 'security',
    };

    const domain = domainMap[task];

    // Estimate complexity based on input
    const inputLength = input.length;
    const hasMultipleFiles = input.includes('---') || input.includes('```');
    const hasErrorStack = input.includes('Error:') || input.includes('at ');
    const hasArchitecturalTerms = /pattern|architecture|refactor|redesign/i.test(input);

    let complexity: TaskAnalysis['complexity'] = 'simple';

    if (inputLength > 5000 || hasArchitecturalTerms) {
      complexity = 'complex';
    } else if (inputLength > 2000 || hasMultipleFiles || hasErrorStack) {
      complexity = 'moderate';
    } else if (inputLength > 500) {
      complexity = 'simple';
    } else {
      complexity = 'trivial';
    }

    // Extreme complexity for architecture tasks
    if (task === 'architecture' || task === 'logic-refactor') {
      if (complexity === 'complex') complexity = 'extreme';
      else if (complexity === 'moderate') complexity = 'complex';
    }

    // Determine required capabilities
    const requiredCapabilities: string[] = [];

    if (domain === 'selector') {
      requiredCapabilities.push('CSS expertise', 'XPath knowledge', 'DOM understanding');
    }
    if (domain === 'logic' || domain === 'architecture') {
      requiredCapabilities.push('Deep reasoning', 'Pattern recognition', 'Code comprehension');
    }
    if (domain === 'security') {
      requiredCapabilities.push('Security knowledge', 'Vulnerability detection');
    }
    if (domain === 'testing') {
      requiredCapabilities.push('Test pattern generation', 'Edge case thinking');
    }

    // Estimate tokens
    const estimatedTokens = Math.ceil(inputLength / 4) + 2000; // Input + expected output

    // Estimate time based on complexity
    const timeEstimates = {
      trivial: 500,
      simple: 1500,
      moderate: 4000,
      complex: 10000,
      extreme: 30000,
    };

    return {
      complexity,
      domain,
      requiredCapabilities,
      estimatedTokens,
      timeEstimateMs: timeEstimates[complexity],
    };
  }

  /**
   * Check resource availability
   */
  private async checkResources(): Promise<ResourceCheck> {
    const gpuAvailable = this.neuralInference.isGPUAvailable();

    return {
      gpuAvailable,
      gpuMemoryFreeMB: gpuAvailable ? this.currentGPUMemoryMB * 0.7 : 0,
      modelLoaded: true, // Simplified
      queueDepth: 0,
      estimatedWaitMs: 0,
    };
  }

  /**
   * Select optimal model based on analysis
   */
  private selectModel(
    task: TaskType,
    analysis: TaskAnalysis,
    resources: ResourceCheck
  ): RoutingDecision {
    const reasoning: string[] = [];
    let selectedModel: AIModel;
    let alternativeModel: AIModel;
    let confidence = 0.8;

    // PRIMARY ROUTING RULES (as specified)

    // Rule 1: Selector Repair → Llama 3.1 8B
    if (task === 'selector-repair' || analysis.domain === 'selector') {
      selectedModel = 'llama3.1:8b';
      alternativeModel = 'mistral:7b';
      reasoning.push('Selector task → Using Llama 3.1 8B (fast, structured output specialist)');
      reasoning.push('Llama 3.1 8B excels at CSS/XPath selector generation');
      confidence = 0.95;
    }

    // Rule 2: Logic Refactor → DeepSeek-V3
    else if (
      task === 'logic-refactor' ||
      task === 'architecture' ||
      analysis.complexity === 'extreme'
    ) {
      selectedModel = 'deepseek-v3';
      alternativeModel = 'deepseek-coder-v2';
      reasoning.push('Complex logic/architecture task → Using DeepSeek-V3 (superior reasoning)');
      reasoning.push('DeepSeek-V3 has deep architectural understanding for refactoring');
      confidence = 0.92;
    }

    // Rule 3: Code Generation → DeepSeek Coder V2
    else if (task === 'code-generation' || task === 'optimization') {
      selectedModel = 'deepseek-coder-v2';
      alternativeModel = 'llama3.1:8b';
      reasoning.push('Code generation task → Using DeepSeek Coder V2 (code-optimized)');
      confidence = 0.88;
    }

    // Rule 4: Documentation → Mistral 7B
    else if (task === 'documentation') {
      selectedModel = 'mistral:7b';
      alternativeModel = 'llama3.1:8b';
      reasoning.push('Documentation task → Using Mistral 7B (fluent, efficient)');
      confidence = 0.85;
    }

    // Rule 5: Bug Fix → DeepSeek-V3
    else if (task === 'bug-fix' || analysis.domain === 'debugging') {
      selectedModel = 'deepseek-v3';
      alternativeModel = 'llama3.1:8b';
      reasoning.push('Bug fix task → Using DeepSeek-V3 (deep problem analysis)');
      confidence = 0.9;
    }

    // Default: Use Llama 3.1 8B for speed
    else {
      selectedModel = 'llama3.1:8b';
      alternativeModel = 'deepseek-coder-v2';
      reasoning.push('General task → Using Llama 3.1 8B (balanced performance)');
      confidence = 0.75;
    }

    // Adjust based on resources
    const selectedProfile = MODEL_PROFILES.get(selectedModel)!;
    if (resources.gpuMemoryFreeMB < selectedProfile.vramRequirementMB) {
      reasoning.push(
        `Insufficient VRAM (${resources.gpuMemoryFreeMB}MB < ${selectedProfile.vramRequirementMB}MB)`
      );
      reasoning.push(`Falling back to ${alternativeModel}`);
      [selectedModel, alternativeModel] = [alternativeModel, selectedModel];
      confidence *= 0.8;
    }

    // Adjust based on historical performance
    const performance = this.modelPerformance.get(selectedModel);
    if (performance && performance.total > 10) {
      const successRate = performance.success / performance.total;
      if (successRate < 0.7) {
        reasoning.push(
          `Historical success rate low (${(successRate * 100).toFixed(0)}%), reducing confidence`
        );
        confidence *= successRate;
      }
    }

    return {
      selectedModel,
      alternativeModel,
      confidence,
      reasoning,
      taskAnalysis: analysis,
      resourceCheck: resources,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERFORMANCE TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    for (const model of MODEL_PROFILES.keys()) {
      this.modelPerformance.set(model, { success: 0, total: 0 });
    }
  }

  /**
   * Record routing outcome
   */
  private recordOutcome(
    task: TaskType,
    input: string,
    model: AIModel,
    response: InferenceResponse,
    latencyMs: number
  ): void {
    const outcome = response.metadata.finishReason === 'stop' ? 'success' : 'failure';
    const passRate = outcome === 'success' ? 100 : 0;

    // Update history
    this.routingHistory.push({
      timestamp: Date.now(),
      task,
      input: input.slice(0, 100),
      selectedModel: model,
      outcome,
      latencyMs,
      passRate,
    });

    // Trim history
    if (this.routingHistory.length > this.MAX_HISTORY) {
      this.routingHistory = this.routingHistory.slice(-this.MAX_HISTORY);
    }

    // Update performance stats
    const perf = this.modelPerformance.get(model)!;
    perf.total++;
    if (outcome === 'success') perf.success++;

    this.emit('outcome:recorded', { task, model, outcome, latencyMs });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get available models
   */
  getAvailableModels(): ModelProfile[] {
    return Array.from(MODEL_PROFILES.values());
  }

  /**
   * Get model profile
   */
  getModelProfile(model: AIModel): ModelProfile | undefined {
    return MODEL_PROFILES.get(model);
  }

  /**
   * Get routing history
   */
  getRoutingHistory(limit = 100): RoutingHistoryEntry[] {
    return this.routingHistory.slice(-limit);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Map<AIModel, { success: number; total: number; successRate: number }> {
    const stats = new Map();
    for (const [model, perf] of this.modelPerformance) {
      stats.set(model, {
        ...perf,
        successRate: perf.total > 0 ? perf.success / perf.total : 0,
      });
    }
    return stats;
  }

  /**
   * Get recommended model for task
   */
  getRecommendedModel(task: TaskType): AIModel {
    const recommendations: Record<TaskType, AIModel> = {
      'selector-repair': 'llama3.1:8b',
      'logic-refactor': 'deepseek-v3',
      'code-generation': 'deepseek-coder-v2',
      'code-review': 'llama3.1:8b',
      'test-generation': 'llama3.1:8b',
      'bug-fix': 'deepseek-v3',
      documentation: 'mistral:7b',
      architecture: 'deepseek-v3',
      optimization: 'deepseek-coder-v2',
      'security-audit': 'llama3.1:8b',
    };
    return recommendations[task];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getBrainRouter = () => BrainRouter.getInstance();

export default BrainRouter;
