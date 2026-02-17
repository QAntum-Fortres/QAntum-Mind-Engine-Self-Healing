use deno_core::error::AnyError;
use deno_core::JsRuntime;
use deno_core::RuntimeOptions;
use serde::Deserialize;
use std::path::Path;

#[derive(Debug, Deserialize)]
struct Manifest {
    name: String,
    version: String,
    entry: String,
}

#[tokio::main]
async fn main() -> Result<(), AnyError> {
    println!("Initializing Cognitive Exoskeleton Host...");

    // 1. Load Module Manifest
    let module_path = Path::new("modules/sample");
    let manifest_path = module_path.join("manifest.json");

    let manifest_content = std::fs::read_to_string(&manifest_path)
        .expect("Failed to read manifest");
    let manifest: Manifest = serde_json::from_str(&manifest_content)?;

    println!("Loading Singular Module: {} v{}", manifest.name, manifest.version);

    // 2. Initialize V8 Runtime (Deno Core)
    let mut js_runtime = JsRuntime::new(RuntimeOptions::default());

    // 3. Load Logic Script
    let entry_path = module_path.join(&manifest.entry);
    let code = std::fs::read_to_string(&entry_path)
        .expect("Failed to read entry script");

    // 4. Execute Script
    println!("Executing logic from: {}", manifest.entry);
    let mod_id = js_runtime.execute_script(manifest.name.clone(), code)?;

    // 5. Resolve Result
    let _result = js_runtime.resolve(mod_id).await?;

    println!("Module executed and resolved successfully.");

    Ok(())
}
