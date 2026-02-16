mod vm;
mod network;
mod server;
mod settings;

use vm::bytecode::AeternaOpcode;
use vm::interpreter::VirtualMachine;
use settings::Settings;
use tracing::{info, error};

#[tokio::main]
async fn main() {
    // Load .env
    dotenvy::dotenv().ok();

    // Load Settings
    let settings = match Settings::new() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            return;
        }
    };

    // Initialize Tracing (Logging)
    tracing_subscriber::fmt()
        .with_env_filter(&settings.log.level)
        .json() // Enterprise JSON logging
        .init();

    info!("AETERNA NODE: Initializing World-Soul Interface...");
    info!("Configuration loaded. Host: {}, Port: {}", settings.server.host, settings.server.port);

    // Launch the Noetic Server in the background
    // Cloning settings for the server
    let server_settings = settings.clone();
    tokio::spawn(async move {
        server::run_server(server_settings).await;
    });

    info!("CORE: Executing Initial Bytecode Sequence...");
    // Example program
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
    info!("CORE: VM Halted. Server Active. Press Ctrl+C to terminate.");

    // We wait for the signal here too, or just sleep forever since server handles its own shutdown signal?
    // Actually, if we sleep here, the server's graceful shutdown might not propagate to the main thread exit cleanly if we don't coordinate.
    // However, axum's graceful shutdown waits for the server to finish.
    // But since `main` launched `server` in a `spawn`, if `main` exits, `server` dies.
    // We should probably wait for a signal in main as well.

    match tokio::signal::ctrl_c().await {
        Ok(()) => info!("CORE: Shutdown signal received."),
        Err(err) => error!("CORE: Unable to listen for shutdown signal: {}", err),
    }

    // Allow a moment for server to shut down (though ideally we'd use a channel to coordinate)
    info!("CORE: Exiting.");
}
