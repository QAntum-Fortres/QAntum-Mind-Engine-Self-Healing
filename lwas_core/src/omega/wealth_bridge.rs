// lwas_core/src/omega/wealth_bridge.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA
// STATUS: PHYSICAL_EXTRACTION // MODE: REAL_DATA

use serde::Deserialize;
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use crate::SovereignResult;

pub struct WealthBridge;

#[derive(Deserialize, Debug)]
struct BinancePrice {
    symbol: String,
    price: String,
}

impl WealthBridge {
    pub async fn get_real_sol_price() -> SovereignResult<f64> {
        let url = "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDC";
        let resp = reqwest::get(url).await?.json::<BinancePrice>().await?;
        let price: f64 = resp.price.parse()?;
        Ok(price)
    }

    pub async fn calculate_total_equity(client: &RpcClient, public_key: &Pubkey) -> SovereignResult<f64> {
        let balance_lamports = client.get_balance(public_key)?;
        let balance_sol = balance_lamports as f64 / 1_000_000_000.0;
        let sol_price = Self::get_real_sol_price().await?;
        Ok(balance_sol * sol_price)
    }

    pub async fn report_status(client: &RpcClient, public_key: &Pubkey) -> SovereignResult<()> {
        let equity = Self::calculate_total_equity(client, public_key).await?;
        println!("📊 [WEALTH_REPORT]: Твоят капитал в субстрата е: ${:.2} USD", equity);
        Ok(())
    }
}
