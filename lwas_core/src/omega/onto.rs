use crate::prelude::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AxiomType {
    Ontological,
    Logical,
    Causal,
    Temporal,
    Meta,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CausalityType {
    Efficient,
    Formal,
    Material,
    Final,
    Retrocausal,
    Quantum,
    Emergent,
    Acausal,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Axiom {
    pub id: Uuid,
    pub f_type: AxiomType,
    pub expression: String,
    pub coherence_score: f64,
}

pub struct SovereignOntoEngine {
    pub axioms: Arc<DashMap<Uuid, Axiom>>,
    pub reality_matrix: Arc<VectorSpaceHeap>,
}

impl SovereignOntoEngine {
    pub fn new(vsh: Arc<VectorSpaceHeap>) -> Self {
        Self {
            axioms: Arc::new(DashMap::new()),
            reality_matrix: vsh,
        }
    }

    /// ГЕНЕЗИС: Инжектира първична аксиома директно в 2-та милиарда точки
    pub fn manifest_axiom(&self, expression: &str, a_type: AxiomType) -> SovereignResult<Uuid> {
        let id = Uuid::new_v4();
        let axiom = Axiom {
            id,
            f_type: a_type,
            expression: expression.to_string(),
            coherence_score: 1.0,
        };

        self.axioms.insert(id, axiom);

        // Математическо втвърдяване (Entrenchment) в VSH
        let vector = self.project_expression_to_vector(expression);
        self.reality_matrix
            .allocate(format!("AXIOM:{}", expression), vector);

        println!(
            "⚖️ ONTO-ENGINE: AXIOM MANIFESTED: {} ({:?})",
            expression, id
        );
        Ok(id)
    }

    /// СИНТЕЗ: Създава нова логическа реалност в VSH
    pub fn synthesize_reality(&self, name: &str) -> SovereignResult<()> {
        println!("🌀 ONTO-ENGINE: SYNTHESIZING REALITY '{}'...", name);

        // Инстанциране на Онтологична Аксиома (Existence)
        let _ = self.manifest_axiom("∃x: x = x", AxiomType::Ontological)?;

        // Мапване на Аксиомата към 2-та милиарда точки
        self.reality_matrix
            .allocate(format!("REALITY_ROOT:{}", name), vec![1.0; 128]);

        Ok(())
    }

    fn project_expression_to_vector(&self, expr: &str) -> Vec<f32> {
        // 128-измерна проекция на логическото намерение
        let mut v = vec![0.0f32; 128];
        for (i, b) in expr.as_bytes().iter().enumerate() {
            v[i % 128] += (*b as f32) / 255.0;
        }
        v
    }
}
