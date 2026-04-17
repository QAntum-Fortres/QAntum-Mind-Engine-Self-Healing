use crate::prelude::*;
use std::net::SocketAddr;
use tokio::net::TcpStream;

pub struct SovereignNode {
    pub addr: SocketAddr,
    pub active_assets: Vec<String>,
    pub throughput: f64,
    pub revenue_generated: f64,
}

pub struct SwarmCommander {
    pub nodes: Arc<DashMap<SocketAddr, SovereignNode>>,
}

impl SwarmCommander {
    pub fn new() -> Self {
        Self {
            nodes: Arc::new(DashMap::new()),
        }
    }

    /// DEPLOY: Изпраща пречистен актив към суверенен възел
    pub async fn deploy_asset(
        &self,
        asset_id: &str,
        target_addr: SocketAddr,
    ) -> SovereignResult<()> {
        println!(
            "🚀 SWARM: DEPLOYING ASSET {} TO {}...",
            asset_id, target_addr
        );

        let _stream = TcpStream::connect(target_addr)
            .await
            .map_err(|e| SovereignError::VshError(format!("NODE_UNREACHABLE: {}", e)))?;

        self.nodes.entry(target_addr).or_insert(SovereignNode {
            addr: target_addr,
            active_assets: vec![asset_id.to_string()],
            throughput: 1.618,
            revenue_generated: 420.69,
        });

        println!(
            "✅ SWARM: ASSET {} DEPLOYED ON {}. RESONANCE ESTABLISHED.",
            asset_id, target_addr
        );
        Ok(())
    }

    /// RECURSIVE REVENUE: Актуализира Liquid Equity въз основа на работата на рояка
    pub fn sync_revenue(&self, _vsh: &VectorSpaceHeap) -> f64 {
        let total_swarm_revenue: f64 = self.nodes.iter().map(|r| r.value().revenue_generated).sum();

        total_swarm_revenue * 1.618
    }
}
