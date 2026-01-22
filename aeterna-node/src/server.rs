use axum::{
    routing::{get, post},
    Router,
    Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Serialize)]
struct Telemetry {
    cpu_usage: f64,
    gpu_usage: f64,
    entropy: f64,
    temperature: f64,
}

#[derive(Serialize)]
struct ModuleState {
    id: String,
    name: String,
    status: String,
    pulse_rate: f64,
}

#[derive(Deserialize)]
struct CommandInput {
    command: String,
}

#[derive(Serialize)]
struct CommandResponse {
    response: String,
}

pub async fn run_server() {
    let app = Router::new()
        .route("/telemetry", get(get_telemetry))
        .route("/nervous-system", get(get_modules))
        .route("/command", post(handle_command))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8890));
    println!("AETERNA SERVER: Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_telemetry() -> Json<Telemetry> {
    // In a real scenario, use `sysinfo` or `nvml-wrapper`
    // Here we simulate "Quantum Entropy"
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs_f64();

    Json(Telemetry {
        cpu_usage: 45.0 + (t * 0.5).sin() * 10.0,
        gpu_usage: 80.0 + (t * 0.2).cos() * 15.0,
        entropy: (t * 0.1).sin().abs(), // 0 to 1
        temperature: 65.0,
    })
}

async fn get_modules() -> Json<Vec<ModuleState>> {
    Json(vec![
        ModuleState { id: "1".into(), name: "BIOLOGY".into(), status: "ACTIVE".into(), pulse_rate: 1.0 },
        ModuleState { id: "2".into(), name: "COGNITION".into(), status: "IDLE".into(), pulse_rate: 0.5 },
        ModuleState { id: "3".into(), name: "EVOLUTION".into(), status: "ACTIVE".into(), pulse_rate: 1.2 },
        ModuleState { id: "4".into(), name: "SECURITY".into(), status: "CRITICAL".into(), pulse_rate: 2.0 },
    ])
}

async fn handle_command(Json(payload): Json<CommandInput>) -> Json<CommandResponse> {
    let response = match payload.command.to_lowercase().as_str() {
        "help" => "AVAILABLE COMMANDS: PURGE, EVOLVE, STATUS, HALT",
        "status" => "SYSTEM NOMINAL. ENTROPY STABLE.",
        "purge" => "INITIATING MEMORY PURGE... [COMPLETE]",
        _ => "UNKNOWN COMMAND. MODAL LOGIC INVALID.",
    };

    Json(CommandResponse { response: response.to_string() })
}
