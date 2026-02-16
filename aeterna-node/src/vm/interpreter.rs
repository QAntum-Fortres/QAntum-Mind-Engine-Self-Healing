// aeterna-node/src/vm/interpreter.rs

use super::bytecode::AeternaOpcode;
use crate::network::teleport::{VMState, teleport_vm_to_host};

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
        println!("Starting Aeterna VM...");
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
                            println!("Error: Memory access violation at {}", addr);
                        }
                    } else {
                        println!("Error: Stack underflow on STORE");
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
                        println!("Error: Division by zero");
                        self.stack.push(0); // or handle error differently
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
                    println!("VM: Saving state...");
                    let state = self.capture_state();
                    // In a real scenario, we might return this or send it somewhere.
                    // For now, we just print a confirmation.
                    println!("State saved. Checksum: {:?}", state.checksum);
                }
                AeternaOpcode::LOAD_STATE => {
                    println!("VM: Load state not implemented yet.");
                }
                AeternaOpcode::REQUEST_HOST => {
                    println!("VM: Requesting new host...");
                    let state = self.capture_state();
                    // Arbitrary target host for demo
                    let _ = teleport_vm_to_host(state, "node-Alpha-Centauri-7");
                    // In a real migration, we might halt here.
                    // self.pc = self.program.len();
                }
                AeternaOpcode::PRINT => {
                    if let Some(val) = self.stack.last() {
                        println!("VM Output: {}", val);
                    } else {
                        println!("VM Output: [Empty Stack]");
                    }
                }
                AeternaOpcode::HALT => {
                    println!("VM: Halted.");
                    break;
                }

                // --- AETERNA 2200 HANDLERS ---
                AeternaOpcode::ONTOLOGICAL_SHIFT(coords) => {
                     println!("VM: Initiating HLR Transport to coords: {}", coords);
                }
                AeternaOpcode::RESONATE_MEMBRANE(freq) => {
                     println!("VM: Resonating Noetic Membrane at {} Hz", freq);
                }
                AeternaOpcode::INVERT_ENTROPY(joules) => {
                     println!("VM: Harvesting {} J from Quantum Vacuum...", joules);
                }
                AeternaOpcode::VERIFY_TIMELINE(hash) => {
                     println!("VM: Verifying causal consistency of event 0x{:X}...", hash);
                }
                AeternaOpcode::PREDICT_NEED(user) => {
                     println!("VM: Calculating future needs for Entity #{}", user);
                }

                // --- ONTOLOGICAL HANDLERS ---
                AeternaOpcode::TUNE_CONSTANT(id, val) => {
                    println!("VM: Tuning Constant #{} to value {:.4e}", id, val);
                }
                AeternaOpcode::INVERT_LOGIC(id) => {
                    println!("VM: Switching Logic Gate #{} to QUANTUM MAYBE", id);
                }
                AeternaOpcode::DEFINE_MATTER(syntax) => {
                    println!("VM: Compiling Syntax to Matter: '{}'", syntax);
                }
                AeternaOpcode::RECYCLE_CHRONO(delta) => {
                    println!("VM: Sending entropy back {:.2} years.", delta);
                }
                AeternaOpcode::FORK_INSTANCE(id) => {
                    println!("VM: Forking Consciousness #{} into parallel thread.", id);
                }
                AeternaOpcode::PATCH_REALITY(bug_id, fix) => {
                    println!("VM: [QA] Applying Hotfix '{}' to Bug #{}", fix, bug_id);
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
