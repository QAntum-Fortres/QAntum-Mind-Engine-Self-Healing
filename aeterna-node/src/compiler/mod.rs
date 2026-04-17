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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vm::bytecode::AeternaOpcode;

    #[test]
    fn test_compile_become_void() {
        let source = "BECOME VOID";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 2); // ENTROPY_RESET + HALT
        assert!(matches!(bytecode[0], AeternaOpcode::ENTROPY_RESET));
        assert!(matches!(bytecode[1], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_manifest() {
        let source = "MANIFEST 42";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 2);
        assert!(matches!(bytecode[0], AeternaOpcode::LOAD(42)));
        assert!(matches!(bytecode[1], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_transcend() {
        let source = "TRANSCEND";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 2);
        assert!(matches!(bytecode[0], AeternaOpcode::ADD));
        assert!(matches!(bytecode[1], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_echo() {
        let source = "ECHO";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 2);
        assert!(matches!(bytecode[0], AeternaOpcode::PRINT));
        assert!(matches!(bytecode[1], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_anchor() {
        let source = "ANCHOR 10";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 2);
        assert!(matches!(bytecode[0], AeternaOpcode::STORE(10)));
        assert!(matches!(bytecode[1], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_sequence() {
        let source = "MANIFEST 10 MANIFEST 20 TRANSCEND ECHO";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 5);
        assert!(matches!(bytecode[0], AeternaOpcode::LOAD(10)));
        assert!(matches!(bytecode[1], AeternaOpcode::LOAD(20)));
        assert!(matches!(bytecode[2], AeternaOpcode::ADD));
        assert!(matches!(bytecode[3], AeternaOpcode::PRINT));
        assert!(matches!(bytecode[4], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_unknown_tokens() {
        let source = "MANIFEST 10 IGNORE_ME TRANSCEND ECHO BLAH";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 4);
        assert!(matches!(bytecode[0], AeternaOpcode::LOAD(10)));
        assert!(matches!(bytecode[1], AeternaOpcode::ADD));
        assert!(matches!(bytecode[2], AeternaOpcode::PRINT));
        assert!(matches!(bytecode[3], AeternaOpcode::HALT));
    }

    #[test]
    fn test_compile_incomplete_manifest() {
        let source = "MANIFEST";
        let bytecode = SoulCompiler::compile(source);
        assert_eq!(bytecode.len(), 1); // Only HALT
        assert!(matches!(bytecode[0], AeternaOpcode::HALT));
    }
}
