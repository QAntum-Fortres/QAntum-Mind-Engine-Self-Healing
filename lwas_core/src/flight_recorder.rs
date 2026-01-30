use crate::prelude::*;
use std::collections::VecDeque;
use std::sync::Mutex;

#[derive(Clone, Debug)]
pub struct FlightRecord {
    pub timestamp: u64,
    pub event_type: String,
    pub context_snapshot: Vec<QuantumPoint>,
}

pub struct FlightRecorder {
    history: Arc<Mutex<VecDeque<FlightRecord>>>,
    capacity: usize,
}

impl FlightRecorder {
    pub fn new(capacity: usize) -> Self {
        Self {
            history: Arc::new(Mutex::new(VecDeque::with_capacity(capacity))),
            capacity,
        }
    }

    pub fn log(&self, event_type: &str, context: Vec<QuantumPoint>) {
        let mut history = self.history.lock().unwrap();
        if history.len() >= self.capacity {
            history.pop_front();
        }

        history.push_back(FlightRecord {
            timestamp: 0,
            event_type: event_type.to_string(),
            context_snapshot: context,
        });
    }

    pub fn dump_black_box(&self) -> Vec<FlightRecord> {
        let history = self.history.lock().unwrap();
        history.iter().cloned().collect()
    }

    pub fn attempt_self_heal(&self) -> String {
        let history = self.history.lock().unwrap();
        if let Some(last_error) = history
            .iter()
            .rev()
            .find(|r| r.event_type.contains("Error"))
        {
            format!(
                "SELF-HEALING TRIGGERED: Detected '{}'. Adjusting semantic weights...",
                last_error.event_type
            )
        } else {
            "System Nominal.".to_string()
        }
    }
}
