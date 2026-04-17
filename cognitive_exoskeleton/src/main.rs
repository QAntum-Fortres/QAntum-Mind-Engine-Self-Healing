use anyhow::Result;
use clap::Parser;
use deno_core::JsRuntime;
use deno_core::RuntimeOptions;
use serde::Deserialize;
use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;
use tokio::time::{sleep, Duration};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the module directory
    #[arg(short, long, default_value = "modules/miner")]
    module: String,

    /// Number of concurrent threads to spawn
    #[arg(short, long, default_value_t = num_cpus::get())]
    concurrency: usize,

    /// Duration to run in seconds (0 for infinite)
    #[arg(short, long, default_value_t = 10)]
    duration: u64,
}

#[derive(Debug, Deserialize, Clone)]
struct Manifest {
    name: String,
    #[allow(dead_code)] version: String,
    entry: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    println!("Initializing Cognitive Exoskeleton Host...");
    println!("Using {} concurrent threads.", args.concurrency);
    println!("Target Module: {}", args.module);

    // 1. Load Module Manifest & Code into Memory (Read-Once)
    let module_path = Path::new(&args.module);
    let manifest_path = module_path.join("manifest.json");

    let manifest_content = std::fs::read_to_string(&manifest_path)
        .expect("Failed to read manifest");
    let manifest: Manifest = serde_json::from_str(&manifest_content)?;

    let entry_path = module_path.join(&manifest.entry);
    let code_content = std::fs::read_to_string(&entry_path)
        .expect("Failed to read entry script");

    // Shared state
    let global_counter = Arc::new(AtomicU64::new(0));
    let start_time = Instant::now();
    let duration = if args.duration > 0 { Some(Duration::from_secs(args.duration)) } else { None };

    // 2. Spawn Worker Tasks
    let mut handles = vec![];

    for id in 0..args.concurrency {
        let counter = global_counter.clone();
        let code = code_content.clone();
        let manifest_clone = manifest.clone();
        let duration_clone = duration;

        // Spawn blocking task because V8 is synchronous and CPU bound
        let handle = tokio::task::spawn_blocking(move || {
            // Initialize isolate per thread
            let mut js_runtime = JsRuntime::new(RuntimeOptions::default());
            let module_name = manifest_clone.name;

            let thread_start = Instant::now();

            loop {
                // Check duration if set
                if let Some(dur) = duration_clone {
                    if thread_start.elapsed() > dur {
                        break;
                    }
                }

                // Execute logic
                match js_runtime.execute_script(module_name.clone(), code.clone()) {
                    Ok(_) => {
                        counter.fetch_add(1, Ordering::Relaxed);
                    }
                    Err(e) => {
                        eprintln!("Thread {} error: {}", id, e);
                        break;
                    }
                }
            }
        });
        handles.push(handle);
    }

    // 3. Status Monitor
    let monitor_counter = global_counter.clone();
    let monitor_duration = duration;

    let monitor_handle = tokio::spawn(async move {
        let mut last_count = 0;
        let start = Instant::now();

        loop {
            sleep(Duration::from_secs(1)).await;

            if let Some(dur) = monitor_duration {
                if start.elapsed() > dur {
                    break;
                }
            }

            let current = monitor_counter.load(Ordering::Relaxed);
            let delta = current - last_count;
            println!("[MONITOR] Hashrate: {} ops/sec | Total: {}", delta, current);
            last_count = current;
        }
    });

    // Wait for all workers to complete
    for handle in handles {
        let _ = handle.await;
    }

    // Abort monitor if it's still running
    monitor_handle.abort();

    let total_ops = global_counter.load(Ordering::SeqCst);
    let elapsed = start_time.elapsed().as_secs_f64();
    println!("\n--- Execution Complete ---");
    println!("Total Operations: {}", total_ops);
    println!("Total Time: {:.2}s", elapsed);
    println!("Average Throughput: {:.2} ops/sec", total_ops as f64 / elapsed);

    Ok(())
}
