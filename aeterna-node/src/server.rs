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
use crate::vm::soul_parser::{SoulParser, SoulToken};
use crate::vm::sovereign::SovereignRuntime;
use crate::vm::physics_override::UniversalConstantTuner;
use crate::vm::ouroboros::Ouroboros;
use crate::vm::compiler::Compiler;
use crate::vm::loader::SoulLoader;

#[derive(Serialize)]
struct Telemetry {
    cpu_usage: f64,
    gpu_usage: f64,
    entropy: f64,
    temperature: f64,
    bio_link: Option<BioData>,
}

#[derive(Serialize, Deserialize, Clone)]
struct BioData {
    heart_rate: u8,
    focus_level: f64, // 0.0 to 1.0
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

#[derive(Deserialize)]
struct SoulScript {
    code: String,
    signature: String,
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
        .route("/soul/execute", post(execute_soul_v2)) // SOUL V2 Interface
        .route("/physics/override", post(override_physics)) // UCT
        .route("/ouroboros/cycle", post(trigger_ouroboros)) // Loop
        .route("/soul/reload", post(reload_souls)) // Hot-reload
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

    // Simulate Bio-Link Data from S24
    let bio_link = Some(BioData {
        heart_rate: (60.0 + (t * 0.5).sin() * 10.0) as u8,
        focus_level: (t * 0.05).cos().abs(),
    });

    Json(Telemetry {
        cpu_usage: 45.0 + (t * 0.5).sin() * 10.0,
        gpu_usage: 80.0 + (t * 0.2).cos() * 15.0,
        entropy: (t * 0.1).sin().abs(), // 0 to 1
        temperature: 65.0,
        bio_link,
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

async fn execute_soul_v2(Json(payload): Json<SoulScript>) -> Json<CommandResponse> {
    info!("SERVER: Received SOUL V2 Script with Signature: [{}]", payload.signature);

    // 1. Compile SOUL Code using the new Compiler V2
    let opcodes = Compiler::compile(&payload.code);

    // 2. Initialize Sovereign Runtime
    let mut runtime = SovereignRuntime::new(payload.signature, opcodes);

    // 3. Execute with Authority Check
    match runtime.execute_with_authority() {
        Ok(_) => Json(CommandResponse { response: "SOUL V2 EXECUTION SUCCESSFUL. LOGIC IMMORTALIZED.".into() }),
        Err(e) => Json(CommandResponse { response: format!("SOUL V2 FAILURE: {}", e) }),
    }
}

async fn override_physics(Json(payload): Json<TuneParams>) -> Json<CommandResponse> {
    let mut uct = UniversalConstantTuner::new();
    // In a real system, we'd persist this change.
    uct.apply_patch(payload.value, 3.0e8); // Assuming payload.value targets G for now
    Json(CommandResponse { response: format!("PHYSICS OVERRIDE: {} set to {}", payload.constant_id, payload.value) })
}

async fn trigger_ouroboros() -> Json<CommandResponse> {
    let mut ouroboros = Ouroboros::new();
    ouroboros.activate();
    ouroboros.on_entropy_detected(5000.0); // Simulate waste heat
    Json(CommandResponse { response: "OUROBOROS CYCLE COMPLETE. ENERGY RECYCLED.".into() })
}

async fn reload_souls() -> Json<CommandResponse> {
    SoulLoader::load_and_execute_dir("./souls");
    Json(CommandResponse { response: "SOUL DIRECTORY RESCANNED. NEW DNA INTEGRATED.".into() })
}
