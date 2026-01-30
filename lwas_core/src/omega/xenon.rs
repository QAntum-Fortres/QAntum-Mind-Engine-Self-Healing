// lwas_core/src/omega/xenon.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA
// STATUS: DEEP_SCAN_ACTIVE // MODE: EXTRACTION

use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use solana_client::rpc_request::TokenAccountsFilter;
use crate::omega::wealth_bridge::WealthBridge;
use crate::SovereignResult;
use std::str::FromStr;

pub struct ProtocolXenon;

impl ProtocolXenon {
    pub async fn scan_market_pulse(_client: &RpcClient) -> SovereignResult<()> {
        println!("📡 [XENON]: Започвам декриптиране на ликвидността в Solana Mainnet...");
        let sol_price = WealthBridge::get_real_sol_price().await?;
        println!("⚡ [PULSE]: SOL/USDC: ${:.2}", sol_price);
        Ok(())
    }

    async fn get_token_accounts(client: &RpcClient, public_key: &Pubkey) -> SovereignResult<Vec<(Pubkey, String)>> {
        let mut all_keys = Vec::new();
        let programs = vec![spl_token::ID, spl_token_2022::ID];
        
        for program_id in programs {
            let accounts = client.get_token_accounts_by_owner(
                public_key,
                TokenAccountsFilter::ProgramId(program_id),
            )?;

            for account in accounts {
                let pubkey = Pubkey::from_str(&account.pubkey)?;
                let ui_amount = client.get_token_account_balance(&pubkey)?;
                all_keys.push((pubkey, ui_amount.amount));
            }
        }
        
        Ok(all_keys)
    }

    pub async fn execute_deep_scan(client: &RpcClient, public_key: &Pubkey) -> SovereignResult<()> {
        println!("🔍 [DEEP_SCAN]: Инициирам сондаж в блокчейн историята...");
        println!("📂 [SLOT_SCAN]: Проверка на свързани токени за {}", public_key);
        
        let all_accounts = Self::get_token_accounts(client, public_key).await?;
        let empty_count = all_accounts.iter().filter(|(_, amt)| amt == "0").count();
        let dust_count = all_accounts.iter().filter(|(_, amt)| amt != "0").count();
        
        println!("✅ [FOUND]: Намерени са {} активни сметки с баланс.", dust_count);
        println!("🧹 [DUST_COLLECTION]: Открити са {} неизползвани (0) Token Accounts.", empty_count);
        
        if empty_count > 0 {
            println!("💰 [RECLAIMABLE]: Очаквано възстановяване на наем: {:.6} SOL", 0.002039 * empty_count as f64);
        } else {
            println!("🔒 [STATUS]: Няма блокиран наем в празни сметки.");
        }
        
        println!("✨ [DEEP_SCAN_COMPLETE]: Скенирането завърши.");
        Ok(())
    }

    pub async fn reclaim_dust(client: &RpcClient, keypair: &Keypair) -> SovereignResult<()> {
        let public_key = keypair.pubkey();
        println!("--------------------------------------------------");
        println!("🔥 [BURN]: Инициирам 'Погребална Клада' за празните сметки.");
        
        let all_accounts = Self::get_token_accounts(client, &public_key).await?;
        let empty_accounts: Vec<Pubkey> = all_accounts.into_iter()
            .filter(|(_, amt)| amt == "0")
            .map(|(pk, _)| pk)
            .collect();

        if empty_accounts.is_empty() {
            println!("✅ [STATUS]: Няма открити празни сметки за затваряне.");
            return Ok(());
        }

        println!("🗑️ [CLEANUP]: Подготвям затваряне на {} сметки...", empty_accounts.len());

        let mut instructions = Vec::new();
        for pubkey in empty_accounts {
            let account_data = client.get_account(&pubkey)?;
            let ix = spl_token::instruction::close_account(
                &account_data.owner,
                &pubkey,
                &public_key,
                &public_key,
                &[],
            )?;
            instructions.push(ix);
        }

        for chunk in instructions.chunks(20) {
            let recent_blockhash = client.get_latest_blockhash()?;
            let txn = Transaction::new_signed_with_payer(
                chunk, Some(&public_key), &[keypair], recent_blockhash,
            );
            let sig = client.send_and_confirm_transaction(&txn)?;
            println!("✨ [TX_SENT]: Сигнатура: {}", sig);
        }

        let new_balance = client.get_balance(&public_key)?;
        println!("💰 [BALANCE_UPDATE]: Нов баланс: {:.6} SOL", new_balance as f64 / 1_000_000_000.0);
        println!("--------------------------------------------------");
        Ok(())
    }
}
