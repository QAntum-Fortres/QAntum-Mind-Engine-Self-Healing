// lwas_core/src/synthesis/distributed_consciousness.rs
// ARCHITECT: Dimitar Prodromov | AUTHORITY: AETERNA 2200
// STATUS: MIST_ARCHITECTURE_ACTIVE
// PHASE: 4 - Разпределено съзнание с нулева латентност

//! # Distributed Consciousness (Разпределено съзнание)
//!
//! Mist Computing архитектура - логиката е там, където е данната.
//! Фрактална система от микро-агенти с евентуална съгласуваност.
//!
//! ## Ключови концепции:
//! - **Mist Nodes**: Микро-агенти живеещи във всяко устройство
//! - **CRDT**: Conflict-free Replicated Data Types за съгласуваност без координатор
//! - **Swarm Intelligence**: Рояк от независими единици с обща цел

use crate::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicU64, Ordering};

/// Глобален брояч за уникални ID-та на нодове
static NODE_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Ниво на фракталната йерархия
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum HierarchyLevel {
    /// Сензор - най-ниско ниво, само рефлекси
    Sensor,
    /// Edge - локална обработка
    Edge,
    /// Gateway - тактическо ниво
    Gateway,
    /// Cloud - стратегическо ниво
    Cloud,
    /// Nexus - глобална координация
    Nexus,
}

impl HierarchyLevel {
    pub fn processing_power(&self) -> f64 {
        match self {
            HierarchyLevel::Sensor => 0.1,
            HierarchyLevel::Edge => 0.3,
            HierarchyLevel::Gateway => 0.6,
            HierarchyLevel::Cloud => 0.9,
            HierarchyLevel::Nexus => 1.0,
        }
    }
}

/// G-Counter CRDT (Grow-only Counter)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GCounter {
    /// Локални броячи за всеки node_id
    counts: HashMap<u64, u64>,
}

impl GCounter {
    pub fn new() -> Self {
        Self {
            counts: HashMap::new(),
        }
    }

    /// Инкрементира за даден нод
    pub fn increment(&mut self, node_id: u64) {
        *self.counts.entry(node_id).or_insert(0) += 1;
    }

    /// Връща общата стойност
    pub fn value(&self) -> u64 {
        self.counts.values().sum()
    }

    /// Обединява с друг G-Counter (вземаме максимума за всеки нод)
    pub fn merge(&mut self, other: &GCounter) {
        for (&node_id, &count) in &other.counts {
            let current = self.counts.entry(node_id).or_insert(0);
            *current = (*current).max(count);
        }
    }
}

/// LWW-Register CRDT (Last-Writer-Wins Register)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LWWRegister<T: Clone> {
    value: T,
    timestamp: u64,
    node_id: u64,
}

impl<T: Clone + Default> LWWRegister<T> {
    pub fn new(value: T, node_id: u64) -> Self {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);

        Self {
            value,
            timestamp,
            node_id,
        }
    }

    pub fn update(&mut self, value: T, node_id: u64) {
        let new_timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);

        if new_timestamp > self.timestamp {
            self.value = value;
            self.timestamp = new_timestamp;
            self.node_id = node_id;
        }
    }

    pub fn get(&self) -> &T {
        &self.value
    }

    pub fn merge(&mut self, other: &LWWRegister<T>) {
        if other.timestamp > self.timestamp {
            self.value = other.value.clone();
            self.timestamp = other.timestamp;
            self.node_id = other.node_id;
        }
    }
}

/// OR-Set CRDT (Observed-Remove Set)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ORSet<T: Clone + Eq + std::hash::Hash> {
    /// Елементи с уникални тагове
    elements: HashMap<T, HashSet<(u64, u64)>>, // element -> set of (node_id, timestamp)
    /// Премахнати тагове
    tombstones: HashSet<(u64, u64)>,
}

impl<T: Clone + Eq + std::hash::Hash> ORSet<T> {
    pub fn new() -> Self {
        Self {
            elements: HashMap::new(),
            tombstones: HashSet::new(),
        }
    }

    pub fn add(&mut self, element: T, node_id: u64) {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);

