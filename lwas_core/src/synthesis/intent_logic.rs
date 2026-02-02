// lwas_core/src/synthesis/intent_logic.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA 2200
// STATUS: INTENT_CORE_ACTIVE
// PHASE: 2 - От синтаксис към намерение

//! # Intent-Based Logic (Логика базирана на намерение)
//! 
//! Преход от императивно към цел-ориентирано програмиране.
//! Вместо да казваме "как", дефинираме "какво" искаме да постигнем.
//!
//! ## Ключови концепции:
//! - **Intent Definition**: Декларативно описание на целите
//! - **Constraint Satisfaction**: Автоматично намиране на решения
//! - **Continuous Validation**: Непрекъснато сравняване с целевото състояние

use crate::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Serialize, Deserialize};

/// Тип на ограничение (Constraint)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConstraintType {
    /// Числово ограничение (min, max)
    Numeric { min: f64, max: f64 },
    /// Булево ограничение
    Boolean(bool),
    /// Enum ограничение (една от стойностите)
    Enum(Vec<String>),
    /// Regex pattern ограничение
    Pattern(String),
    /// Времево ограничение (в милисекунди)
    Temporal { max_latency_ms: u64 },
    /// Ресурсно ограничение
    Resource { max_memory_mb: u64, max_cpu_percent: f64 },
}

/// Единично ограничение
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Constraint {
    /// Име на ограничението
    pub name: String,
    /// Тип на ограничението
    pub constraint_type: ConstraintType,
    /// Приоритет (по-високо = по-важно)
    pub priority: u8,
    /// Дали е задължително
    pub required: bool,
}

impl Constraint {
    pub fn new(name: &str, constraint_type: ConstraintType) -> Self {
        Self {
            name: name.to_string(),
            constraint_type,
            priority: 50,
            required: true,
        }
    }

    pub fn with_priority(mut self, priority: u8) -> Self {
        self.priority = priority;
        self
    }

    pub fn optional(mut self) -> Self {
        self.required = false;
        self
    }
}

/// Дефиниция на намерение (Intent)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentDefinition {
    /// Уникален идентификатор
    pub id: String,
    /// Човешко описание на намерението
    pub description: String,
    /// Целеви състояния (ключ -> стойност)
    pub target_states: HashMap<String, String>,
    /// Ограничения
    pub constraints: Vec<Constraint>,
    /// Допустими действия за постигане на целта
    pub allowed_actions: Vec<String>,
    /// Времева марка на създаване
    pub created_at: u64,
}

impl IntentDefinition {
    pub fn new(id: &str, description: &str) -> Self {
        let created_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        Self {
            id: id.to_string(),
            description: description.to_string(),
            target_states: HashMap::new(),
            constraints: Vec::new(),
            allowed_actions: Vec::new(),
            created_at,
        }
    }

    pub fn with_target(mut self, key: &str, value: &str) -> Self {
        self.target_states.insert(key.to_string(), value.to_string());
        self
    }

    pub fn with_constraint(mut self, constraint: Constraint) -> Self {
        self.constraints.push(constraint);
        self
    }

    pub fn with_action(mut self, action: &str) -> Self {
        self.allowed_actions.push(action.to_string());
        self
    }
}

/// Резултат от валидация на намерение
#[derive(Debug, Clone)]
pub struct ValidationResult {
    /// Дали намерението е изпълнено
    pub satisfied: bool,
    /// Процент на изпълнение (0.0 - 1.0)
    pub completion_ratio: f64,
    /// Нарушени ограничения
    pub violations: Vec<String>,
    /// Препоръчани корекции
    pub suggested_actions: Vec<String>,
}

/// Текущо състояние на системата
#[derive(Debug, Clone, Default)]
pub struct SystemState {
    /// Двойки ключ-стойност на текущото състояние
    pub values: HashMap<String, String>,
    /// Числови метрики
    pub metrics: HashMap<String, f64>,
    /// Времева марка
    pub timestamp: u64,
}

impl SystemState {
    pub fn new() -> Self {
        Self {
            values: HashMap::new(),
            metrics: HashMap::new(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0),
        }
    }

    pub fn set_value(&mut self, key: &str, value: &str) {
        self.values.insert(key.to_string(), value.to_string());
    }

    pub fn set_metric(&mut self, key: &str, value: f64) {
        self.metrics.insert(key.to_string(), value);
    }
}

/// Intent Synthesis Engine - превежда намерения в действия
pub struct IntentSynthesizer {
    /// Регистрирани намерения
    intents: DashMap<String, IntentDefinition>,
    /// Текущо състояние
    current_state: Arc<std::sync::RwLock<SystemState>>,
    /// История на валидациите
    validation_history: Vec<(String, ValidationResult)>,
}

