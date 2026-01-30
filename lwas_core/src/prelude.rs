// lwas_core/src/prelude.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA
// STATUS: CONSTITUTION_FINALIZED

pub use dashmap::DashMap;
pub use rayon::prelude::*;
pub use serde::{Deserialize, Serialize};
pub use std::result::Result as StdResult;
pub use std::sync::Arc;
pub use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, thiserror::Error)]
pub enum SovereignError {
    #[error("Entropy Detected: {0}")]
    EntropyDetected(String),
    #[error("Logic Collapse: {0}")]
    LogicCollapse(String),
    #[error("Identity Mismatch")]
    IdentityMismatch,
    #[error("I/O Error: {0}")]
    IoError(String), // The missing link for 0x50 stability
    #[error("Apotheosis Interrupted")]
    ApotheosisInterrupted,
    #[error("Security Violation")]
    SecurityViolation,
    #[error("VSH Error: {0}")]
    VshError(String),
}

pub type SovereignResult<T> = StdResult<T, SovereignError>;

pub trait SovereignEntity {
    fn verify_integrity(&self) -> bool;
}

// Re-exports for convenience in internal modules
pub use crate::memory::vsh::{Manifold, QuantumPoint, VectorSpaceHeap, VshState};
pub use crate::omega::audit::{AuditFinding, FindingType, SovereignAudit};
