mod vm;
mod network;
mod server;

use vm::bytecode::AeternaOpcode;
use vm::interpreter::VirtualMachine;

#[tokio::main]
async fn main() {
    println!("AETERNA NODE: Initializing World-Soul Interface...");

    // Launch the Noetic Server in the background
    tokio::spawn(async {
        server::run_server().await;
    });

    println!("CORE: Executing Initial Bytecode Sequence...");
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
        // VM will halt here, but main process keeps running for server
        AeternaOpcode::HALT,
    ];

    let mut vm = VirtualMachine::new(program);
    vm.run();

    // Keep the main thread alive for the server
    println!("CORE: VM Halted. Server Active. Press Ctrl+C to terminate.");
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
    }
}
