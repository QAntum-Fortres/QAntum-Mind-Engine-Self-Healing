import { EventEmitter } from 'events';
import { Logger } from '../telemetry/Logger';
import { Telemetry } from '../telemetry/Telemetry';

export interface QAntumEvent {
  id: string;
  topic: string;
  source: string;
  payload: any;
  timestamp: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * 🛰️ Global Event Bus
 * The backbone of asynchronous communication across the QANTUM ecosystem.
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private logger: Logger;
  private telemetry: Telemetry;
  private history: QAntumEvent[] = [];
  private maxHistory: number = 1000;

  private constructor() {
    super();
    this.logger = Logger.getInstance();
    this.telemetry = Telemetry.getInstance();
    this.setMaxListeners(100);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publishes an event to the bus
   */
  public publish(
    topic: string,
    source: string,
    payload: any,
    priority: QAntumEvent['priority'] = 'MEDIUM'
  ) {
    const event: QAntumEvent = {
      id: `EVT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      topic,
      source,
      payload,
      timestamp: Date.now(),
      priority,
    };

    this.logger.debug('EVENT', `Publishing event: ${topic} from ${source}`, { priority });

    // Record telemetry
    this.telemetry.record('event.published', 1, { topic, source, priority });

    // Store in history
    this.history.push(event);
    if (this.history.length > this.maxHistory) this.history.shift();

    // Emit to listeners
    this.emit(topic, event);
    this.emit('*', event); // Wildcard listener

    // Critical events trigger immediate logging
    if (priority === 'CRITICAL') {
      this.logger.critical('EVENT', `CRITICAL EVENT: ${topic}`, { event });
    }
  }

  /**
   * Subscribes to a specific topic
   */
  public subscribe(topic: string, handler: (event: QAntumEvent) => void) {
    this.on(topic, handler);
    this.logger.info('EVENT', `New subscription established for topic: ${topic}`);
  }

  /**
   * Subscribes to all events (wildcard)
   */
  public subscribeAll(handler: (event: QAntumEvent) => void) {
    this.on('*', handler);
  }

  /**
   * Unsubscribes a handler from a topic
   */
  public unsubscribe(topic: string, handler: (event: QAntumEvent) => void) {
    this.off(topic, handler);
  }

  /**
   * Retrieves event history filtered by topic
   */
  public getHistory(topic?: string): QAntumEvent[] {
    if (topic) {
      return this.history.filter((e) => e.topic === topic);
    }
    return [...this.history];
  }

  /**
   * Clears event history
   */
  public clearHistory() {
    this.logger.warn('EVENT', 'Event history purged.');
    this.history = [];
  }

  /**
   * Waits for a specific event to occur (Promise-based)
   */
  public waitFor(topic: string, timeoutMs: number = 30000): Promise<QAntumEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(topic, handler);
        reject(new Error(`Timeout waiting for event: ${topic}`));
      }, timeoutMs);

      const handler = (event: QAntumEvent) => {
        clearTimeout(timer);
        this.off(topic, handler);
        resolve(event);
      };

      this.once(topic, handler);
    });
  }
}
