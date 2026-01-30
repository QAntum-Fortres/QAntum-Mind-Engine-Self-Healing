use crate::prelude::*;
use std::fs;
use walkdir::WalkDir;

pub struct MagnetScavenger;

impl MagnetScavenger {
    pub fn new() -> Self {
        Self
    }

    /// Attracts and digitizes modules from a specific directory.
    pub fn attract(&self, root_path: &str) -> Vec<Manifold> {
        println!("🧲 [MAGNET] Activating attraction field in: {}", root_path);

        let entries: Vec<_> = WalkDir::new(root_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .filter(|e| {
                let name = e.file_name().to_string_lossy();
                name.ends_with(".soul") || name.ends_with(".js") || name.ends_with(".ts")
            })
            .collect();

        println!("   🧲 Detected {} potential modules.", entries.len());

        entries
            .into_par_iter()
            .map(|entry| {
                let path = entry.path();
                let _name = path.file_name().unwrap_or_default().to_string_lossy();
                let _content = fs::read_to_string(path).unwrap_or_default();

                println!("   🧲 Magnetizing: {}", _name);

                Manifold::new(&_name, 1.0)
            })
            .collect()
    }
}
