// aeterna-node/src/compiler/mod.rs
use crate::vm::bytecode::AeternaOpcode;
use tracing::info;

pub struct SoulCompiler;

impl SoulCompiler {
    pub fn compile(source: &str) -> Vec<AeternaOpcode> {
        info!("Compiling Soul Source: '{}'", source);
        let mut bytecode = Vec::new();

        let tokens: Vec<&str> = source.split_whitespace().collect();
        let mut i = 0;

        while i < tokens.len() {
            match tokens[i] {
                "BECOME" => {
                    if i + 1 < tokens.len() && tokens[i+1] == "VOID" {
                         // "BECOME VOID" -> Triggers Zero Point Entropy
                        bytecode.push(AeternaOpcode::ENTROPY_RESET);
                        i += 1;
                    }
                },
                "MANIFEST" => {
                     // "MANIFEST <value>" -> LOAD <value>
                    if i + 1 < tokens.len() {
                        if let Ok(val) = tokens[i+1].parse::<i64>() {
                            bytecode.push(AeternaOpcode::LOAD(val));
                            i += 1;
                        }
                    }
                },
                "TRANSCEND" => {
                     // "TRANSCEND" -> ADD (Merge two concepts)
                    bytecode.push(AeternaOpcode::ADD);
                },
                "ECHO" => {
                    // "ECHO" -> PRINT
                    bytecode.push(AeternaOpcode::PRINT);
                },
                "ANCHOR" => {
                    // "ANCHOR <addr>" -> STORE <addr>
                    if i + 1 < tokens.len() {
                         if let Ok(addr) = tokens[i+1].parse::<usize>() {
                            bytecode.push(AeternaOpcode::STORE(addr));
                            i += 1;
                        }
                    }
                },
                _ => {}
            }
            i += 1;
        }

        bytecode.push(AeternaOpcode::HALT);

        info!("Compilation complete. Generated {} opcodes.", bytecode.len());
        bytecode
    }
}
