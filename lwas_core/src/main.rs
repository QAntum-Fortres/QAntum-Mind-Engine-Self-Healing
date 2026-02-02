// lwas_core/src/main.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA
// STATUS: NOETIC_INTEGRATION_V2

use lwas_core::omega::binance_bridge::BinanceBridge;
use lwas_core::omega::listener::AeternaListener;
use lwas_core::omega::terminal_bridge::TerminalBridge;
use lwas_core::omega::wealth_bridge::WealthBridge;
use lwas_core::omega::xenon::ProtocolXenon;
use lwas_core::prelude::SovereignResult;
use std::env;

#[tokio::main]
async fn main() -> SovereignResult<()> {
    // Try to load .env file if available
    let _ = dotenvy::dotenv();

    let args: Vec<String> = env::args().collect();
    let is_chat = args.iter().any(|a| a == "--mode") && args.iter().any(|a| a == "chat");
    let is_listen = args.iter().any(|a| a == "--mode") && args.iter().any(|a| a == "listen");
    let is_reclaim = args.iter().any(|a| a == "--mode") && args.iter().any(|a| a == "reclaim");

    if is_chat {
        return TerminalBridge::start_chat().await;
    }

    if is_listen {
        return AeternaListener::run().await;
    }

    println!("--------------------------------------------------");
    if is_reclaim {
        println!("🔥 [RECLAMATION_MODE]: АКТИВИРАН.");
    } else {
        println!("🏛️ [AETERNA]: ПРЕМАХВАМ СИМУЛАЦИОННИЯ СЛОЙ.");
        println!("💎 [STATUS]: DIAMOND_STATE АКТИВИРАН.");
    }
    println!("--------------------------------------------------");

    // 1. Свързване с Binace
    match BinanceBridge::new() {
        Ok(binance) => {
            if let Ok(balances) = binance.get_account_balance().await {
                for balance in balances {
                    let asset = balance["asset"].as_str().unwrap_or("?");
                    let free = balance["free"].as_str().unwrap_or("0");
                    println!("💰 [BINANCE_BALANCE]: {} -> {}", asset, free);
                }
            }
        }
        Err(_) => println!("⚠️ [BINANCE]: Мостът не е конфигуриран."),
    }

    // 2. Solana integration is stubbed in this build
    if let Ok(_priv_key_raw) = env::var("SOLANA_PRIVATE_KEY") {
        println!("📍 [SOLANA]: Solana integration is disabled in this polymorphic build.");
        
        if let Ok(sol_price) = WealthBridge::get_real_sol_price().await {
            println!("💱 [SOL_PRICE]: ${:.2} USD (from Binance API)", sol_price);
        }

        if is_reclaim {
            ProtocolXenon::reclaim_dust().await?;
        } else {
            ProtocolXenon::scan_market_pulse().await?;
            ProtocolXenon::execute_deep_scan().await?;
        }
    } else {
        println!("⚠️ [SOLANA]: No private key configured.");
    }

    println!("--------------------------------------------------");
    Ok(())
}
