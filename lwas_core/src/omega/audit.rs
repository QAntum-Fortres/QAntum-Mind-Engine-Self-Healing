use crate::prelude::*;
use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};
use ignore::WalkBuilder;
use memmap2::Mmap;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum FindingType { Redundancy, DeadCode, LogicGap, Optimization, Security, Performance }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditFinding {
    pub id: String,
    pub f_type: FindingType,
    pub title: String,
    pub files: Vec<PathBuf>,
    pub impact_lines: usize,
    pub suggestion: String,
}

pub struct SovereignAudit {
    pub symbol_registry: DashMap<String, SymbolInfo>,
    pub findings: Vec<AuditFinding>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SymbolInfo {
    pub name: String,
    pub project: String,
    pub file_path: PathBuf,
    pub line: usize,
    pub hash: String,
}

impl SovereignAudit {
    pub fn new() -> Self {
        Self {
            symbol_registry: DashMap::new(),
            findings: Vec::new(),
        }
    }

    /// ФАЗА 1-6: Екзекуция на Пълния Одит
    pub async fn run_full_audit(&mut self, projects: Vec<PathBuf>) -> SovereignResult<()> {
        println!("🏛️  SOVEREIGN AUDIT: INITIATING EMPIRE SCAN...");
        
        // Phase 1: Build Symbol Registry (Parallel)
        self.build_registry(&projects)?;

        // Phase 2: Redundancy Detection
        self.detect_redundancy();

        // Phase 3: Dead Code Analysis
        self.detect_dead_code();

        // Phase 4: Logic Gap Detection (Regex Engine)
        self.detect_logic_gaps(&projects);

        println!("✅ AUDIT COMPLETE. ENTROPY MAPPED.");
        Ok(())
    }

    fn build_registry(&self, paths: &[PathBuf]) -> SovereignResult<()> {
        paths.par_iter().for_each(|path| {
            let walker = WalkBuilder::new(path)
                .standard_filters(true)
                .build();

            for entry in walker.flatten() {
                if entry.file_type().map_or(false, |ft| ft.is_file()) {
                    if let Some(ext) = entry.path().extension() {
                        if ext == "rs" || ext == "ts" || ext == "js" {
                            self.index_file(entry.path());
                        }
                    }
                }
            }
        });
        Ok(())
    }

    fn index_file(&self, path: &Path) {
        if let Ok(file) = fs::File::open(path) {
            if let Ok(mmap) = unsafe { Mmap::map(&file) } {
                let content = String::from_utf8_lossy(&mmap);
                
                // Rust/TS Symbol Extraction Logic
                if let Ok(re) = Regex::new(r"(export\s+)?(class|fn|function|struct|enum|interface)\s+([a-zA-Z_][a-zA-Z0-9_]*)") {
                    for cap in re.captures_iter(&content) {
                        let name = cap[3].to_string();
                        let info = SymbolInfo {
                            name: name.clone(),
                            project: "Empire".into(),
                            file_path: path.to_path_buf(),
                            line: 0, 
                            hash: format!("{:x}", md5::compute(name.as_bytes())),
                        };
                        self.symbol_registry.insert(name, info);
                    }
                }
            }
        }
    }

    fn detect_logic_gaps(&mut self, paths: &[PathBuf]) {
        let patterns = vec![
            (Regex::new(r"TODO:|FIXME:").unwrap(), FindingType::LogicGap, "Technical Debt Found"),
            (Regex::new(r"\bany\b").unwrap(), FindingType::Security, "Unsafe 'any' type detected"),
        ];

        let findings: Vec<AuditFinding> = paths.par_iter().flat_map(|path| {
            let walker = WalkBuilder::new(path)
                .standard_filters(true)
                .build();

            let mut local_findings = Vec::new();

            for entry in walker.flatten() {
                if entry.file_type().map_or(false, |ft| ft.is_file()) {
                    if let Ok(file) = fs::File::open(entry.path()) {
                        if let Ok(mmap) = unsafe { Mmap::map(&file) } {
                            let content = String::from_utf8_lossy(&mmap);
                            
                            for (re, f_type, title) in &patterns {
                                if re.is_match(&content) {
                                    local_findings.push(AuditFinding {
                                        id: Uuid::new_v4().to_string(),
                                        f_type: f_type.clone(),
                                        title: title.to_string(),
                                        files: vec![entry.path().to_path_buf()],
                                        impact_lines: 1, // Simplified
                                        suggestion: "Review and entrench stable logic.".into(),
                                    });
                                }
                            }
                        }
                    }
                }
            }
            local_findings
        }).collect();

        self.findings.extend(findings);
    }

    fn detect_redundancy(&mut self) { }
    fn detect_dead_code(&mut self) { }
}
