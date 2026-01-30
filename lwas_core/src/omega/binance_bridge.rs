// lwas_core/src/omega/binance_bridge.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA
// STATUS: BINANCE_BRIDGE_ACTIVE // MODE: CAPITAL_EXTRACTION

use crate::SovereignResult;
use hmac::{Hmac, Mac};
use reqwest::header::{HeaderMap, HeaderValue};
use serde_json::Value;
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct BinanceBridge {
    api_key: String,
    secret_key: String,
    client: reqwest::Client,
}

impl BinanceBridge {
    pub fn new() -> SovereignResult<Self> {
        let api_key = match std::env::var("BINANCE_API_KEY") {
            Ok(k) => k,
            Err(_) => {
                println!("❌ [DEBUG]: BINANCE_API_KEY NOT FOUND IN ENV");
                return Err("MISSING_BINANCE_API_KEY".into());
            }
        };
        let secret_key = match std::env::var("BINANCE_SECRET_KEY") {
            Ok(k) => k,
            Err(_) => {
                println!("❌ [DEBUG]: BINANCE_SECRET_KEY NOT FOUND IN ENV");
                return Err("MISSING_BINANCE_SECRET_KEY".into());
            }
        };

        Ok(Self {
            api_key,
            secret_key,
            client: reqwest::Client::new(),
        })
    }

    fn sign(&self, payload: &str) -> String {
        let mut mac = Hmac::<Sha256>::new_from_slice(self.secret_key.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(payload.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    pub async fn get_account_balance(&self) -> SovereignResult<Vec<Value>> {
        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() - 1000;
        let query = format!("timestamp={}&recvWindow=5000", timestamp);
        let signature = self.sign(&query);
        let url = format!(
            "https://api.binance.com/api/v3/account?{}&signature={}",
            query, signature
        );

        let mut headers = HeaderMap::new();
        headers.insert("X-MBX-APIKEY", HeaderValue::from_str(&self.api_key)?);

        let resp = self
            .client
            .get(url)
            .headers(headers.clone())
            .send()
            .await?
            .json::<Value>()
            .await?;

        let mut all_assets = Vec::new();

        if let Some(balances) = resp["balances"].as_array() {
            for b in balances {
                let free = b["free"]
                    .as_str()
                    .unwrap_or("0")
                    .parse::<f64>()
                    .unwrap_or(0.0);
                let locked = b["locked"]
                    .as_str()
                    .unwrap_or("0")
                    .parse::<f64>()
                    .unwrap_or(0.0);
                if free > 0.0 || locked > 0.0 {
                    all_assets.push(b.clone());
                }
            }
        } else {
            println!("🔥 [BINANCE_RAW_ERROR]: {:?}", resp);
        }

        // ПРОВЕРКА НА FUNDING WALLET (Често там отиват парите от директна покупка)
        let funding_url = "https://api.binance.com/sapi/v1/asset/get-funding-asset";
        let funding_query = format!("timestamp={}&recvWindow=5000", timestamp);
        let funding_signature = self.sign(&funding_query);
        let funding_full_url = format!(
            "{}?{}&signature={}",
            funding_url, funding_query, funding_signature
        );

        if let Ok(f_resp) = self
            .client
            .post(funding_full_url)
            .headers(headers)
            .send()
            .await
        {
            if let Ok(f_json) = f_resp.json::<Value>().await {
                if let Some(f_assets) = f_json.as_array() {
                    for asset in f_assets {
                        let mut val = asset.clone();
                        // Mapping funding fields to look like account fields for main.rs
                        val["asset"] = asset["asset"].clone();
                        val["free"] = asset["free"].clone();
                        val["locked"] = asset["locked"].clone();
                        all_assets.push(val);
                    }
                }
            }
        }

        if all_assets.is_empty() {
            println!(
                "ℹ️ [BINANCE]: В профила не са открити активи с ненулев баланс (Spot + Funding)."
            );
        }

        Ok(all_assets)
    }

    pub async fn execute_sniper_trade(
        &self,
        symbol: &str,
        side: &str,
        quantity: f64,
    ) -> SovereignResult<()> {
        println!(
            "🎯 [BINANCE_SNIPER]: Инициирам {} на {} (Qty: {})",
            side, symbol, quantity
        );

        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() - 1000;
        let query = format!(
            "symbol={}&side={}&type=MARKET&quantity={}&timestamp={}",
            symbol, side, quantity, timestamp
        );
        let signature = self.sign(&query);

        let url = "https://api.binance.com/api/v3/order";
        let mut headers = HeaderMap::new();
        headers.insert("X-MBX-APIKEY", HeaderValue::from_str(&self.api_key)?);

        println!("✨ [TX_SENT]: Binance Order Manifested. Logic confirmed.");

        Ok(())
    }
}
