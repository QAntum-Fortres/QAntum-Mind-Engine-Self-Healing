// aeterna-node/src/vm/loader.rs

use std::fs;
use std::path::Path;
use tracing::{info, warn, error};
use crate::vm::compiler::Compiler;
use crate::vm::sovereign::SovereignRuntime;

pub struct SoulLoader;

impl SoulLoader {
    pub fn load_and_execute_dir(dir_path: &str) {
        info!("SOUL LOADER: Scanning directory [{}] for DNA...", dir_path);

        let path = Path::new(dir_path);
        if !path.exists() {
            warn!("SOUL LOADER: Directory not found. Creating...");
            let _ = fs::create_dir_all(path);
            return;
        }

        match fs::read_dir(path) {
            Ok(entries) => {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.is_file() {
                            if let Some(ext) = path.extension() {
                                if ext == "soul" {
                                    Self::execute_file(&path);
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => error!("SOUL LOADER: Failed to read directory: {}", e),
        }
    }

    fn execute_file(path: &Path) {
        info!("SOUL LOADER: Reading file [{:?}]...", path);
        match fs::read_to_string(path) {
            Ok(code) => {
                // Compile
                let opcodes = Compiler::compile(&code);

                // Execute
                // Assuming "ROOT" authority for local files
                let mut runtime = SovereignRuntime::new("ROOT_FILESYSTEM".to_string(), opcodes);

                // We bypass the strict check or pass a "SYSTEM" token
                match runtime.execute_with_authority_internal() {
                    Ok(_) => info!("SOUL LOADER: Execution Successful."),
                    Err(e) => error!("SOUL LOADER: Execution Failed: {}", e),
                }
            },
            Err(e) => error!("SOUL LOADER: Read Error: {}", e),
        }
    }
}
