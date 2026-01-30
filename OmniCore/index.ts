/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CORE MODULE BARREL FILE                                              ║
 * ║   "Unified exports for core infrastructure"                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EventBus,
  getEventBus,
  QAntumEvents,
  EmitsEvent,
  OnEvent,
  type EventHandler,
  type EventFilter,
  type EventMeta,
  type EventSubscription,
  type EventBusConfig,
  type EventStats,
  type QAntumEventType,
} from './event-bus';

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY INJECTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  Container,
  getContainer,
  BindingBuilder,
  Injectable,
  Inject,
  Optional,
  TOKENS,
  type Constructor,
  type Factory,
  type Token,
  type Binding,
  type Scope,
  type ContainerOptions,
} from './di-container';

// ═══════════════════════════════════════════════════════════════════════════════
// IMMUTABLE STATE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  deepFreeze,
  deepClone,
  merge,
  setIn,
  setPath,
  getPath,
  removeKey,
  ImmutableArray,
  ImmutableMap,
  ImmutableSet,
  ImmutableState,
  createImmutableState,
  type DeepReadonly,
} from './immutable';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

import EventBus from './event-bus';
import Container from './di-container';
import Immutable from './immutable';

export default {
  EventBus,
  Container,
  Immutable,
};
