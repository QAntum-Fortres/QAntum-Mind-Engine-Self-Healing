// lwas_core/src/synthesis/polymorphic_engine.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA 2200
// STATUS: POLYMORPHIC_CORE_ACTIVE
// PHASE: 1 - Самомодификация и невидимост

//! # Полиморфен Двигател (Polymorphic Engine)
//!
//! Модул за саморедактиращ се код - първата стъпка към "Морфогенетичното Инженерство".
//! Превръща статичния Rust код в движеща се мишена (Moving Target Defense - MTD).
//!
//! ## Ключови концепции:
//! - **Code Transformation**: Промяна на логическата структура при запазване на семантиката
//! - **Signature Mutation**: Постоянна промяна на бинарния отпечатък
//! - **Anti-Analysis**: Техники за защита срещу дебъгери и анализатори

use crate::prelude::*;
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

/// Глобален брояч на мутациите за одит
static MUTATION_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Тип на полиморфна трансформация
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TransformationType {
    /// Разбъркване на контролния поток (Control Flow Flattening)
    ControlFlowFlatten,
    /// Добавяне на безполезни инструкции (Dead Code Injection)
    DeadCodeInjection,
    /// Замяна на инструкции с еквивалентни (Instruction Substitution)
    InstructionSubstitution,
    /// Преименуване на регистри (Register Reassignment)
    RegisterReassignment,
    /// Разгръщане на цикли (Loop Unrolling)
    LoopUnrolling,
    /// Криптиране на константи (Constant Encryption)
    ConstantEncryption,
}

/// Резултат от полиморфна трансформация
#[derive(Debug, Clone)]
pub struct TransformationResult {
    /// Уникален идентификатор на трансформацията
    pub mutation_id: u64,
    /// Тип на приложената трансформация
    pub transformation_type: TransformationType,
    /// Нов хеш на кода (за верификация)
    pub new_signature: [u8; 32],
    /// Време на трансформацията
    pub timestamp: u64,
    /// Метрика за ентропия (0.0 - 1.0)
    pub entropy_score: f64,
}

/// Конфигурация на полиморфния двигател
#[derive(Debug, Clone)]
pub struct PolymorphicConfig {
    /// Интервал на автоматични мутации (в милисекунди)
    pub mutation_interval_ms: u64,
    /// Минимален праг на ентропия за задействане
    pub entropy_threshold: f64,
    /// Разрешени типове трансформации
    pub allowed_transformations: Vec<TransformationType>,
    /// Режим на невидимост (активира anti-analysis)
    pub stealth_mode: bool,
    /// Seed за детерминистично тестване (None = криптографски случаен)
    pub seed: Option<u64>,
}

impl Default for PolymorphicConfig {
    fn default() -> Self {
        Self {
            mutation_interval_ms: 1000,
            entropy_threshold: 0.7,
            allowed_transformations: vec![
                TransformationType::ControlFlowFlatten,
                TransformationType::DeadCodeInjection,
                TransformationType::InstructionSubstitution,
            ],
            stealth_mode: false,
            seed: None,
        }
    }
}

/// Абстрактно представяне на код блок за трансформация
#[derive(Debug, Clone)]
pub struct CodeBlock {
    /// Уникален идентификатор на блока
    pub id: String,
    /// Съдържание на блока (байтове или псевдо-инструкции)
    pub content: Vec<u8>,
    /// Метаданни за блока
    pub metadata: HashMap<String, String>,
    /// Текуща ентропия на блока
    pub entropy: f64,
}

impl CodeBlock {
    pub fn new(id: &str, content: Vec<u8>) -> Self {
        let entropy = Self::calculate_entropy(&content);
        Self {
            id: id.to_string(),
            content,
            metadata: HashMap::new(),
            entropy,
        }
    }

    /// Изчислява Shannon entropy на байтовете
    fn calculate_entropy(data: &[u8]) -> f64 {
        if data.is_empty() {
            return 0.0;
        }

        let mut freq = [0u64; 256];
        for &byte in data {
            freq[byte as usize] += 1;
        }

        let len = data.len() as f64;
        let mut entropy = 0.0;

        for &count in &freq {
            if count > 0 {
                let p = count as f64 / len;
                entropy -= p * p.log2();
            }
        }

        // Нормализиране към 0.0 - 1.0 (max entropy за 256 символа е 8 бита)
        entropy / 8.0
    }

    /// Актуализира ентропията след трансформация
    pub fn refresh_entropy(&mut self) {
        self.entropy = Self::calculate_entropy(&self.content);
    }
}

/// Полиморфен Двигател - сърцето на саморедактиращия се код
pub struct PolymorphicEngine {
    /// Конфигурация
    config: PolymorphicConfig,
    /// Генератор на случайни числа
    rng: StdRng,
    /// Регистрирани код блокове
    code_blocks: DashMap<String, CodeBlock>,
    /// История на трансформациите
    transformation_log: Vec<TransformationResult>,
    /// Текущ глобален хеш на състоянието
    state_hash: [u8; 32],
}

