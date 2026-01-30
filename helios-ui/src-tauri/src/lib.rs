// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// use lwas_core::HyperTrinity; // Import core functionality if needed in future

use lwas_core::VectorSpaceHeap;
use std::sync::Arc;
use sysinfo::System;
use tauri::{Emitter, Manager, State};
use tokio::sync::RwLock;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_hardware_metrics() -> serde_json::Value {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_ram = sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
    let used_ram = sys.used_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
    let cpu_usage = sys.global_cpu_info().cpu_usage();

    serde_json::json!({
        "total_ram": format!("{:.1} GB", total_ram),
        "used_ram": format!("{:.1} GB", used_ram),
        "ram_percentage": (used_ram / total_ram) * 100.0,
        "cpu_usage": format!("{:.1}%", cpu_usage),
        "cpu_percentage": cpu_usage,
        "status": "SOVEREIGN_ACTIVE"
    })
}

#[tauri::command]
fn system_status() -> String {
    "HELIOS CORE: ONLINE. SIS: 57179. EQUITY: $2,104,500,000".to_string()
}

#[tauri::command]
async fn process_mind_command(
    input: String,
    _vsh: State<'_, Arc<VectorSpaceHeap>>,
    window: tauri::Window,
) -> Result<String, String> {
    if input.to_uppercase() == "FEEDBACK START" {
        window
            .emit("evolution-pulse", ())
            .map_err(|e| e.to_string())?;
        return Ok("🧬 EVOLUTION_PROTOCOL_ACTIVATED: Feedback loop is now in resonance.".into());
    }
    Ok(format!(
        "🤖 [MISTER MIND]: Received instruction '{}'. Executing on the VSH grid.",
        input
    ))
}

#[tauri::command]
async fn process_probe(
    input: String,
    vsh: State<'_, Arc<VectorSpaceHeap>>,
) -> Result<String, String> {
    let result =
        lwas_core::omega::oracle::AeternaOracle::execute_sovereign_command(&vsh, &input).await;
    Ok(result)
}

#[tauri::command]
async fn execute_sovereign_terminal(command: String, args: Vec<String>) -> Result<String, String> {
    use std::process::Command;

    let output = Command::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("CRITICAL_EXECUTION_FAILURE: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn jules_execute(action: String) -> Result<String, String> {
    if action == "--SELF-VERIFY" {
        return lwas_core::security::SovereignBridge::trigger_autonomous_check()
            .map_err(|e| format!("LOGIC_COLLAPSE: {}", e));
    }
    Err("UNKNOWN_ACTION".into())
}

#[tauri::command]
fn ontological_command(cmd: String) -> String {
    lwas_core::omega::ontological_bridge::OntologicalBridge::execute_direct_command(&cmd)
}

#[tauri::command]
fn execute_soul(path: String) -> String {
    lwas_core::omega::ontological_bridge::OntologicalBridge::execute_soul_blueprint(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let vsh =
                std::sync::Arc::new(lwas_core::VectorSpaceHeap::new().expect("VSH_INIT_FAIL"));
            app.manage(Arc::clone(&vsh));

            let vsh_for_agent = std::sync::Arc::clone(&vsh);
            let vsh_for_feedback = std::sync::Arc::clone(&vsh);
            let vsh_for_server = std::sync::Arc::clone(&vsh);

            let audit = Arc::new(RwLock::new(lwas_core::SovereignAudit::new()));
            let enforcer = Arc::new(lwas_core::SovereignScribe::new(
                Arc::clone(&audit),
                Arc::clone(&vsh),
            ));

            tokio::spawn(async move {
                lwas_core::omega::oracle::AeternaOracle::run_autonomous_loop(vsh_for_agent).await;
            });

            tokio::spawn(async move {
                lwas_core::FeedbackLoop::run_evolution_cycle(vsh_for_feedback).await;
            });

            let server_state = Arc::new(lwas_core::ServerState {
                vsh: vsh_for_server,
                audit: Arc::clone(&audit),
                enforcer: Arc::clone(&enforcer),
            });
            tokio::spawn(async move {
                lwas_core::start_singularity_server(server_state).await;
            });

            let vsh_for_sync = std::sync::Arc::clone(&vsh);
            let app_handle = app.handle().clone();
            tokio::spawn(async move {
                let mut sys = System::new_all();
                loop {
                    sys.refresh_all();
                    let state = vsh_for_sync.get_state();
                    let _ = app_handle.emit("state-update", state);
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            system_status,
            process_mind_command,
            get_hardware_metrics,
            process_probe,
            execute_sovereign_terminal,
            jules_execute
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
