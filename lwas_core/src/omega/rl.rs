use crate::memory::vsh::QuantumPoint;
use crate::prelude::*;

pub struct SovereignRL {
    pub alpha: f64, // Learning Rate
    pub gamma: f64, // Discount Factor
}

impl SovereignRL {
    pub fn new() -> Self {
        Self {
            alpha: 0.15,
            gamma: 0.99,
        }
    }

    /// BELLMAN UPDATE: Оптимизира възела въз основа на резултата
    pub fn update_node(&self, point: &mut QuantumPoint, reward: f64, max_future_q: f64) {
        let td_error = reward + (self.gamma * max_future_q) - point.q_value;

        point.q_value += self.alpha * td_error;
        point.visits += 1;

        if reward > 0.0 {
            point.success_count += 1;
            point.entropy *= 0.9;
        }

        if point.visits > 0 {
            point.success_rate = point.success_count as f64 / point.visits as f64;
        }
    }
}
