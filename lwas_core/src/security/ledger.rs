use crate::prelude::*;
use std::sync::atomic::{AtomicBool, Ordering};

pub struct SovereignLedger;

static LOCKED: AtomicBool = AtomicBool::new(false);

impl SovereignLedger {
    /// finalize_and_lock: Заключва леджъра с имутабилен хеш.
    pub fn finalize_and_lock(architect: &str, hash: &str) {
        if LOCKED.load(Ordering::SeqCst) {
            println!("⚠️ [LEDGER]: Опит за повторно заключване отказан.");
            return;
        }

        println!("--------------------------------------------------");
        println!("🏛️ [LEDGER]: ГЕНЕРИРАНЕ НА ИМУТАБИЛЕН ЗАПИС...");
        println!("🏛️ [ARCHITECT]: {}", architect);
        println!("🏛️ [HASH]: {}", hash);
        println!("🏛️ [RESULT]: SOVEREIGNTY SECURED.");
        println!("--------------------------------------------------");

        LOCKED.store(true, Ordering::SeqCst);
    }

    pub fn is_locked() -> bool {
        LOCKED.load(Ordering::SeqCst)
    }
}
