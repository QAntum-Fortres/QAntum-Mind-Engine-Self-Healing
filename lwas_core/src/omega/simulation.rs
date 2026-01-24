use crate::prelude::*;

pub struct MarketSimulator {
    pub target_mrr: f64,
    pub market_volatility: f64,
}

impl MarketSimulator {
    pub fn new() -> Self {
        Self {
            target_mrr: 10000.0,
            market_volatility: 0.15,
        }
    }

    /// ПРОЕКЦИЯ: Симулира пазарното представяне на генерираните активи
    pub fn project_revenue(&self, vsh: &VectorSpaceHeap) -> f64 {
        let asset_count = vsh
            .points
            .iter()
            .filter(|r| r.value().metadata.contains("MM_SAAS"))
            .count();

        let base_revenue = asset_count as f64 * 125.50;
        let optimized_revenue = base_revenue * 1.618;

        println!(
            "📊 SIMULATION: Projected MRR for {} assets: €{:.2}",
            asset_count, optimized_revenue
        );
        optimized_revenue
    }
}