        let tag = (node_id, timestamp);
        self.elements
            .entry(element)
            .or_insert_with(HashSet::new)
            .insert(tag);
    }

    pub fn remove(&mut self, element: &T) {
        if let Some(tags) = self.elements.get(element) {
            for tag in tags {
                self.tombstones.insert(*tag);
            }
        }
    }

    pub fn contains(&self, element: &T) -> bool {
        if let Some(tags) = self.elements.get(element) {
            for tag in tags {
                if !self.tombstones.contains(tag) {
                    return true;
                }
            }
        }
        false
    }

    pub fn to_vec(&self) -> Vec<T> {
        self.elements
            .iter()
            .filter(|(_, tags)| tags.iter().any(|tag| !self.tombstones.contains(tag)))
            .map(|(element, _)| element.clone())
            .collect()
    }

    pub fn merge(&mut self, other: &ORSet<T>) {
        // Обединяваме елементите
        for (element, tags) in &other.elements {
            let entry = self
                .elements
                .entry(element.clone())
                .or_insert_with(HashSet::new);
            entry.extend(tags);
        }

        // Обединяваме tombstones
        self.tombstones.extend(&other.tombstones);
    }
}

/// Съобщение между нодове
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MistMessage {
    /// Heartbeat за проверка на живота
    Heartbeat { node_id: u64, timestamp: u64 },
    /// Синхронизация на състояние
    StateSync {
        from_node: u64,
        state_hash: [u8; 32],
    },
    /// Задача за изпълнение
    Task {
        task_id: u64,
        payload: Vec<u8>,
        priority: u8,
    },
    /// Резултат от задача
    TaskResult {
        task_id: u64,
        result: Vec<u8>,
        success: bool,
    },
    /// Гласуване за консенсус
    Vote {
        topic: String,
        value: bool,
        node_id: u64,
    },
}

/// Mist Node - единица в разпределената система
#[derive(Debug)]
pub struct MistNode {
    /// Уникален идентификатор
    pub id: u64,
    /// Ниво в йерархията
    pub level: HierarchyLevel,
    /// Локално състояние (ключ-стойност)
    state: DashMap<String, Vec<u8>>,
    /// Свързани съседи
    neighbors: DashMap<u64, HierarchyLevel>,
    /// Опашка от съобщения за обработка
    message_queue: crossbeam_queue::SegQueue<MistMessage>,
    /// CRDT брояч за събития
    event_counter: std::sync::RwLock<GCounter>,
    /// Флаг дали нодът е активен
    active: std::sync::atomic::AtomicBool,
}

impl MistNode {
    pub fn new(level: HierarchyLevel) -> Self {
        let id = NODE_COUNTER.fetch_add(1, Ordering::SeqCst);

        println!("🌐 [MIST] Created node {} at level {:?}", id, level);

        Self {
            id,
            level,
            state: DashMap::new(),
            neighbors: DashMap::new(),
            message_queue: crossbeam_queue::SegQueue::new(),
            event_counter: std::sync::RwLock::new(GCounter::new()),
            active: std::sync::atomic::AtomicBool::new(true),
        }
    }

    /// Свързва с друг нод
    pub fn connect(&self, neighbor_id: u64, level: HierarchyLevel) {
        self.neighbors.insert(neighbor_id, level);
        println!(
            "🔗 [MIST] Node {} connected to node {} ({:?})",
            self.id, neighbor_id, level
        );
    }

    /// Получава съобщение
    pub fn receive(&self, message: MistMessage) {
        self.message_queue.push(message);
    }

