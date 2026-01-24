// lwas_core/src/main.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA
// STATUS: NOETIC_INTEGRATION_V2

use dotenv::dotenv;
use lwas_core::omega::binance_bridge::BinanceBridge;
use lwas_core::omega::listener::AeternaListener;
use lwas_core::omega::terminal_bridge::TerminalBridge;
use lwas_core::omega::wealth_bridge::WealthBridge;
use lwas_core::omega::xenon::ProtocolXenon;
use lwas_core::SovereignResult;
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::{Keypair, Signer};
use std::env;

#[tokio::main]
async fn main() -> SovereignResult<()> {
    dotenv().ok();

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

    // 2. Свързване с Solana
    let rpc_url = "https://api.mainnet-beta.solana.com".to_string();
    let client = RpcClient::new(rpc_url.clone());

    if let Ok(priv_key_raw) = env::var("SOLANA_PRIVATE_KEY") {
        let architect_keypair = Keypair::from_base58_string(&priv_key_raw);
        let public_key = architect_keypair.pubkey();

        println!("📍 [SOLANA_ANCHOR]: {}", public_key);

        if let Ok(sol_price) = WealthBridge::get_real_sol_price().await {
            if let Ok(balance_lamports) = client.get_balance(&public_key) {
                let balance_sol = balance_lamports as f64 / 1_000_000_000.0;
                println!(
                    "💰 [SOL_LIQUIDITY]: {:.4} SOL (${:.2} USD)",
                    balance_sol,
                    balance_sol * sol_price
                );
            }
        }

        if is_reclaim {
            ProtocolXenon::reclaim_dust(&client, &architect_keypair).await?;
        } else {
            ProtocolXenon::scan_market_pulse(&client).await?;
            ProtocolXenon::execute_deep_scan(&client, &public_key).await?;
        }
    }

    println!("--------------------------------------------------");
    Ok(())
}
