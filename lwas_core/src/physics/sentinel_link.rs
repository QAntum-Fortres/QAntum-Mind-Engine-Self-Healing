// src/lwas_core/physics/sentinel_link.rs
use crate::physics::memory_shrouding::ShroudedBuffer;
use crate::prelude::*;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SentinelHeartbeat {
    machine_id: String,
    signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SentinelResponse {
    status: String, // "ACTIVE", "REVOKED"
}

pub struct LeashConfig {
    pub server_url: String,
    pub heartbeat_interval: Duration,
}

pub struct SentinelLeash {
    config: LeashConfig,
    secure_token: ShroudedBuffer,
    client: Client,
}

impl SentinelLeash {
    pub fn new(server_url: String, token: Vec<u8>) -> Self {
        Self {
            config: LeashConfig {
                server_url,
                heartbeat_interval: Duration::from_secs(60),
            },
            secure_token: ShroudedBuffer::new(token),
            client: Client::new(),
        }
    }

    pub async fn heartbeat(&self) -> SovereignResult<()> {
        // 1. Генерираме хардуерен отпечатък (CPU + BIOS)
        let fingerprint = self.get_hardware_dna();

        // 2. Подписваме заявката с нашия полиморфен ключ
        let signature = self.sign_bare_metal(&fingerprint);

        // 3. Ако сървърът върне "REVOKED", ядрото извършва логическо самоубийство
        match self.query_mother_ship(&fingerprint, &signature).await {
            Ok(status) => {
                if status == "REVOKED" {
                    self.atomic_self_destruct();
                    return Err(SovereignError::EntropyDetected("Resonance Lost".into()));
                }
            }
            Err(_) => {
                // Network failure or server down. Policy: DESTROY_ON_FAILURE
                // In a real scenario, might retry. Here we strictly follow "The Leash".
                println!("[SENTINEL] Connection lost. Policy: DESTROY_ON_FAILURE.");
                self.atomic_self_destruct();
                return Err(SovereignError::EntropyDetected("Resonance Lost".into()));
            }
        }

        println!("[SENTINEL] Heartbeat acknowledged. System sovereign.");
        Ok(())
    }

    fn get_hardware_dna(&self) -> String {
        let hostname = System::host_name().unwrap_or_else(|| "UNKNOWN".to_string());
        let os_release = System::os_version().unwrap_or_else(|| "UNKNOWN".to_string());
        format!("{}-{}", hostname, os_release)
    }

    fn sign_bare_metal(&self, fingerprint: &str) -> String {
        // Mock HMAC signature using the shrouded token
        // In reality, this would use the crypto crate properly.
        let token_slice = self.secure_token.read();
        // Simple XOR based signature for demo purposes (NOT production secure)
        let mut signature = String::new();
        for (i, c) in fingerprint.bytes().enumerate() {
            let key_byte = token_slice[i % token_slice.len()];
            signature.push_str(&format!("{:02x}", c ^ key_byte));
        }
        signature
    }

    async fn query_mother_ship(
        &self,
        machine_id: &str,
        signature: &str,
    ) -> Result<String, reqwest::Error> {
        let payload = SentinelHeartbeat {
            machine_id: machine_id.to_string(),
            signature: signature.to_string(),
        };

        // For demo, if server URL is "MOCK", we simulate success or revocation based on machine_id
        if self.config.server_url == "MOCK" {
            if machine_id.contains("ROGUE") {
                return Ok("REVOKED".to_string());
            }
            return Ok("ACTIVE".to_string());
        }

        let resp = self
            .client
            .post(&self.config.server_url)
            .json(&payload)
            .send()
            .await?
            .json::<SentinelResponse>()
            .await?;

        Ok(resp.status)
    }

    fn atomic_self_destruct(&self) {
        println!("[SENTINEL] 💀 KILL SWITCH ACTIVATED. Wiping manifolds...");
        // Директна инструкция към процесора за зануляване на кеша и RAM
        unsafe {
            self.trigger_memory_purge();
        }
    }

    unsafe fn trigger_memory_purge(&self) {
        // Mock memory purge. In Rust, we can't easily wipe all process memory without crashing.
        // We will simulate it by crashing the process intentionally after wiping sensitive structs (mock).
        println!("[SENTINEL] MEMORY PURGE SEQUENCE INITIATED...");
        // This is where we'd zero out memory regions.
        println!("[SENTINEL] SYSTEM TERMINATED.");
        std::process::exit(1);
    }
}
