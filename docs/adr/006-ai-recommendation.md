# ADR 006-ai-recommendation: Explainable Complementary Team Matching Engine

## Context
Traditional team discovery matches purely on identical skills, leading to unbalanced hackathon teams (e.g. 4 ML engineers, 0 frontend/designers).

## Decision
Build a weighted complementarity formula: 30% Skill Complementarity (filling missing roles), 20% Interest, 15% Role, 15% Availability, 10% Experience, 10% Working Style. All recommendations return human-readable explanations.

## Alternatives Considered
Naive cosine similarity on raw profiles without role requirements.

## Consequences & Trade-offs
Increases hackathon project completion rates and helps introvert students discover teammates without cold messaging.
