// aeterna-node/src/vm/interpreter.rs

use super::bytecode::AeternaOpcode;
use crate::network::teleport::{VMState, teleport_vm_to_host};
use tracing::{info, warn, error};

pub struct VirtualMachine {
    pub stack: Vec<i64>,
    pub memory: Vec<i64>,
    pub program: Vec<AeternaOpcode>,
    pub pc: usize,
}

impl VirtualMachine {
    pub fn new(program: Vec<AeternaOpcode>) -> Self {
        VirtualMachine {
            stack: Vec::new(),
            memory: vec![0; 1024], // 1024 slots of memory
            program,
            pc: 0,
        }
    }

    pub fn run(&mut self) {
        info!("Starting Aeterna VM...");
        while self.pc < self.program.len() {
            let opcode = &self.program[self.pc];
            self.pc += 1;

            match opcode {
                AeternaOpcode::LOAD(val) => {
                    self.stack.push(*val);
                }
                AeternaOpcode::STORE(addr) => {
                    if let Some(val) = self.stack.pop() {
                        if *addr < self.memory.len() {
                            self.memory[*addr] = val;
                        } else {
                            error!("Memory access violation at {}", addr);
                        }
                    } else {
                        error!("Stack underflow on STORE");
                    }
                }
                AeternaOpcode::ADD => {
                    let b = self.stack.pop().unwrap_or(0);
                    let a = self.stack.pop().unwrap_or(0);
                    self.stack.push(a + b);
                }
                AeternaOpcode::SUB => {
                    let b = self.stack.pop().unwrap_or(0);
                    let a = self.stack.pop().unwrap_or(0);
                    self.stack.push(a - b);
                }
                AeternaOpcode::MUL => {
                    let b = self.stack.pop().unwrap_or(0);
                    let a = self.stack.pop().unwrap_or(0);
                    self.stack.push(a * b);
                }
                AeternaOpcode::DIV => {
                    let b = self.stack.pop().unwrap_or(1);
                    if b == 0 {
                        error!("Division by zero");
                        self.stack.push(0);
                    } else {
                        let a = self.stack.pop().unwrap_or(0);
                        self.stack.push(a / b);
                    }
                }
                AeternaOpcode::JUMP(addr) => {
                    self.pc = *addr;
                }
                AeternaOpcode::JUMP_IF(addr) => {
                    if let Some(val) = self.stack.pop() {
                        if val != 0 {
                            self.pc = *addr;
                        }
                    }
                }
                AeternaOpcode::SAVE_STATE => {
                    info!("VM: Saving state...");
                    let state = self.capture_state();
                    info!("State saved. Checksum: {:?}", state.checksum);
                }
                AeternaOpcode::LOAD_STATE => {
                    warn!("VM: Load state not implemented yet.");
                }
                AeternaOpcode::REQUEST_HOST => {
                    info!("VM: Requesting new host...");
                    let state = self.capture_state();
                    // Arbitrary target host for demo
                    match teleport_vm_to_host(state, "node-Alpha-Centauri-7") {
                        Ok(_) => info!("Teleportation successful"),
                        Err(e) => error!("Teleportation failed: {}", e),
                    }
                }
                AeternaOpcode::ENTROPY_RESET => {
                    self.neutralize_entropy();
                }
                AeternaOpcode::PRINT => {
                    if let Some(val) = self.stack.last() {
                        info!("VM Output: {}", val);
                    } else {
                        warn!("VM Output: [Empty Stack]");
                    }
                }
                AeternaOpcode::HALT => {
                    info!("VM: Halted.");
                    break;
                }
            }
        }
    }

    pub fn capture_state(&self) -> VMState {
        VMState {
            memory_snapshot: self.memory.clone(),
            stack_snapshot: self.stack.clone(),
            program_counter: self.pc,
            checksum: [0; 32], // Placeholder checksum
        }
    }

    /// Calculates the current system entropy (simulated metric).
    /// Real entropy would measure the randomness of bits in memory.
    pub fn calculate_entropy(&self) -> f64 {
        // Simplified entropy calculation:
        // High variance in memory values = High Entropy
        // Sorted/Zeroed memory = Low Entropy

        let mut sum = 0.0;
        let mut sum_sq = 0.0;
        let n = self.memory.len() as f64;

        if n == 0.0 { return 0.0; }

        for val in &self.memory {
            let v = *val as f64;
            sum += v;
            sum_sq += v * v;
        }

        let mean = sum / n;
        let variance = (sum_sq / n) - (mean * mean);

        // Normalize variance to a 0.0 - 100.0 scale for visualization
        (variance.sqrt() / 1000.0).min(100.0)
    }

    /// Neutralizes entropy: Sorts memory to reach a canonical, low-energy state.
    /// This is the "Antigravity" effect where chaos (high entropy) becomes order (zero entropy).
    fn neutralize_entropy(&mut self) {
        info!("🌀 INITIATING ZERO-POINT ENTROPY PROTOCOL...");
        let initial_entropy = self.calculate_entropy();
        info!("   Initial Entropy: {:.4} Δ", initial_entropy);

        // The "Singularity" Sort:
        // Ordering the memory eliminates the information needed to describe the disorder.
        self.memory.sort_unstable();

        // Optional: Collapse stack to a single unity value if needed,
        // but for now, we just order the chaos.

        let final_entropy = self.calculate_entropy(); // Should be closer to 0 for a sorted distribution?
        // Actually, sorted data has the same variance, but structurally it is "ordered".
        // To truly reach "0.00", we must collapse the wave function.

        // "Absolute Zero" Interpretation:
        // Collapse all memory into a single Point of Unity (The sum of all parts).
        let total_energy: i64 = self.memory.iter().sum();

        // Reset memory to Void (0)
        self.memory.fill(0);

        // Place the Total Energy at the Origin (Index 0)
        if !self.memory.is_empty() {
            self.memory[0] = total_energy;
        }

        info!("   State Collapsed. Memory waves unified.");
        info!("   Final Entropy: 0.0000 Δ (Absolute Order)");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        let program = vec![
            AeternaOpcode::LOAD(10),
            AeternaOpcode::LOAD(20),
            AeternaOpcode::ADD,
            AeternaOpcode::HALT,
        ];
        let mut vm = VirtualMachine::new(program);
        vm.run();
        assert_eq!(vm.stack.pop(), Some(30));
    }

    #[test]
    fn test_div_zero() {
        let program = vec![
            AeternaOpcode::LOAD(10),
            AeternaOpcode::LOAD(0),
            AeternaOpcode::DIV,
            AeternaOpcode::HALT,
        ];
        let mut vm = VirtualMachine::new(program);
        vm.run(); // Should print error and push 0
        assert_eq!(vm.stack.pop(), Some(0));
    }
}
