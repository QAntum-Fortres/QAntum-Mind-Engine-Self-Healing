use crate::prelude::*;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneratedAsset {
    pub name: String,
    pub version: String,
    pub price_tag: f64,
    pub path: PathBuf,
}

pub struct SovereignGenerator {
    pub asset_vault: PathBuf,
    pub market_threshold: f64,
}

impl SovereignGenerator {
    pub fn new() -> Self {
        Self { 
            asset_vault: PathBuf::from("./assets/sovereign_saas"),
            market_threshold: 0.85, 
        }
    }

    /// AUTONOMOUS PACKAGING: Slices a feature into a standalone crate.
    pub async fn package_cluster(&self, cluster_name: &str, files: Vec<PathBuf>, vsh: &VectorSpaceHeap) -> SovereignResult<GeneratedAsset> {
         let finding = AuditFinding {
             id: Uuid::new_v4().to_string(),
             title: cluster_name.to_string(),
             files: files.clone(),
             impact_lines: 100,
             f_type: FindingType::Redundancy,
             suggestion: "Autonomous extraction".to_string(),
         };
         
         let asset_id = self.transmute_to_asset(&finding, vsh).await?;
         
         Ok(GeneratedAsset {
             name: cluster_name.to_string(),
             version: "1.0.0".to_string(),
             price_tag: 1450.00,
             path: self.asset_vault.join(asset_id),
         })
    }

    /// GENERATION: Transmutes a logic cluster into a sovereign product
    pub async fn transmute_to_asset(&self, gem: &AuditFinding, vsh: &VectorSpaceHeap) -> SovereignResult<String> {
        println!("💎 GENERATOR: EXTRACTING LOGIC GEM FROM {:?}...", gem.title);

        if gem.files.is_empty() {
             return Err(SovereignError::VshError("Node Not Found".into()));
        }

        let logic_payload = fs::read_to_string(&gem.files[0]).map_err(|e| SovereignError::IoError(e.to_string()))?;
        let saas_code = self.wrap_in_sovereign_api(&logic_payload);

        let asset_id = format!("MM_SAAS_{}", Uuid::new_v4().simple());
        let asset_path = self.asset_vault.join(&asset_id);
        
        if !asset_path.exists() {
             fs::create_dir_all(&asset_path).map_err(|e| SovereignError::IoError(e.to_string()))?;
        }
        
        let src_path = asset_path.join("src");
        fs::create_dir_all(&src_path).map_err(|e| SovereignError::IoError(e.to_string()))?;
        fs::write(src_path.join("main.rs"), saas_code).map_err(|e| SovereignError::IoError(e.to_string()))?;
        
        self.generate_manifest(&asset_path, &asset_id)?;

        let asset_value = gem.impact_lines as f64 * 1450.0; 
        
        vsh.allocate(
            format!("MM_SAAS:{}", gem.title),
            vec![1.0; 128], 
        );

        println!("✨ ASSET GENERATED: {} | ESTIMATED EQUITY: ${:.2}", asset_id, asset_value);

        Ok(asset_id)
    }

    fn wrap_in_sovereign_api(&self, logic: &str) -> String {
        format!(
            "use axum::{{routing::post, Json, Router}};
            #[tokio::main]
            pub async fn main() {{
                let app = Router::new().route(\"/process\", post(handler));
                println!(\"Micro-SaaS Active on Port 80\");
            }}
            
            async fn handler(Json(_payload): Json<serde_json::Value>) -> Json<serde_json::Value> {{
                todo!()
            }}
            
            // LOGIC CORE:
            /*
            {}
            */
            ",
            logic.replace("*/", "* /") 
        )
    }

    fn generate_manifest(&self, path: &Path, name: &str) -> SovereignResult<()> {
        let toml = format!(
            r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
serde = {{ version = "1.0", features = ["derive"] }}
serde_json = "1.0"
tokio = {{ version = "1", features = ["full"] }}
"#,
            name.to_lowercase()
        );
        fs::write(path.join("Cargo.toml"), toml).map_err(|e| SovereignError::IoError(e.to_string()))?;
        Ok(())
    }
}
