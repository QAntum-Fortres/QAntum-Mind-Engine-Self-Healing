mod vm;
mod network;

use vm::bytecode::AeternaOpcode;
use vm::interpreter::VirtualMachine;

fn main() {
    println!("AETERNA NODE: Initializing World-Soul Interface...");

    // Example program:
    // 1. Calculate 10 + 20
    // 2. Print result
    // 3. Store a value in memory
    // 4. Initiate Teleportation
    let program = vec![
        AeternaOpcode::LOAD(10),
        AeternaOpcode::LOAD(20),
        AeternaOpcode::ADD,
        AeternaOpcode::PRINT,
        AeternaOpcode::LOAD(42),
        AeternaOpcode::STORE(0),
        AeternaOpcode::REQUEST_HOST,
        AeternaOpcode::HALT,
    ];

    let mut vm = VirtualMachine::new(program);
    vm.run();
}
