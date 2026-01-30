use crate::prelude::*;
use crate::omega::scribe::SovereignScribe;
use crate::omega::oracle::AeternaOracle;
use axum::{
    routing::{get, post},
    Router, Json, extract::State, response::IntoResponse,
};
use serde_json::{json, Value};
use tokio::sync::RwLock;

pub struct ServerState {
    pub vsh: Arc<VectorSpaceHeap>,
    pub audit: Arc<RwLock<SovereignAudit>>,
    pub enforcer: Arc<SovereignScribe>,
}

pub async fn start_singularity_server(state: Arc<ServerState>) {
    use tower_http::cors::CorsLayer;

    let app = Router::new()
        .route("/api/status", get(get_status))
        .route("/api/scribe/refactor", post(run_auto_refactor))
        .route("/api/ask", post(ask_sovereign_brain))
        .route("/api/scribe/generate", post(run_asset_generation))
        .with_state(state)
        .layer(CorsLayer::permissive());

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 8890));
    println!("🌌 SINGULARITY SERVER ONLINE AT http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_status(State(state): State<Arc<ServerState>>) -> impl IntoResponse {
    Json(state.vsh.get_state())
}

async fn run_auto_refactor(State(state): State<Arc<ServerState>>) -> impl IntoResponse {
    println!("📜 THE SCRIBE: INITIATING AUTO-REFACTORING CYCLE...");
    
    let mut audit = state.audit.write().await;
    let _ = audit.run_full_audit(vec!["./src".into()]).await;
    drop(audit);

    match state.enforcer.perform_surgery().await {
        Ok(report) => Json(json!({ "status": "SUCCESS", "report": report })),
        Err(e) => Json(json!({ "status": "ERROR", "message": e })),
    }
}

async fn ask_sovereign_brain(
    State(state): State<Arc<ServerState>>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    let prompt = payload.get("prompt")
        .and_then(|v: &Value| v.as_str())
        .unwrap_or("");
    
    let response = AeternaOracle::execute_sovereign_command(&state.vsh, prompt).await;
    Json(json!({ "response": response }))
}

async fn run_asset_generation(State(state): State<Arc<ServerState>>) -> impl IntoResponse {
    println!("🏭 THE SCRIBE: INITIATING ASSET TRANSMUTATION...");
    
    match state.enforcer.package_saas("Omni-v1").await {
        Ok(asset) => Json(json!({ "status": "SUCCESS", "asset": asset })),
        Err(e) => Json(json!({ "status": "ERROR", "message": format!("{}", e) })),
    }
}
