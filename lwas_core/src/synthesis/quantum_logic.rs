// lwas_core/src/synthesis/quantum_logic.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA 2200
// STATUS: QUANTUM_LOGIC_ACTIVE
// PHASE: 3 - Квантова и не-бинарна логика

//! # Quantum-Inspired Logic (Квантово-вдъхновена логика)
//! 
//! Симулация на квантови принципи върху класически хардуер.
//! Позволява работа с вероятностни състояния и суперпозиция.
//!
//! ## Ключови концепции:
//! - **Superposition**: Едновременно държане на множество състояния
//! - **Probabilistic Computing**: Решения базирани на вероятности
//! - **Hyperdimensional Vectors**: Кодиране в многомерни пространства

use crate::prelude::*;
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;
use std::f64::consts::PI;

/// Квантово състояние - суперпозиция от възможности
#[derive(Debug, Clone)]
pub struct QuantumState {
    /// Вероятностни амплитуди за всяко базово състояние
    /// Индекс 0 = |0⟩, Индекс 1 = |1⟩, и т.н.
    pub amplitudes: Vec<Complex>,
    /// Броят кюбити в състоянието
    pub num_qubits: usize,
    /// Дали състоянието е колапсирано
    pub collapsed: bool,
    /// Колапсирана стойност (ако е приложимо)
    pub classical_value: Option<usize>,
}

/// Комплексно число за квантови амплитуди
#[derive(Debug, Clone, Copy)]
pub struct Complex {
    pub real: f64,
    pub imag: f64,
}

impl Complex {
    pub fn new(real: f64, imag: f64) -> Self {
        Self { real, imag }
    }

    pub fn zero() -> Self {
        Self { real: 0.0, imag: 0.0 }
    }

    pub fn one() -> Self {
        Self { real: 1.0, imag: 0.0 }
    }

    pub fn from_polar(magnitude: f64, phase: f64) -> Self {
        Self {
            real: magnitude * phase.cos(),
            imag: magnitude * phase.sin(),
        }
    }

    /// Magnitude squared (|z|²) - вероятност
    pub fn probability(&self) -> f64 {
        self.real * self.real + self.imag * self.imag
    }

    pub fn magnitude(&self) -> f64 {
        self.probability().sqrt()
    }

    pub fn conjugate(&self) -> Self {
        Self { real: self.real, imag: -self.imag }
    }

    pub fn add(&self, other: &Self) -> Self {
        Self {
            real: self.real + other.real,
            imag: self.imag + other.imag,
        }
    }

    pub fn mul(&self, other: &Self) -> Self {
        Self {
            real: self.real * other.real - self.imag * other.imag,
            imag: self.real * other.imag + self.imag * other.real,
        }
    }

    pub fn scale(&self, factor: f64) -> Self {
        Self {
            real: self.real * factor,
            imag: self.imag * factor,
        }
    }
}

impl QuantumState {
    /// Създава състояние |0...0⟩ (всички кюбити в 0)
    pub fn zero_state(num_qubits: usize) -> Self {
        let dim = 1 << num_qubits; // 2^n
        let mut amplitudes = vec![Complex::zero(); dim];
        amplitudes[0] = Complex::one(); // |00...0⟩
        
        Self {
            amplitudes,
            num_qubits,
            collapsed: false,
            classical_value: None,
        }
    }

    /// Създава равномерна суперпозиция (Hadamard на всички)
    pub fn uniform_superposition(num_qubits: usize) -> Self {
        let dim = 1 << num_qubits;
        let amplitude = 1.0 / (dim as f64).sqrt();
        let amplitudes = vec![Complex::new(amplitude, 0.0); dim];
        
        Self {
            amplitudes,
            num_qubits,
            collapsed: false,
            classical_value: None,
        }
    }

    /// Нормализира състоянието (сумата от вероятностите = 1)
    pub fn normalize(&mut self) {
        let total_prob: f64 = self.amplitudes.iter()
            .map(|a| a.probability())
            .sum();
        
        if total_prob > 0.0 {
            let factor = 1.0 / total_prob.sqrt();
            for amp in &mut self.amplitudes {
                *amp = amp.scale(factor);
            }
        }
    }