impl IntentSynthesizer {
    pub fn new() -> Self {
        Self {
            intents: DashMap::new(),
            current_state: Arc::new(std::sync::RwLock::new(SystemState::new())),
            validation_history: Vec::new(),
        }
    }

    /// Регистрира ново намерение
    pub fn register_intent(&self, intent: IntentDefinition) {
        println!("🎯 [INTENT] Registering intent: {} - {}", intent.id, intent.description);
        self.intents.insert(intent.id.clone(), intent);
    }

    /// Актуализира текущото състояние
    pub fn update_state(&self, state: SystemState) {
        if let Ok(mut current) = self.current_state.write() {
            *current = state;
            println!("📊 [INTENT] System state updated ({} values, {} metrics)", 
                     current.values.len(), current.metrics.len());
        }
    }

    /// Валидира намерение спрямо текущото състояние
    pub fn validate_intent(&mut self, intent_id: &str) -> SovereignResult<ValidationResult> {
        let intent = self.intents.get(intent_id)
            .ok_or_else(|| SovereignError::EntropyDetected(
                format!("Intent not found: {}", intent_id)
            ))?;

        let current = self.current_state.read()
            .map_err(|e| SovereignError::EntropyDetected(e.to_string()))?;

        let mut violations = Vec::new();
        let mut satisfied_count = 0;
        let total_constraints = intent.constraints.len() + intent.target_states.len();

        // Проверяваме целевите състояния
        for (key, target_value) in &intent.target_states {
            match current.values.get(key) {
                Some(actual_value) if actual_value == target_value => {
                    satisfied_count += 1;
                }
                Some(actual_value) => {
                    violations.push(format!(
                        "State mismatch: {} expected '{}', got '{}'", 
                        key, target_value, actual_value
                    ));
                }
                None => {
                    violations.push(format!("Missing state: {}", key));
                }
            }
        }

        // Проверяваме ограниченията
        for constraint in &intent.constraints {
            if self.check_constraint(&constraint, &current) {
                satisfied_count += 1;
            } else {
                violations.push(format!("Constraint violated: {}", constraint.name));
            }
        }

        let completion_ratio = if total_constraints > 0 {
            satisfied_count as f64 / total_constraints as f64
        } else {
            1.0
        };

        let satisfied = violations.is_empty() || 
            (violations.iter().all(|v| !v.contains("required")) && completion_ratio >= 0.8);

        // Генерираме предложения за корекция
        let suggested_actions = self.generate_suggestions(&intent, &violations);

        let result = ValidationResult {
            satisfied,
            completion_ratio,
            violations,
            suggested_actions,
        };

        self.validation_history.push((intent_id.to_string(), result.clone()));

        println!("✅ [INTENT] Validation for '{}': {:.1}% complete, {} violations", 
                 intent_id, completion_ratio * 100.0, result.violations.len());

        Ok(result)
    }

    /// Проверява единично ограничение
    fn check_constraint(&self, constraint: &Constraint, state: &SystemState) -> bool {
        match &constraint.constraint_type {
            ConstraintType::Numeric { min, max } => {
                state.metrics.get(&constraint.name)
                    .map(|v| *v >= *min && *v <= *max)
                    .unwrap_or(false)
            }
            ConstraintType::Boolean(expected) => {
                state.values.get(&constraint.name)
                    .map(|v| v.parse::<bool>().unwrap_or(false) == *expected)
                    .unwrap_or(false)
            }
            ConstraintType::Enum(options) => {
                state.values.get(&constraint.name)
                    .map(|v| options.contains(v))
                    .unwrap_or(false)
            }
            ConstraintType::Pattern(pattern) => {
                state.values.get(&constraint.name)
                    .and_then(|v| regex::Regex::new(pattern).ok().map(|r| r.is_match(v)))
                    .unwrap_or(false)
            }
            ConstraintType::Temporal { max_latency_ms } => {
                state.metrics.get(&format!("{}_latency", constraint.name))
                    .map(|v| (*v as u64) <= *max_latency_ms)
                    .unwrap_or(true) // По подразбиране е ОК ако липсва метрика
            }
            ConstraintType::Resource { max_memory_mb, max_cpu_percent } => {
                let memory_ok = state.metrics.get("memory_mb")
                    .map(|v| *v <= *max_memory_mb as f64)
                    .unwrap_or(true);
                let cpu_ok = state.metrics.get("cpu_percent")
                    .map(|v| *v <= *max_cpu_percent)
                    .unwrap_or(true);
                memory_ok && cpu_ok
            }
        }
    }

