// lwas_core/src/omega/integrity.rs
use crate::prelude::*;
use std::fs;
use std::io;

pub struct VoidWatcher;

impl VoidWatcher {
    pub fn scan_for_entropy(root_path: &str) -> SovereignResult<()> {
        let forbidden = ["node_modules", "target/debug"];

        for entry in fs::read_dir(root_path)
            .map_err(|e: io::Error| SovereignError::IoError(e.to_string()))?
        {
            let entry = entry.map_err(|e: io::Error| SovereignError::IoError(e.to_string()))?;
            let path = entry.path();

            if path.is_dir() {
                if let Some(p) = path.to_str() {
                    for pattern in forbidden.iter() {
                        if p.contains(pattern) {
                            return Err(SovereignError::EntropyDetected(p.into()));
                        }
                    }
                }
            }
        }
        Ok(())
    }

    pub fn generate_logos_hash() -> String {
        "0xQANTUM_JULES_DIAMOND_STRICT_VAL".to_string()
    }
}