impl PolymorphicEngine {
    /// Създава нов полиморфен двигател
    pub fn new(config: PolymorphicConfig) -> Self {
        let seed = config.seed.unwrap_or_else(|| {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_nanos() as u64)
                .unwrap_or(42)
        });

        Self {
            config,
            rng: StdRng::seed_from_u64(seed),
            code_blocks: DashMap::new(),
            transformation_log: Vec::new(),
            state_hash: [0u8; 32],
        }
    }

    /// Регистрира код блок за полиморфна обработка
    pub fn register_block(&self, block: CodeBlock) {
        println!(
            "🧬 [POLYMORPH] Registering code block: {} (entropy: {:.4})",
            block.id, block.entropy
        );
        self.code_blocks.insert(block.id.clone(), block);
    }

    /// Изпълнява една итерация на полиморфна мутация
    pub fn mutate(&mut self) -> SovereignResult<TransformationResult> {
        let mutation_id = MUTATION_COUNTER.fetch_add(1, Ordering::SeqCst);

        // Избираме случайна трансформация
        let transform_type = self.select_transformation();

        // Събираме ключовете на блоковете
        let keys: Vec<String> = self.code_blocks.iter().map(|e| e.key().clone()).collect();

        // Прилагаме трансформацията върху всички блокове
        let mut total_entropy = 0.0;
        let block_count = keys.len();

        for key in keys {
            if let Some(mut entry) = self.code_blocks.get_mut(&key) {
                let block = entry.value_mut();
                Self::apply_transformation_static(&mut self.rng, block, transform_type);
                total_entropy += block.entropy;
            }
        }

        let avg_entropy = if block_count > 0 {
            total_entropy / block_count as f64
        } else {
            0.0
        };

        // Изчисляваме нов хеш на състоянието
        let new_signature = self.compute_state_hash();
        self.state_hash = new_signature;

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        let result = TransformationResult {
            mutation_id,
            transformation_type: transform_type,
            new_signature,
            timestamp,
            entropy_score: avg_entropy,
        };

        self.transformation_log.push(result.clone());

        println!(
            "🔀 [POLYMORPH] Mutation #{} complete. Type: {:?}, Entropy: {:.4}",
            mutation_id, transform_type, avg_entropy
        );

        Ok(result)
    }

    /// Избира трансформация базирано на конфигурацията
    fn select_transformation(&mut self) -> TransformationType {
        let idx = self
            .rng
            .gen_range(0..self.config.allowed_transformations.len());
        self.config.allowed_transformations[idx]
    }

    /// Прилага трансформация върху код блок (статичен метод)
    fn apply_transformation_static(
        rng: &mut StdRng,
        block: &mut CodeBlock,
        transform_type: TransformationType,
    ) {
        match transform_type {
            TransformationType::ControlFlowFlatten => {
                Self::flatten_control_flow_static(rng, block);
            }
            TransformationType::DeadCodeInjection => {
                Self::inject_dead_code_static(rng, block);
            }
            TransformationType::InstructionSubstitution => {
                Self::substitute_instructions_static(rng, block);
            }
            TransformationType::RegisterReassignment => {
                Self::reassign_registers_static(rng, block);
            }
            TransformationType::LoopUnrolling => {
                Self::unroll_loops_static(block);
            }
            TransformationType::ConstantEncryption => {
                Self::encrypt_constants_static(rng, block);
            }
        }
        block.refresh_entropy();
    }

    /// Control Flow Flattening - разбъркване на последователността
    fn flatten_control_flow_static(rng: &mut StdRng, block: &mut CodeBlock) {
        // Разбъркваме байтовете с XOR и permutation
        let key = rng.gen::<u8>();
        for byte in &mut block.content {
            *byte ^= key;
        }

        // Добавяме маркер за flatten
        block
            .metadata
            .insert("flattened".to_string(), "true".to_string());
    }

    /// Dead Code Injection - добавяне на безполезни байтове
    fn inject_dead_code_static(rng: &mut StdRng, block: &mut CodeBlock) {
        let injection_count = rng.gen_range(4..16);
        let insert_pos = if block.content.is_empty() {
            0
        } else {
            rng.gen_range(0..block.content.len())
        };

        for _ in 0..injection_count {
            let junk = rng.gen::<u8>();
            if insert_pos < block.content.len() {
                block.content.insert(insert_pos, junk);
            } else {
                block.content.push(junk);
            }
        }

        block
            .metadata
            .insert("dead_code_count".to_string(), injection_count.to_string());
    }

    /// Instruction Substitution - замяна с еквивалентни операции
    fn substitute_instructions_static(rng: &mut StdRng, block: &mut CodeBlock) {
        // Симулираме замяна: A -> A XOR K XOR K (идентитет)
        let key = rng.gen::<u8>();
        for byte in &mut block.content {
            *byte = *byte ^ key ^ key; // Идентитет, но с различен път
        }

        // Добавяме шум в края
        block.content.push(rng.gen());
    }

    /// Register Reassignment - симулираме преназначаване
    fn reassign_registers_static(rng: &mut StdRng, block: &mut CodeBlock) {
        // Ротираме байтовете
        if !block.content.is_empty() {
            let rotation = rng.gen_range(1..8);
            let len = block.content.len();
            block.content.rotate_left(rotation % len);
        }
    }

    /// Loop Unrolling - разгръщаме чрез дублиране
    fn unroll_loops_static(block: &mut CodeBlock) {
        let original = block.content.clone();
        if original.len() < 100 {
            // Ограничение за размера
            block.content.extend(original);
        }
    }

    /// Constant Encryption - XOR криптиране на константи
    fn encrypt_constants_static(rng: &mut StdRng, block: &mut CodeBlock) {
        let key: [u8; 4] = rng.gen();
        for (i, byte) in block.content.iter_mut().enumerate() {
            *byte ^= key[i % 4];
        }

        // Запазваме ключа в метаданните за декриптиране
        block
            .metadata
            .insert("encryption_key".to_string(), hex::encode(key));
    }

    /// Изчислява SHA-256 хеш на цялото състояние
    fn compute_state_hash(&self) -> [u8; 32] {
        let mut hasher = Sha256::new();

        // Добавяме всички блокове в хеша
        for entry in self.code_blocks.iter() {
            hasher.update(&entry.value().content);
        }

        hasher.finalize().into()
    }

    /// Връща текущия глобален хеш
    pub fn get_state_signature(&self) -> [u8; 32] {
        self.state_hash
    }

    /// Връща история на трансформациите
    pub fn get_transformation_log(&self) -> &[TransformationResult] {
        &self.transformation_log
    }

    /// Проверява дали системата е под анализ (anti-debugging)
    pub fn detect_analysis(&self) -> bool {
        if !self.config.stealth_mode {
            return false;
        }

        // Прости техники за детекция:
        // 1. Проверка за дебъгер чрез timing
        let start = std::time::Instant::now();
        let _ = std::hint::black_box(42);
        let elapsed = start.elapsed();

        // Ако отнема твърде дълго, може да има breakpoint
        if elapsed.as_nanos() > 1_000_000 {
            println!("⚠️ [POLYMORPH] Potential analysis detected (timing anomaly)");
            return true;
        }

        // 2. Проверка на environment variables
        if std::env::var("RUST_BACKTRACE").is_ok() {
            println!("⚠️ [POLYMORPH] Debug environment detected");
            return true;
        }

        false
    }

    /// Стартира непрекъснат полиморфен цикъл (async)
    pub async fn start_continuous_mutation(&mut self, iterations: usize) -> SovereignResult<()> {
        println!(
            "🔄 [POLYMORPH] Starting continuous mutation ({} iterations)",
            iterations
        );

        for i in 0..iterations {
            if self.detect_analysis() {
                println!("🛑 [POLYMORPH] Analysis detected, entering stealth mode");
                // В реална система тук бихме влезли в скрит режим
            }

            self.mutate()?;

            // Изчакваме според конфигурацията
            tokio::time::sleep(std::time::Duration::from_millis(
                self.config.mutation_interval_ms,
            ))
            .await;

            if (i + 1) % 10 == 0 {
                println!(
                    "📊 [POLYMORPH] Progress: {}/{} mutations complete",
                    i + 1,
                    iterations
                );
            }
        }

        println!("✅ [POLYMORPH] Continuous mutation cycle complete");
        Ok(())
    }
}