    /// Генерира предложения за корекция
    fn generate_suggestions(&self, intent: &IntentDefinition, violations: &[String]) -> Vec<String> {
        let mut suggestions = Vec::new();

        for violation in violations {
            if violation.contains("State mismatch") {
                suggestions.push("Re-synthesize configuration to match target state".to_string());
            } else if violation.contains("Missing state") {
                suggestions.push("Initialize missing system state".to_string());
            } else if violation.contains("Constraint violated") {
                suggestions.push("Adjust system parameters to satisfy constraints".to_string());
            }
        }

        // Добавяме позволените действия като възможности
        for action in &intent.allowed_actions {
            suggestions.push(format!("Execute action: {}", action));
        }

        suggestions
    }

    /// Изпълнява непрекъснат цикъл на валидация
    pub async fn continuous_validation_loop(&mut self, intent_id: &str, interval_ms: u64) -> SovereignResult<()> {
        println!("🔄 [INTENT] Starting continuous validation for '{}'", intent_id);
        
        loop {
            match self.validate_intent(intent_id) {
                Ok(result) => {
                    if result.satisfied {
                        println!("✨ [INTENT] Intent '{}' fully satisfied!", intent_id);
                    } else {
                        println!("⚠️ [INTENT] Intent '{}' not satisfied. Actions needed:", intent_id);
                        for action in &result.suggested_actions {
                            println!("   → {}", action);
                        }
                    }
                }
                Err(e) => {
                    println!("❌ [INTENT] Validation error: {}", e);
                }
            }

            tokio::time::sleep(std::time::Duration::from_millis(interval_ms)).await;
        }
    }
}

/// Помощни функции за създаване на типични намерения
pub mod presets {
    use super::*;

    /// Намерение за висока наличност (High Availability)
    pub fn high_availability() -> IntentDefinition {
        IntentDefinition::new("high_availability", "Maintain system uptime above 99.9%")
            .with_target("status", "OPERATIONAL")
            .with_constraint(
                Constraint::new("uptime", ConstraintType::Numeric { min: 99.9, max: 100.0 })
                    .with_priority(100)
            )
            .with_constraint(
                Constraint::new("latency", ConstraintType::Temporal { max_latency_ms: 50 })
                    .with_priority(90)
            )
            .with_action("failover_to_backup")
            .with_action("scale_horizontally")
    }

    /// Намерение за сигурна комуникация
    pub fn secure_communication() -> IntentDefinition {
        IntentDefinition::new("secure_comm", "Ensure all communication is encrypted")
            .with_target("encryption", "AES256")
            .with_target("protocol", "TLS1.3")
            .with_constraint(
                Constraint::new("key_rotation", ConstraintType::Temporal { max_latency_ms: 86_400_000 })
                    .with_priority(80)
            )
            .with_action("rotate_keys")
            .with_action("upgrade_cipher")
    }

    /// Намерение за минимален ресурсен отпечатък
    pub fn minimal_footprint() -> IntentDefinition {
        IntentDefinition::new("minimal_footprint", "Minimize resource consumption")
            .with_constraint(
                Constraint::new("resources", ConstraintType::Resource { 
                    max_memory_mb: 512, 
                    max_cpu_percent: 50.0 
                }).with_priority(70)
            )
            .with_action("garbage_collect")
            .with_action("compress_data")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_intent_creation() {
        let intent = IntentDefinition::new("test", "Test intent")
            .with_target("status", "active")
            .with_constraint(Constraint::new("latency", ConstraintType::Numeric { min: 0.0, max: 100.0 }));

        assert_eq!(intent.id, "test");
        assert_eq!(intent.target_states.len(), 1);
        assert_eq!(intent.constraints.len(), 1);
    }

    #[test]
    fn test_validation() {
        let mut synthesizer = IntentSynthesizer::new();
        
        // Регистрираме намерение
        let intent = IntentDefinition::new("test", "Test")
            .with_target("status", "ok");
        synthesizer.register_intent(intent);

        // Състояние което удовлетворява намерението
        let mut state = SystemState::new();
        state.set_value("status", "ok");
        synthesizer.update_state(state);

        let result = synthesizer.validate_intent("test").unwrap();
        assert!(result.satisfied);
        assert_eq!(result.completion_ratio, 1.0);
    }

    #[test]
    fn test_constraint_violation() {
        let mut synthesizer = IntentSynthesizer::new();
        
        let intent = IntentDefinition::new("test", "Test")
            .with_constraint(Constraint::new("value", ConstraintType::Numeric { min: 0.0, max: 10.0 }));
        synthesizer.register_intent(intent);

        // Състояние което нарушава ограничението
        let mut state = SystemState::new();
        state.set_metric("value", 15.0); // Над максимума
        synthesizer.update_state(state);

        let result = synthesizer.validate_intent("test").unwrap();
        assert!(!result.satisfied);
        assert!(!result.violations.is_empty());
    }
}
