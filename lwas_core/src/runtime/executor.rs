use crate::prelude::*;

#[repr(u8)]
pub enum OpCode {
    Genesis = 0x01,
    Entrench = 0x02,
    Resonate = 0x03,
    Collapse = 0x04,
    Transcend = 0x05,
    Bend = 0x06,
    Fuse = 0x07,
    Observe = 0x08,
}

pub struct VshExecutor {
    pub instruction_pointer: usize,
    pub memory_field: Vec<u8>, 
}

impl VshExecutor {
    pub fn new(bytecode: Vec<u8>) -> Self {
        Self {
            instruction_pointer: 0,
            memory_field: bytecode,
        }
    }

    pub async fn step(&mut self, kernel: &crate::kernel::engine::VshKernel) -> SovereignResult<()> {
        if self.instruction_pointer >= self.memory_field.len() {
            return Ok(());
        }

        let opcode = self.memory_field[self.instruction_pointer];

        match opcode {
            0x01 => { // GENESIS
                kernel.register("NEW_MANIFOLD", 0.0);
            },
            0x05 => { // TRANSCEND
                self.handle_transcendence();
            },
            _ => { /* LOG OPS */ }
        }

        self.instruction_pointer += 1;
        Ok(())
    }

    fn handle_transcendence(&mut self) {
        println!("[VSH] Transcendence: Mutating bytecode...");
    }
}
