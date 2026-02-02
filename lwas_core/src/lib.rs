// lwas_core/src/lib.rs
// ARCHITECT: Dimitar Prodromov | STATUS: DIAMOND_STABILITY_RESTORED
// EVOLUTION: POLYMORPHIC_AETERNA_V1

//! # LWAS Core - Local Wisdom-as-a-Service
//!
//! ## Полиморфна Aeterna Logos
//!
//! Тази версия въвежда четирите стълба на самоеволюиращата се разумна логика:
//!
//! 1. **Polymorphic Engine** - Саморедактиращ се код за невидимост
//! 2. **Intent-Based Logic** - От синтаксис към намерение
//! 3. **Quantum Logic** - Вероятностно изчисление
//! 4. **Distributed Consciousness** - Mist архитектура

pub mod kernel;
pub mod memory;
pub mod neuro;
pub mod omega;
pub mod physics;
pub mod prelude;
pub mod runtime;
pub mod security;
pub mod synthesis;

// Експлицитен суверенитет: Никакви glob imports (*) тук!
pub use crate::memory::vsh::{VectorSpaceHeap, VshEngine, VshVector};
pub use crate::prelude::{SovereignError, SovereignResult};