    /// Обработва следващото съобщение
    pub fn process_next(&self) -> Option<MistMessage> {
        if let Some(msg) = self.message_queue.pop() {
            match &msg {
                MistMessage::Heartbeat { node_id, timestamp } => {
                    println!(
                        "💓 [MIST] Node {} received heartbeat from {} at {}",
                        self.id, node_id, timestamp
                    );
                }
                MistMessage::StateSync {
                    from_node,
                    state_hash,
                } => {
                    println!(
                        "🔄 [MIST] Node {} syncing state from {} (hash: {:?})",
                        self.id,
                        from_node,
                        &state_hash[..4]
                    );
                }
                MistMessage::Task {
                    task_id, priority, ..
                } => {
                    println!(
                        "📋 [MIST] Node {} processing task {} (priority: {})",
                        self.id, task_id, priority
                    );
                    if let Ok(mut counter) = self.event_counter.write() {
                        counter.increment(self.id);
                    }
                }
                MistMessage::TaskResult {
                    task_id, success, ..
                } => {
                    println!(
                        "✅ [MIST] Node {} received result for task {}: {}",
                        self.id,
                        task_id,
                        if *success { "SUCCESS" } else { "FAILED" }
                    );
                }
                MistMessage::Vote {
                    topic,
                    value,
                    node_id,
                } => {
                    println!(
                        "🗳️ [MIST] Node {} received vote on '{}': {} from {}",
                        self.id, topic, value, node_id
                    );
                }
            }
            Some(msg)
        } else {
            None
        }
    }

    /// Записва локално състояние
    pub fn set_state(&self, key: &str, value: Vec<u8>) {
        self.state.insert(key.to_string(), value);
    }

    /// Чете локално състояние
    pub fn get_state(&self, key: &str) -> Option<Vec<u8>> {
        self.state.get(key).map(|v| v.clone())
    }

    /// Генерира heartbeat съобщение
    pub fn heartbeat(&self) -> MistMessage {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);

        MistMessage::Heartbeat {
            node_id: self.id,
            timestamp,
        }
    }

    /// Деактивира нода
    pub fn shutdown(&self) {
        self.active.store(false, Ordering::SeqCst);
        println!("🛑 [MIST] Node {} shutting down", self.id);
    }

    pub fn is_active(&self) -> bool {
        self.active.load(Ordering::SeqCst)
    }
}

/// Mist Swarm - рояк от нодове
pub struct MistSwarm {
    /// Всички нодове в роя
    nodes: DashMap<u64, Arc<MistNode>>,
    /// Глобален CRDT регистър
    global_state: std::sync::RwLock<HashMap<String, LWWRegister<String>>>,
}

impl MistSwarm {
    pub fn new() -> Self {
        Self {
            nodes: DashMap::new(),
            global_state: std::sync::RwLock::new(HashMap::new()),
        }
    }

    /// Добавя нов нод към роя
    pub fn spawn_node(&self, level: HierarchyLevel) -> u64 {
        let node = Arc::new(MistNode::new(level));
        let id = node.id;
        self.nodes.insert(id, node);

        println!(
            "🐝 [SWARM] Spawned node {} ({:?}). Total: {} nodes",
            id,
            level,
            self.nodes.len()
        );

        id
    }

    /// Свързва два нода
    pub fn connect_nodes(&self, node_a: u64, node_b: u64) {
        if let (Some(a), Some(b)) = (self.nodes.get(&node_a), self.nodes.get(&node_b)) {
            a.connect(node_b, b.level);
            b.connect(node_a, a.level);
        }
    }

    /// Изпраща съобщение до нод
    pub fn send(&self, to_node: u64, message: MistMessage) {
        if let Some(node) = self.nodes.get(&to_node) {
            node.receive(message);
        }
    }

    /// Broadcast съобщение до всички нодове
    pub fn broadcast(&self, message: MistMessage) {
        for entry in self.nodes.iter() {
            entry.value().receive(message.clone());
        }
        println!("📢 [SWARM] Broadcast to {} nodes", self.nodes.len());
    }

    /// Изпълнява един цикъл на всички нодове
    pub fn tick(&self) {
        for entry in self.nodes.iter() {
            let node = entry.value();
            if node.is_active() {
                while node.process_next().is_some() {}
            }
        }
    }

    /// Събира гласове за консенсус
    pub fn consensus(&self, topic: &str) -> bool {
        let mut votes_for = 0;
        let mut votes_against = 0;
        let threshold = (self.nodes.len() as f64 * 0.66).ceil() as usize;

        // Симулираме гласуване от всички нодове
        for entry in self.nodes.iter() {
            let vote = entry.value().level.processing_power() > 0.5;
            if vote {
                votes_for += 1;
            } else {
                votes_against += 1;
            }
        }

        let result = votes_for >= threshold;
        println!(
            "🗳️ [SWARM] Consensus on '{}': {} (for: {}, against: {}, threshold: {})",
            topic, result, votes_for, votes_against, threshold
        );

        result
    }

