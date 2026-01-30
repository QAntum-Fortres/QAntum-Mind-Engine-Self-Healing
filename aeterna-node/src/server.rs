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
use crate::network::reality::RealityAnchor;
use crate::network::patcher::RealityPatcher;

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

#[derive(Serialize)]
struct ManifestoSummary {
    title: String,
    classification: String,
    pillars: Vec<String>,
}

#[derive(Serialize)]
struct RealityStatus {
    timeline_hash: String,
    entropy_threshold: f64,
    integrity: String,
}

#[derive(Deserialize)]
struct TuneParams {
    constant_id: String,
    value: f64,
}

#[derive(Deserialize)]
struct PatchParams {
    bug_id: String,
}

pub async fn run_server(settings: Settings) {
    let app = Router::new()
        .route("/telemetry", get(get_telemetry))
        .route("/nervous-system", get(get_modules))
        .route("/command", post(handle_command))
        .route("/healthz", get(health_check)) // Liveness
        .route("/readyz", get(readiness_check)) // Readiness
        .route("/manifesto", get(get_manifesto)) // New Physics
        .route("/reality-integrity", get(get_reality_integrity)) // QA
        .route("/ontology/tune", post(tune_constant))
        .route("/ontology/patch", post(apply_patch))
        .route("/entropy/invert", post(invert_entropy))
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

async fn get_manifesto() -> Json<ManifestoSummary> {
    Json(ManifestoSummary {
        title: "AETERNA 2200: ARCHITECTURE OF THE POST-MATTER ERA".into(),
        classification: "OMEGA-RESTRICTED".into(),
        pillars: vec![
            "TRANSPORT: Ontological Shift (Holographic Lattice Re-Phasing)".into(),
            "BIOLOGY: Noetic Membrane (Bio-Linguistic Osmosis)".into(),
            "ENERGY: Zero-Point Entropy Inversion".into(),
            "QA: Architecture of Truth (Immutable Reality Consensus)".into(),
            "SOCIOLOGY: Anticipatory Empathy Grid".into(),
        ],
    })
}

async fn get_reality_integrity() -> Json<RealityStatus> {
    let anchor = RealityAnchor::new();
    Json(RealityStatus {
        timeline_hash: anchor.timeline_hash,
        entropy_threshold: anchor.entropy_threshold,
        integrity: "STABLE".into(),
    })
}

async fn tune_constant(Json(payload): Json<TuneParams>) -> Json<CommandResponse> {
    // Mock tuning logic
    let msg = format!("ADJUSTING CONSTANT [{}] TO {:.4e}. LOCAL PHYSICS UPDATED.", payload.constant_id, payload.value);
    Json(CommandResponse { response: msg })
}

async fn apply_patch(Json(payload): Json<PatchParams>) -> Json<CommandResponse> {
    let patcher = RealityPatcher::new();
    match payload.bug_id.as_str() {
        "c_limit" => patcher.apply_non_local_presence(),
        "aging" => patcher.apply_recursive_renewal("HUMANITY"),
        _ => warn!("UNKNOWN BUG ID"),
    }
    let msg = format!("PATCH APPLIED TO BUG ID [{}]", payload.bug_id);
    Json(CommandResponse { response: msg })
}

async fn invert_entropy() -> Json<CommandResponse> {
    Json(CommandResponse { response: "ENTROPY INVERTED. WASTE HEAT RECYCLED INTO PRIMORDIAL SOUP.".into() })
}
