use crate::prelude::*;
use crossbeam_queue::ArrayQueue;
use std::sync::Arc;
use std::time::{Duration, Instant};

pub struct QuantumTelemetry {
    pub op_name: &'static str,
    pub duration: Duration,
    pub entropy_delta: f64,
    pub equity_gain: f64,
}

pub struct QuantumObserver {
    // Lock-free опашка за 1 милион записа
    queue: Arc<ArrayQueue<QuantumTelemetry>>,
}

impl QuantumObserver {
    pub fn new() -> Self {
        Self {
            queue: Arc::new(ArrayQueue::new(1_000_000)),
        }
    }

    pub fn record(&self, op: &'static str, start: Instant, e_start: f64, vsh: &VectorSpaceHeap) {
        let duration = start.elapsed();
        let e_end = vsh.get_global_entropy();

        let entry = QuantumTelemetry {
            op_name: op,
            duration,
            entropy_delta: e_start - e_end,
            equity_gain: (e_start - e_end) * 1250.0,
        };

        let _ = self.queue.push(entry); // Non-blocking push
    }
}
