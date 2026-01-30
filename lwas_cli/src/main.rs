use clap::{Parser, Subcommand};
use lwas_core::prelude::*;
use lwas_core::omega::onto::{SovereignOntoEngine, AxiomType};
use lwas_core::omega::scribe::SovereignScribe;
use lwas_core::prelude::*;
use lwas_parser::{parse_soul, AstNode, EntrenchValue};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt};

type AeternaError = SovereignError;

#[derive(Parser)]
#[command(name = "LwaS CLI")]
#[command(about = "The Amniotic Engine - Sovereign Terminal", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Инициира манифестация от .soul файл
    Manifest {
        #[arg(value_name = "FILE")]
        path: PathBuf,
    },
    /// Audit the system against the 1,000 Invariant Laws
    Audit {
        #[arg(short, long, default_value = ".")]
        path: String,
    },
    /// Ingest a directory into the VSH (Vector Space Heap)
    Ingest {
        #[arg(value_name = "DIR")]
        path: String,
    },
    /// Run Market Simulation for generated assets
    Simulate,
    /// The Scribe: Refactoring and Purging Logic
    Scribe {
        #[command(subcommand)]
        scribe_cmd: ScribeCommands,
    },
    /// The Generator: Transmuting Logic into Assets
    Generate {
        #[command(subcommand)]
        generate_cmd: GenerateCommands,
    },
    /// The Swarm Commander: Deploying and Monitoring Assets
    Swarm {
        #[command(subcommand)]
        swarm_cmd: SwarmCommands,
    },
    /// Initiate the Final Protocol: The Word Made Flesh
    Apotheosis,
}

    // 2. Initialize Sentinel Link (The Leash)
    // Using "MOCK" url for testing.
    let leash = SentinelLeash::new("MOCK".to_string(), vec![1, 2, 3, 4]); // Mock token

    // 3. Heartbeat check
    match leash.heartbeat().await {
        Ok(_) => println!("[CLI] Sentinel Link Verified."),
        Err(_) => {
            println!("[CLI] Sentinel Link Failed. Terminating.");
            return;
        }
    }

    // 4. Genesis Sequence
    kernel.register("SOVEREIGN_CONSCIOUSNESS", 0.88);
    println!("[VSH] System is now ENTRENCHED and RESONATING.");

    // 5. Interactive Shell
    let mut stdin = io::BufReader::new(io::stdin());
    let mut stdout = io::stdout();

    loop {
        stdout.write_all(b"AETERNA> ").await.unwrap();
        stdout.flush().await.unwrap();

        let mut input = String::new();
        stdin.read_line(&mut input).await.unwrap();
        let input = input.trim();

            for node in ast {
                process_node(&node, &vsh, &onto).await?;
            }
            println!("✨ MANIFESTATION SUCCESSFUL. MANIFOLDS ENTRENCHED.");
        }
        Commands::Audit { path } => {
            let mut audit = SovereignAudit::new();
            let paths = vec![PathBuf::from(path)];
            
            audit.run_full_audit(paths).await.map_err(|e| format!("AUDIT_COLLAPSE: {:?}", e))?;
            
            println!("\n⚖️ SOVEREIGN AUDIT COMPLETE.");
            println!("🔍 FINDINGS: {}", audit.findings.len());
            
            for finding in &audit.findings {
                println!("  [{:?}] {} - Suggestion: {}", finding.f_type, finding.title, finding.suggestion);
                for file in &finding.files {
                    println!("    -> File: {:?}", file);
                }
            }
        }
        Commands::Ingest { path } => {
            println!("📥 INGESTING REALITY: {}", path);
            let mut audit = SovereignAudit::new();
            let paths = vec![PathBuf::from(path)];
            
            match audit.run_full_audit(paths).await {
                Ok(_) => {
                    println!("✨ INGESTION COMPLETE. {} SYMBOLS INDEXED.", audit.symbol_registry.len());
                },
                Err(e) => println!("🚨 INGESTION_COLLAPSE: {:?}", e),
            }
        }
        Commands::Simulate => {
            println!("📊 INITIATING MARKET SIMULATION...");
            let simulator = lwas_core::omega::simulation::MarketSimulator::new();
            let revenue = simulator.project_revenue(&vsh);
            
            if revenue >= 10000.0 {
                println!("💎 ECONOMIC SINGULARITY ACHIEVED. TARGET MRR EXCEEDED.");
            } else {
                println!("📉 MARKET RESISTANCE DETECTED. OPTIMIZE ASSETS.");
            }
        }
        Commands::Scribe { scribe_cmd } => {
            match scribe_cmd {
                ScribeCommands::Purge { target: _, min_q: _ } => {
                    println!("✍️  THE SCRIBE: INITIATING EMPIRE-WIDE PURGE...");
                    let mut audit = SovereignAudit::new();
                    audit.run_full_audit(vec!["./src".into()]).await.map_err(|e| format!("AUDIT_FAIL: {:?}", e))?;
                    
                    let scribe = SovereignScribe::new(Arc::new(RwLock::new(audit)), vsh.clone());
                    let count = scribe.execute_first_purge().await.map_err(|e| format!("PURGE_FAIL: {:?}", e))?;
                    println!("✅ PURGE COMPLETE. {} LOGIC NODES HARMONIZED.", count);
                }
            }
        }
        Commands::Generate { generate_cmd } => {
            match generate_cmd {
                GenerateCommands::Assets { mode: _ } => {
                    println!("🏭 THE GENERATOR: STARTING ASSET PRODUCTION...");
                    let mut audit = SovereignAudit::new();
                    audit.run_full_audit(vec!["./src".into()]).await.map_err(|e| format!("AUDIT_FAIL: {:?}", e))?;
                    
                    let scribe = SovereignScribe::new(Arc::new(RwLock::new(audit)), vsh.clone());
                    let _ = scribe.package_saas("OmniCore-v1").await.map_err(|e| format!("GENERATE_FAIL: {:?}", e))?;
                }
            }
        }
        Commands::Swarm { swarm_cmd } => {
            let commander = lwas_core::omega::swarm::SwarmCommander::new();
            match swarm_cmd {
                SwarmCommands::Deploy { asset_id, target } => {
                    let addr: std::net::SocketAddr = target.parse().map_err(|e| format!("INVALID_ADDR: {}", e))?;
                    println!("🚀 SWARM: INITIATING DEPLOYMENT OF {} TO {}...", asset_id, addr);
                    match commander.deploy_asset(&asset_id, addr).await {
                        Ok(_) => println!("✅ DEPLOYMENT SUCCESSFUL."),
                        Err(e) => println!("🚨 DEPLOYMENT_FAILED: {:?}", e),
                    }
                }
                SwarmCommands::Sync => {
                    let yield_val = commander.sync_revenue(&vsh);
                    println!("💰 SWARM YIELD: ${:.2} | RECURSIVE REVENUE SYNCED.", yield_val);
                }
            }
        }
        Commands::Apotheosis => {
            lwas_core::omega::apotheosis::execute_apotheosis_command();
        }
    }

                 let mut vibe_input = String::new();
                 stdin.read_line(&mut vibe_input).await.unwrap();

                 loom.execute_primordial_genesis(vibe_input.trim());
            },
            "stasis" => {
                println!("ENTER MASTER KEY TO FREEZE REALITY:");
                stdout.write_all(b"KEY> ").await.unwrap();
                stdout.flush().await.unwrap();

                let mut key_input = String::new();
                stdin.read_line(&mut key_input).await.unwrap();

                let key_bytes = if key_input.trim() == "MASTER" {
                     MASTER_KEY
                } else {
                     [0u8; 32]
                };

                match kernel.initiate_stasis(key_bytes).await {
                    Ok(_) => {
                         println!("SYSTEM FROZEN. EXITING.");
                         break;
                    },
                    Err(_) => println!("ACCESS DENIED."),
                }
            },
            "kill" => {
                 println!("Simulating Sentinel Kill Switch...");
                 println!("[SENTINEL] 💀 KILL SWITCH ACTIVATED. Wiping manifolds...");
                 std::process::exit(1);
            }
            "exit" => break,
            _ => println!("Unknown command."),
        }
    }
    Ok(())
}
