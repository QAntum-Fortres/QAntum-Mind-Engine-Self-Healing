// aeterna-node/src/vm/bytecode.rs

#[derive(Debug, Clone)]
#[allow(non_camel_case_types)]
pub enum AeternaOpcode {
    // Basic Operations
    LOAD(i64),       // Load value onto the stack (changed to i64 for general purpose)
    STORE(usize),    // Store value from stack into memory address
    ADD,             // Add top two values on stack
    SUB,             // Subtract top value from second top value
    MUL,             // Multiply top two values
    DIV,             // Divide second top value by top value

    // Control Flow
    JUMP(usize),     // Unconditional jump to instruction index
    JUMP_IF(usize),  // Jump if top of stack is non-zero (true)

    // Teleportation / Network Operations
    SAVE_STATE,      // Save current VM state for teleportation
    LOAD_STATE,      // Load state from network (placeholder behavior)
    REQUEST_HOST,    // Request a new host for execution

    // Debug/System
    PRINT,           // Print top of stack
    HALT,            // Stop execution
}
