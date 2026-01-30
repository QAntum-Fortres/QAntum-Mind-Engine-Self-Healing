use crate::prelude::*;
use axum::{
    routing::{get},
    Router, Json,
};
use tower_http::cors::CorsLayer;

pub struct NeuralHUD {
    pub vsh: Arc<VectorSpaceHeap>,
}

impl NeuralHUD {
    pub fn new(vsh: Arc<VectorSpaceHeap>) -> Self {
        Self { vsh }
    }

    pub async fn emit_wave(&self, event: &str, data: &str, source: &str) {
        println!("🌊 [HUD_WAVE]: {} from {} | Data: {}", event, source, data);
    }

    pub async fn start_telemetry_server(&self) {
        let app = Router::new()
            .route("/telemetry", get(move |st: axum::extract::State<Arc<VectorSpaceHeap>>| async move {
                Json(st.get_state())
            }))
            .with_state(self.vsh.clone())
            .layer(CorsLayer::permissive());

        let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 8888));
        println!("🧠 NEURAL HUD: TELEMETRY SERVER ONLINE AT http://{}", addr);

        let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    }
}
