# Atlas

**Entity Characterization Framework (ECF) v0.1**

A framework for characterizing any entity through Closure, Scope, and Strata.

---

## What is Atlas?

Atlas is an **autopoietic framework** for understanding and characterizing any entity - from atoms to ecosystems, from thoughts to institutions, from tools to traditions.

**Core Insight**: An entity is *a difference that maintains itself and makes a difference*.

---

## Core Concepts

### Config(E) = { C, S, Σ, K, R, U }

Every entity has a configuration:

| Symbol | Name | Range | Meaning |
|--------|------|-------|---------|
| **C** | Closure | [0,1] | Degree of self-production |
| **S** | Scope | [0,∞) | Extent of relevance field |
| **Σ** | Strata | Set | Which organizational levels |
| **K** | Capabilities | Set | What it can do |
| **R** | Relations | Graph | Connections to other entities |
| **U** | Uncertainty | [0,1] | Confidence in characterization |

### The Four Strata

```
LOGOS       ────────  Represent, Norm
SENTIENCE   ────────  Feel, Evaluate
LIFE        ────────  Self-produce
MATTER      ────────  Persist
```

Each stratum enables new capabilities. Higher strata include lower ones.

### The Six Geometries

1. **Distinction** (G1): Where does E end?
2. **Transformation** (G2): What processes maintain E?
3. **Inclusion** (G3): What is E part of?
4. **Connection** (G4): What is E connected to?
5. **Reflexion** (G5): How does E know itself?
6. **Quality** (G6): What does E value?

### The Eight Domains

| Domain | Description | Examples |
|--------|-------------|----------|
| INERT | Non-living natural | rocks, water, stars |
| LIVING | Biological | cells, plants, ecosystems |
| SENTIENT | Conscious | animals, humans |
| SYMBOLIC | Cultural | languages, stories, art |
| COLLECTIVE | Institutional | companies, nations |
| IDEAL | Abstract | numbers, logical laws |
| EPHEMERAL | Event-like | conversations, dreams |
| ARTIFICIAL | Human-made | tools, software, AI |

---

## Autopoietic Nature

Atlas can characterize itself:

```typescript
Config(Atlas) = {
  C: 0.45,  // Partially self-producing
  S: 0.8,   // Universal scope (any entity)
  Σ: { MATTER: true, LOGOS: true },
  K: { PERSIST, REPRESENT, NORM }
}
```

Atlas extends itself through **four protocols**:

- **Protocol A**: Characterize new entity
- **Protocol B**: Explore boundary disputes
- **Protocol C**: Integrate wisdom traditions
- **Protocol D**: Apply to practical problems

---

## Structure

```
atlas/
├── AXIS/                    # Frozen core (invariant)
│   ├── GEOMETRIES.md        # The six geometries
│   ├── STRATA.md            # The four strata
│   └── AXIOMS.md            # Foundational principles
├── src/
│   ├── core/                # TypeScript types
│   │   ├── types.ts         # Entity, Config
│   │   ├── axes.ts          # Closure, Scope
│   │   ├── strata.ts        # MATTER→LIFE→SENTIENCE→LOGOS
│   │   ├── capabilities.ts  # 6 capabilities
│   │   ├── domains.ts       # 8 domains
│   │   └── modes.ts         # 4 modes
│   ├── catalog/             # 60+ characterized entities
│   ├── protocols/           # 4 autopoietic protocols
│   └── wisdom/              # Wisdom tradition mappings
└── docs/                    # Documentation
```

---

## Quick Start

```typescript
import { createEntity, ATLAS_SELF, CATALOG } from './src/core';
import { getEntity, getEntitiesByDomain } from './src/catalog';

// Get Atlas's self-characterization
console.log(ATLAS_SELF.config.closure); // 0.45

// Find all living entities
const living = getEntitiesByDomain('LIVING');

// Create a new entity
const myEntity = createEntity('coffee', 'Coffee', {
  closure: 0.1,
  scope: 0.3,
  primaryStratum: 'MATTER',
  domain: 'ARTIFICIAL',
});
```

---

## Entity Catalog

The catalog contains 60+ pre-characterized entities:

| Domain | Count | Examples |
|--------|-------|----------|
| INERT | 7 | rock, water, star |
| LIVING | 7 | cell, tree, ecosystem |
| SENTIENT | 7 | dog, octopus, human |
| SYMBOLIC | 7 | language, myth, meme |
| COLLECTIVE | 8 | family, nation, religion |
| IDEAL | 5 | number, logical law |
| EPHEMERAL | 6 | conversation, dream |
| ARTIFICIAL | 8 | tool, software, AI |

---

## Wisdom Traditions

Atlas integrates insights from:

- **Buddhism**: Skandha, consciousnesses
- **Sāṃkhya**: 25 Tattva
- **Kabbalah**: 10 Sefirot
- **Neoplatonism**: Hypostases
- **Taoism**: Yin-Yang, Wu Xing
- **Sufism**: Nafs, Qalb, Ruh
- **Aristotle**: Hylomorphism
- **Stoicism**: Prohairesis
- **Indigenous traditions**: Various

Each tradition is mapped to ECF vocabulary while preserving its unique contributions.

---

## Theoretical Background

Atlas draws on:

- **Autopoiesis** (Maturana/Varela): Self-producing systems
- **Spencer-Brown**: Laws of Form, distinction
- **Luhmann**: Social systems theory
- **Varela**: Enaction, embodied cognition
- **Process philosophy**: Whitehead, Bergson

---

## License

MIT

---

## Contributing

Atlas is designed to be extended. Use Protocol A to characterize new entities, Protocol C to integrate new wisdom traditions.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