    /// Връща вероятността за измерване на дадено състояние
    pub fn probability_of(&self, state_index: usize) -> f64 {
        if state_index < self.amplitudes.len() {
            self.amplitudes[state_index].probability()
        } else {
            0.0
        }
    }

    /// Измерва (колапсира) квантовото състояние
    pub fn measure(&mut self, rng: &mut StdRng) -> usize {
        if self.collapsed {
            return self.classical_value.unwrap_or(0);
        }

        // Генерираме случайно число между 0 и 1
        let random_value: f64 = rng.gen();
        let mut cumulative_prob = 0.0;

        for (index, amplitude) in self.amplitudes.iter().enumerate() {
            cumulative_prob += amplitude.probability();
            if random_value < cumulative_prob {
                // Колапсираме към това състояние
                self.collapsed = true;
                self.classical_value = Some(index);
                
                // Занулявам всички други амплитуди
                for (i, amp) in self.amplitudes.iter_mut().enumerate() {
                    if i == index {
                        *amp = Complex::one();
                    } else {
                        *amp = Complex::zero();
                    }
                }
                
                return index;
            }
        }

        // Ако стигнем тук, връщаме последното състояние
        let last = self.amplitudes.len() - 1;
        self.collapsed = true;
        self.classical_value = Some(last);
        last
    }

    /// Прилага Hadamard gate на кюбит
    pub fn hadamard(&mut self, qubit: usize) {
        if qubit >= self.num_qubits || self.collapsed {
            return;
        }

        let sqrt2_inv = 1.0 / 2.0_f64.sqrt();
        let dim = self.amplitudes.len();
        let step = 1 << qubit;

        for i in (0..dim).step_by(2 * step) {
            for j in i..(i + step) {
                let a = self.amplitudes[j];
                let b = self.amplitudes[j + step];
                
                self.amplitudes[j] = a.add(&b).scale(sqrt2_inv);
                self.amplitudes[j + step] = a.add(&b.scale(-1.0)).scale(sqrt2_inv);
            }
        }
    }

    /// Прилага CNOT gate (контролирано NOT)
    pub fn cnot(&mut self, control: usize, target: usize) {
        if control >= self.num_qubits || target >= self.num_qubits || self.collapsed {
            return;
        }

        let dim = self.amplitudes.len();
        let control_mask = 1 << control;
        let target_mask = 1 << target;

        for i in 0..dim {
            // Ако контролният бит е 1, разменяме target бита
            if (i & control_mask) != 0 {
                let j = i ^ target_mask;
                if i < j {
                    self.amplitudes.swap(i, j);
                }
            }
        }
    }

    /// Прилага Phase Shift gate
    pub fn phase_shift(&mut self, qubit: usize, angle: f64) {
        if qubit >= self.num_qubits || self.collapsed {
            return;
        }

        let phase = Complex::from_polar(1.0, angle);
        let mask = 1 << qubit;

        for (i, amp) in self.amplitudes.iter_mut().enumerate() {
            if (i & mask) != 0 {
                *amp = amp.mul(&phase);
            }
        }
    }
}

/// Вероятностен компютър - класически симулатор на квантова логика
pub struct ProbabilisticComputer {
    /// Текущо квантово състояние
    state: QuantumState,
    /// Генератор на случайни числа
    rng: StdRng,
    /// История на измерванията
    measurement_history: Vec<usize>,
}

