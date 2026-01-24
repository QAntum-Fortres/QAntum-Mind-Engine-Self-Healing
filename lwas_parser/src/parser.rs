use pest::Parser;
use pest_derive::Parser;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Parser)]
#[grammar = "lwas.pest"]
pub struct LwasParser;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AstNode {
    Immortal {
        name: String,
        value: String,
    },
    Body {
        name: String,
        content: String,
    },
    Spirit {
        name: String,
        goal: String,
    },
    Manifold {
        name: String,
        body: Vec<AstNode>,
    },
    Resonate {
        target: String,
        frequency: f64,
    },
    Collapse {
        target: String,
        entropy_threshold: f64,
    },
    Entrench {
        key: String,
        value: EntrenchValue,
    },
    Magnet {
        label: String,
        power: f64,
    },
    Department {
        name: String,
        priority: f64,
    },
    Reflect,
    Axiom {
        name: String,
        expression: String,
    },
    Causality {
        cause: String,
        effect: String,
        c_type: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EntrenchValue {
    Vector(Vec<f32>),
    String(String),
    Number(f32),
}

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("Parsing error: {0}")]
    Pest(#[from] pest::error::Error<Rule>),
}

pub fn parse_soul(input: &str) -> Result<Vec<AstNode>, ParseError> {
    let mut pairs = LwasParser::parse(Rule::program, input)?;
    let program_pair = pairs.next().unwrap();
    Ok(parse_statements(program_pair.into_inner()))
}

fn parse_statements(pairs: pest::iterators::Pairs<Rule>) -> Vec<AstNode> {
    let mut ast = Vec::new();
    for pair in pairs {
        match pair.as_rule() {
            Rule::statement => {
                let inner = pair.into_inner().next().unwrap();
                match inner.as_rule() {
                    Rule::immortal_decl => {
                        let mut inner_rules = inner.into_inner();
                        let name = inner_rules.next().unwrap().as_str().to_string();
                        let value = inner_rules
                            .next()
                            .unwrap()
                            .as_str()
                            .trim_matches('"')
                            .to_string();
                        ast.push(AstNode::Immortal { name, value });
                    }
                    Rule::body_block => {
                        let mut inner_rules = inner.into_inner();
                        let name = inner_rules.next().unwrap().as_str().to_string();
                        let content = inner_rules.next().unwrap().as_str().trim().to_string();
                        ast.push(AstNode::Body { name, content });
                    }
                    Rule::spirit_block => {
                        let mut inner_rules = inner.into_inner();
                        let name = inner_rules.next().unwrap().as_str().to_string();
                        let mut goal = String::new();
                        for field in inner_rules {
                            if field.as_rule() == Rule::string_literal {
                                goal = field.as_str().trim_matches('"').to_string();
                                break;
                            }
                        }
                        ast.push(AstNode::Spirit { name, goal });
                    }
                    Rule::manifold_block => {
                        let mut inner_rules = inner.into_inner();
                        let name = inner_rules.next().unwrap().as_str().to_string();
                        let body = parse_statements(inner_rules);
                        ast.push(AstNode::Manifold { name, body });
                    }
                    Rule::resonate_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let target = inner_rules.next().unwrap().as_str().to_string();
                        let frequency = inner_rules
                            .next()
                            .map(|n| n.as_str().parse::<f64>().unwrap_or(1.0))
                            .unwrap_or(1.0);
                        ast.push(AstNode::Resonate { target, frequency });
                    }
                    Rule::collapse_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let target = inner_rules.next().unwrap().as_str().to_string();
                        let entropy_threshold = inner_rules
                            .next()
                            .map(|n| n.as_str().parse::<f64>().unwrap_or(0.5))
                            .unwrap_or(0.5);
                        ast.push(AstNode::Collapse {
                            target,
                            entropy_threshold,
                        });
                    }
                    Rule::entrench_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let key = inner_rules.next().unwrap().as_str().to_string();
                        let val_pair = inner_rules.next().unwrap();
                        let value = match val_pair.as_rule() {
                            Rule::vector => {
                                let vec = val_pair
                                    .into_inner()
                                    .map(|n| n.as_str().parse::<f32>().unwrap_or(0.0))
                                    .collect();
                                EntrenchValue::Vector(vec)
                            }
                            Rule::string_literal => EntrenchValue::String(
                                val_pair.as_str().trim_matches('"').to_string(),
                            ),
                            Rule::number => EntrenchValue::Number(
                                val_pair.as_str().parse::<f32>().unwrap_or(0.0),
                            ),
                            _ => EntrenchValue::String("".into()),
                        };
                        ast.push(AstNode::Entrench { key, value });
                    }
                    Rule::magnet_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let label = inner_rules
                            .next()
                            .unwrap()
                            .as_str()
                            .trim_matches('"')
                            .to_string();
                        let power = inner_rules
                            .next()
                            .map(|n| n.as_str().parse::<f64>().unwrap_or(1.0))
                            .unwrap_or(1.0);
                        ast.push(AstNode::Magnet { label, power });
                    }
                    Rule::department_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let name = inner_rules.next().unwrap().as_str().to_string();
                        let priority = inner_rules
                            .next()
                            .map(|n| n.as_str().parse::<f64>().unwrap_or(1.0))
                            .unwrap_or(1.0);
                        ast.push(AstNode::Department { name, priority });
                    }
                    Rule::reflection_stmt => {
                        ast.push(AstNode::Reflect);
                    }
                    Rule::axiom_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let name = inner_rules.next().unwrap().as_str().to_string();
                        let expression = inner_rules
                            .next()
                            .unwrap()
                            .as_str()
                            .trim_matches('"')
                            .to_string();
                        ast.push(AstNode::Axiom { name, expression });
                    }
                    Rule::causality_stmt => {
                        let mut inner_rules = inner.into_inner();
                        let cause = inner_rules.next().unwrap().as_str().to_string();
                        let effect = inner_rules.next().unwrap().as_str().to_string();
                        let c_type = inner_rules.next().unwrap().as_str().to_string();
                        ast.push(AstNode::Causality {
                            cause,
                            effect,
                            c_type,
                        });
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }
    ast
}
