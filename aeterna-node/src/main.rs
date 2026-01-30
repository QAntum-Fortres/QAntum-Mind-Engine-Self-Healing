pub mod compiler;
pub mod vm;
pub mod network;

use vm::interpreter::VirtualMachine;
use compiler::SoulCompiler;
use tracing::info;
use tracing_subscriber;

fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    info!("AETERNA NODE: Initializing World-Soul Interface...");

    // Soul Language Program:
    // 1. MANIFEST 108 (Sacred number)
    // 2. ANCHOR 0 (Store in memory)
    // 3. MANIFEST 42
    // 4. ANCHOR 1 (Store in memory) - Creating variance/entropy
    // 5. BECOME VOID (Neutralize entropy)
    // 6. ECHO (Print result, likely 0 or unity)

    let soul_source = "MANIFEST 108 ANCHOR 0 MANIFEST 42 ANCHOR 1 BECOME VOID ECHO";

    let program = SoulCompiler::compile(soul_source);

    let mut vm = VirtualMachine::new(program);
    vm.run();
}