/// Генератор на полиморфен код за тестване
pub fn generate_test_blocks(count: usize) -> Vec<CodeBlock> {
    let mut rng = rand::thread_rng();
    (0..count)
        .map(|i| {
            let size = rng.gen_range(32..256);
            let content: Vec<u8> = (0..size).map(|_| rng.gen()).collect();
            CodeBlock::new(&format!("test_block_{}", i), content)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_code_block_entropy() {
        // Нулева ентропия за повтарящи се данни
        let uniform = CodeBlock::new("uniform", vec![42; 100]);
        assert!(uniform.entropy < 0.1);

        // Висока ентропия за случайни данни
        let random: Vec<u8> = (0..256).map(|i| i as u8).collect();
        let high_entropy = CodeBlock::new("random", random);
        assert!(high_entropy.entropy > 0.9);
    }

    #[test]
    fn test_polymorphic_mutation() {
        let config = PolymorphicConfig {
            seed: Some(12345), // Детерминистичен seed за тестове
            ..Default::default()
        };

        let mut engine = PolymorphicEngine::new(config);

        // Регистрираме тестов блок
        let block = CodeBlock::new("test", vec![1, 2, 3, 4, 5, 6, 7, 8]);
        engine.register_block(block);

        // Изпълняваме мутация
        let result = engine.mutate().unwrap();

        assert_eq!(result.mutation_id, 0);
        assert!(result.entropy_score >= 0.0 && result.entropy_score <= 1.0);
    }

    #[test]
    fn test_transformation_log() {
        let config = PolymorphicConfig {
            seed: Some(42),
            ..Default::default()
        };

        let mut engine = PolymorphicEngine::new(config);
        engine.register_block(CodeBlock::new("test", vec![0; 64]));

        // Изпълняваме няколко мутации
        for _ in 0..5 {
            engine.mutate().unwrap();
        }

        assert_eq!(engine.get_transformation_log().len(), 5);
    }
}
