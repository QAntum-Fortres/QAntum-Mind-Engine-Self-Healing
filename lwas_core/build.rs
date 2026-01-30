use std::fs;
use std::path::Path;
use walkdir::WalkDir;

fn main() {
    let src_dir = Path::new("src");

    // Scan all directories in src, but skip src itself
    for entry in WalkDir::new(src_dir)
        .min_depth(1) // SKIP ROOT SRC
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
    {
        generate_mod_rs(entry.path());
    }

    println!("cargo:rerun-if-changed=src");
    println!("cargo:rerun-if-changed=src/memory/vsh.rs");
}

fn generate_mod_rs(dir: &Path) {
    let mut modules = Vec::new();

    // Read directory entries
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let file_name = path.file_name().unwrap().to_str().unwrap();

            if path.is_file() {
                if file_name.ends_with(".rs") && file_name != "mod.rs" && file_name != "lib.rs" {
                    let mod_name = file_name.trim_end_matches(".rs");
                    modules.push(mod_name.to_string());
                }
            } else if path.is_dir() {
                // Check if directory has a mod.rs or at least one .rs file inside (simplified check)
                modules.push(file_name.to_string());
            }
        }
    }

    if modules.is_empty() {
        return;
    }

    modules.sort();
    modules.dedup();

    let mut content =
        String::from("// 🧬 AMNIOTIC SYNC - GENERATED MODULES\n// DO NOT EDIT MANUALLY\n\n");
    for module in modules {
        content.push_str(&format!("pub mod {};\n", module));
    }

    let mod_rs_path = dir.join("mod.rs");

    // Only write if content changed to avoid unnecessary rebuilds
    if let Ok(existing) = fs::read_to_string(&mod_rs_path) {
        if existing == content {
            return;
        }
    }

    fs::write(mod_rs_path, content).ok();
}