impl ProbabilisticComputer {
    pub fn new(num_qubits: usize, seed: Option<u64>) -> Self {
        let actual_seed = seed.unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos() as u64)
                .unwrap_or(42)
        });

        Self {
            state: QuantumState::zero_state(num_qubits),
            rng: StdRng::seed_from_u64(actual_seed),
            measurement_history: Vec::new(),
        }
    }

    /// Инициализира в равномерна суперпозиция
    pub fn initialize_superposition(&mut self) {
        self.state = QuantumState::uniform_superposition(self.state.num_qubits);
        println!("🌌 [QUANTUM] Initialized {} qubits in superposition", self.state.num_qubits);
    }

    /// Прилага квантов алгоритъм (поредица от gates)
    pub fn apply_circuit(&mut self, gates: Vec<QuantumGate>) {
        for gate in gates {
            match gate {
                QuantumGate::Hadamard(qubit) => {
                    self.state.hadamard(qubit);
                    println!("🔀 [QUANTUM] Applied Hadamard on qubit {}", qubit);
                }
                QuantumGate::CNOT(control, target) => {
                    self.state.cnot(control, target);
                    println!("🔗 [QUANTUM] Applied CNOT({} -> {})", control, target);
                }
                QuantumGate::Phase(qubit, angle) => {
                    self.state.phase_shift(qubit, angle);
                    println!("🔄 [QUANTUM] Applied Phase({:.2}°) on qubit {}", angle.to_degrees(), qubit);
                }
                QuantumGate::Measure(qubit) => {
                    let result = self.state.measure(&mut self.rng);
                    self.measurement_history.push(result);
                    println!("📏 [QUANTUM] Measured qubit {}: collapsed to {}", qubit, result);
                }
            }
        }
    }

    /// Изпълнява измерване и връща резултата
    pub fn measure(&mut self) -> usize {
        let result = self.state.measure(&mut self.rng);
        self.measurement_history.push(result);
        println!("📊 [QUANTUM] Measurement result: {} (binary: {:0width$b})", 
                 result, result, width = self.state.num_qubits);
        result
    }

    /// Изпълнява множество измервания и връща разпределението
    pub fn sample(&mut self, shots: usize) -> std::collections::HashMap<usize, usize> {
        let mut results = std::collections::HashMap::new();
        
        for _ in 0..shots {
            // Ресетваме до суперпозиция преди всяко измерване
            self.state = QuantumState::uniform_superposition(self.state.num_qubits);
            let result = self.state.measure(&mut self.rng);
            *results.entry(result).or_insert(0) += 1;
        }

        println!("📈 [QUANTUM] Sampling complete ({} shots)", shots);
        for (state, count) in &results {
            let probability = *count as f64 / shots as f64;
            println!("   |{}⟩: {:.2}% ({} times)", state, probability * 100.0, count);
        }

        results
    }

    /// Връща вероятностите за всички състояния
    pub fn get_probabilities(&self) -> Vec<f64> {
        self.state.amplitudes.iter()
            .map(|a| a.probability())
            .collect()
    }
}

/// Типове квантови gates
#[derive(Debug, Clone)]
pub enum QuantumGate {
    /// Hadamard gate - създава суперпозиция
    Hadamard(usize),
    /// Controlled-NOT gate
    CNOT(usize, usize),
    /// Phase shift gate
    Phase(usize, f64),
    /// Measurement
    Measure(usize),
}

/// Хипердименсионален вектор за толерантно към шум кодиране
#[derive(Debug, Clone)]
pub struct HypervectorBrain {
    /// Размерност на хипервекторите
    dimension: usize,
    /// Памет от асоциации (символ -> хипервектор)
    memory: DashMap<String, Vec<i8>>,
    /// Генератор на случайни числа
    rng: StdRng,
}