    /// Създава фрактална йерархия
    pub fn create_fractal_hierarchy(&self, sensors: usize, edges: usize, gateways: usize) {
        println!("🏗️ [SWARM] Creating fractal hierarchy...");

        // Създаваме Nexus (централен координатор)
        let nexus_id = self.spawn_node(HierarchyLevel::Nexus);

        // Създаваме Cloud нодове
        let cloud_id = self.spawn_node(HierarchyLevel::Cloud);
        self.connect_nodes(nexus_id, cloud_id);

        // Създаваме Gateway нодове
        let mut gateway_ids = Vec::new();
        for _ in 0..gateways {
            let gw_id = self.spawn_node(HierarchyLevel::Gateway);
            self.connect_nodes(cloud_id, gw_id);
            gateway_ids.push(gw_id);
        }

        // Създаваме Edge нодове
        let mut edge_ids = Vec::new();
        for (i, _) in (0..edges).enumerate() {
            let edge_id = self.spawn_node(HierarchyLevel::Edge);
            let gw_id = gateway_ids[i % gateway_ids.len()];
            self.connect_nodes(gw_id, edge_id);
            edge_ids.push(edge_id);
        }

        // Създаваме Sensor нодове
        for (i, _) in (0..sensors).enumerate() {
            let sensor_id = self.spawn_node(HierarchyLevel::Sensor);
            let edge_id = edge_ids[i % edge_ids.len()];
            self.connect_nodes(edge_id, sensor_id);
        }

        println!("✅ [SWARM] Fractal hierarchy created: 1 Nexus, 1 Cloud, {} Gateways, {} Edges, {} Sensors",
                 gateways, edges, sensors);
    }

    /// Връща брой активни нодове
    pub fn active_count(&self) -> usize {
        self.nodes.iter().filter(|e| e.value().is_active()).count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gcounter() {
        let mut counter1 = GCounter::new();
        let mut counter2 = GCounter::new();

        counter1.increment(1);
        counter1.increment(1);
        counter2.increment(2);

        assert_eq!(counter1.value(), 2);
        assert_eq!(counter2.value(), 1);

        counter1.merge(&counter2);
        assert_eq!(counter1.value(), 3);
    }

    #[test]
    fn test_lww_register() {
        let mut reg1 = LWWRegister::new("initial".to_string(), 1);

        std::thread::sleep(std::time::Duration::from_millis(1));

        let mut reg2 = LWWRegister::new("updated".to_string(), 2);

        reg1.merge(&reg2);
        assert_eq!(reg1.get(), "updated");
    }

    #[test]
    fn test_or_set() {
        let mut set: ORSet<String> = ORSet::new();

        set.add("apple".to_string(), 1);
        set.add("banana".to_string(), 2);

        assert!(set.contains(&"apple".to_string()));
        assert!(set.contains(&"banana".to_string()));

        set.remove(&"apple".to_string());
        assert!(!set.contains(&"apple".to_string()));
        assert!(set.contains(&"banana".to_string()));
    }

    #[test]
    fn test_mist_swarm() {
        let swarm = MistSwarm::new();

        let node1 = swarm.spawn_node(HierarchyLevel::Cloud);
        let node2 = swarm.spawn_node(HierarchyLevel::Edge);

        swarm.connect_nodes(node1, node2);

        // Изпращаме съобщение
        swarm.send(
            node2,
            MistMessage::Task {
                task_id: 1,
                payload: vec![1, 2, 3],
                priority: 5,
            },
        );

        swarm.tick();

        assert_eq!(swarm.active_count(), 2);
    }

    #[test]
    fn test_fractal_hierarchy() {
        let swarm = MistSwarm::new();
        swarm.create_fractal_hierarchy(10, 3, 2);

        // 1 Nexus + 1 Cloud + 2 Gateways + 3 Edges + 10 Sensors = 17
        assert_eq!(swarm.active_count(), 17);
    }
}
