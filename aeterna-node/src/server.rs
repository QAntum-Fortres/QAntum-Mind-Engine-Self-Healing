use axum::{
    routing::{get, post},
    Router,
    Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing::{info, warn};
use crate::settings::Settings;

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

#[derive(Serialize)]
struct HealthCheck {
    status: String,
    version: String,
    uptime_seconds: u64,
}

pub async fn run_server(settings: Settings) {
    let app = Router::new()
        .route("/telemetry", get(get_telemetry))
        .route("/nervous-system", get(get_modules))
        .route("/command", post(handle_command))
        .route("/healthz", get(health_check)) // Liveness
        .route("/readyz", get(readiness_check)) // Readiness
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    let addr: SocketAddr = format!("{}:{}", settings.server.host, settings.server.port)
        .parse()
        .expect("Invalid address format");

    info!("AETERNA SERVER: Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    // Graceful shutdown handling integrated into serve
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    warn!("Signal received, starting graceful shutdown...");
}

async fn health_check() -> Json<HealthCheck> {
    Json(HealthCheck {
        status: "UP".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: 0, // In real app, calculate since start time
    })
}

async fn readiness_check() -> Json<HealthCheck> {
    // Check DB connections, etc. here
    Json(HealthCheck {
        status: "READY".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: 0,
    })
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