impl HypervectorBrain {
    pub fn new(dimension: usize, seed: Option<u64>) -> Self {
        let actual_seed = seed.unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos() as u64)
                .unwrap_or(42)
        });

        Self {
            dimension,
            memory: DashMap::new(),
            rng: StdRng::seed_from_u64(actual_seed),
        }
    }

    /// Генерира случаен хипервектор
    pub fn random_vector(&mut self) -> Vec<i8> {
        (0..self.dimension)
            .map(|_| if self.rng.gen::<bool>() { 1 } else { -1 })
            .collect()
    }

    /// Кодира символ като хипервектор
    pub fn encode(&mut self, symbol: &str) -> Vec<i8> {
        if let Some(existing) = self.memory.get(symbol) {
            return existing.clone();
        }

        let vector = self.random_vector();
        self.memory.insert(symbol.to_string(), vector.clone());
        println!("🧠 [HDC] Encoded '{}' as {}-dimensional hypervector", symbol, self.dimension);
        vector
    }

    /// Свързва два хипервектора (XOR операция)
    pub fn bind(a: &[i8], b: &[i8]) -> Vec<i8> {
        a.iter().zip(b.iter())
            .map(|(x, y)| x * y)
            .collect()
    }

    /// Пакетира множество хипервектора (мажоритарно гласуване)
    pub fn bundle(vectors: &[Vec<i8>]) -> Vec<i8> {
        if vectors.is_empty() {
            return Vec::new();
        }

        let dim = vectors[0].len();
        let mut result = vec![0i32; dim];

        for vec in vectors {
            for (i, &val) in vec.iter().enumerate() {
                result[i] += val as i32;
            }
        }

        // Мажоритарно гласуване
        result.iter()
            .map(|&sum| if sum >= 0 { 1 } else { -1 })
            .collect()
    }

    /// Измерва сходство (косинус) между два хипервектора
    pub fn similarity(a: &[i8], b: &[i8]) -> f64 {
        let dot: i64 = a.iter().zip(b.iter())
            .map(|(x, y)| (*x as i64) * (*y as i64))
            .sum();
        
        let norm_a: f64 = (a.iter().map(|x| (*x as i64).pow(2)).sum::<i64>() as f64).sqrt();
        let norm_b: f64 = (b.iter().map(|x| (*x as i64).pow(2)).sum::<i64>() as f64).sqrt();

        if norm_a > 0.0 && norm_b > 0.0 {
            dot as f64 / (norm_a * norm_b)
        } else {
            0.0
        }
    }

    /// Търси най-близкия символ в паметта
    pub fn query(&self, vector: &[i8]) -> Option<(String, f64)> {
        let mut best_match = None;
        let mut best_similarity = -1.0;

        for entry in self.memory.iter() {
            let sim = Self::similarity(vector, entry.value());
            if sim > best_similarity {
                best_similarity = sim;
                best_match = Some(entry.key().clone());
            }
        }

        best_match.map(|symbol| (symbol, best_similarity))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quantum_superposition() {
        let state = QuantumState::uniform_superposition(2);
        
        // Всички 4 състояния трябва да имат равна вероятност
        for i in 0..4 {
            let prob = state.probability_of(i);
            assert!((prob - 0.25).abs() < 0.0001);
        }
    }

    #[test]
    fn test_quantum_measurement() {
        let mut state = QuantumState::zero_state(1);
        let mut rng = StdRng::seed_from_u64(42);
        
        // |0⟩ състояние винаги колапсира до 0
        let result = state.measure(&mut rng);
        assert_eq!(result, 0);
        assert!(state.collapsed);
    }

    #[test]
    fn test_hypervector_similarity() {
        let mut brain = HypervectorBrain::new(1000, Some(42));
        
        let cat = brain.encode("cat");
        let cat2 = brain.encode("cat"); // Същият символ
        let dog = brain.encode("dog");

        // Идентични вектори = 1.0 сходство
        let sim_same = HypervectorBrain::similarity(&cat, &cat2);
        assert!((sim_same - 1.0).abs() < 0.0001);

        // Различни вектори = ниско сходство (около 0)
        let sim_diff = HypervectorBrain::similarity(&cat, &dog);
        assert!(sim_diff.abs() < 0.2);
    }

    #[test]
    fn test_hypervector_bundle() {
        let mut brain = HypervectorBrain::new(100, Some(42));
        
        let v1 = brain.random_vector();
        let v2 = brain.random_vector();
        let v3 = brain.random_vector();

        let bundled = HypervectorBrain::bundle(&[v1.clone(), v2.clone(), v3.clone()]);
        
        // Bundled вектор трябва да е по-сходен на компонентите си
        let sim1 = HypervectorBrain::similarity(&bundled, &v1);
        assert!(sim1 > 0.0);
    }
}
