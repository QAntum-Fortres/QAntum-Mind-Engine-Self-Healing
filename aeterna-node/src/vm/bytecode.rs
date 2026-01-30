// aeterna-node/src/vm/bytecode.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
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

    // --- AETERNA 2200 FUTURIST EXTENSIONS ---
    /// [TRANSPORT] Rewrites the coordinates of matter in the universal ledger.
    ONTOLOGICAL_SHIFT(usize),

    /// [BIOLOGY] Induces a neuro-chemical state in the Noetic Membrane.
    RESONATE_MEMBRANE(usize), // Frequency index

    /// [ENERGY] Harvests energy by locally reversing entropy.
    INVERT_ENTROPY(usize), // Joules to harvest

    /// [QA] Validates the causal consistency of the current timeline event.
    VERIFY_TIMELINE(usize), // Hash of the event

    /// [SOCIETY] Predicts resource needs before they manifest.
    PREDICT_NEED(usize), // User ID

    // --- ONTOLOGICAL ENGINEERING EXTENSIONS ---
    /// [PHYSICS] Modifies local universal constants (G, c, h).
    TUNE_CONSTANT(usize, f64), // Constant ID, New Value

    /// [LOGIC] Inverts binary logic to Quantum Maybe states.
    INVERT_LOGIC(usize), // Quantum State ID

    /// [MATTER] Compiles syntax into physical objects.
    DEFINE_MATTER(String), // Syntax description

    /// [ENTROPY] Sends waste/entropy back in time.
    RECYCLE_CHRONO(f64), // Time delta (years)

    /// [CONSCIOUSNESS] Forks a soul into parallel instances.
    FORK_INSTANCE(usize), // Consciousness ID

    /// [QA] Applies a hotfix to the fabric of reality.
    PATCH_REALITY(usize, String), // Bug ID, Hotfix Name

    // Debug/System
    PRINT,           // Print top of stack
    HALT,            // Stop execution
}
