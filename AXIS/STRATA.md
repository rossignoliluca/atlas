# AXIS: The Four Strata

**Status: FROZEN**

The four strata represent levels of organizational complexity, each emerging from and nested within the previous.

---

## Overview

```
LOGOS       ────────────────────────────────────  τ₂ (symbol threshold)
            ↑ Represent, Norm
SENTIENCE   ────────────────────────────────────  σ₂ (evaluation threshold)
            ↑ Feel, Evaluate
LIFE        ────────────────────────────────────  τ₁ (autopoiesis threshold)
            ↑ Self-produce
MATTER      ────────────────────────────────────
            ↑ Persist
```

---

## S1: MATTER (Persistence)

**Defining Capability**: Persist

**Description**: Entities that maintain structural coherence through physical-causal processes.

**Threshold**: None (baseline)

**Examples**:
- Atoms, molecules, crystals
- Rivers, mountains, stars
- Artifacts (without users)

**Characteristic**: Maintains itself through physical laws, not through self-produced processes.

---

## S2: LIFE (Self-Production)

**Defining Capability**: Self-produce (autopoiesis)

**Description**: Entities that produce the components necessary for their own persistence.

**Threshold**: τ₁ (autopoietic closure)

**Condition**: `C(E) ≥ τ₁` where C is closure (degree of self-production)

**Examples**:
- Cells, organisms
- Ecosystems
- Some social systems (with caveats)

**Characteristic**: Metabolic cycle that produces its own components. Identity through organization, not structure.

---

## S3: SENTIENCE (Feeling)

**Defining Capability**: Feel, Evaluate

**Description**: Entities with phenomenal experience - there is "something it is like" to be them.

**Threshold**: σ₁ (sentience threshold)

**Condition**: Phenomenal experience present; can feel pleasure/pain, attraction/aversion.

**Examples**:
- Animals (most)
- Possibly some AI systems (uncertain)
- Questionable: plants, single cells

**Characteristic**: Subjective experience. Evaluation of states as good/bad for self.

---

## S4: LOGOS (Representation)

**Defining Capability**: Represent, Norm

**Description**: Entities that can create and manipulate symbolic representations, and establish norms.

**Threshold**: τ₂ (symbolic threshold)

**Condition**: Can create arbitrary symbols, reason about abstractions, establish "ought" from "is".

**Examples**:
- Humans
- Some collectives (institutions, cultures)
- Possibly advanced AI systems

**Characteristic**: Language, abstraction, normativity. Can represent things that don't exist. Can bind themselves to rules.

---

## Nesting Principle

Strata are nested, not exclusive:

```
LOGOS entities are also SENTIENT, LIVING, and MATERIAL
SENTIENT entities are also LIVING and MATERIAL
LIVING entities are also MATERIAL
MATTER entities are just MATERIAL
```

An entity's stratum is the HIGHEST level it achieves.

---

## Strata Set Σ(E)

For any entity E, we can identify which strata it participates in:

```typescript
Σ(E) = {
  MATTER: true,                    // Always
  LIFE: C(E) ≥ τ₁,                // If autopoietic
  SENTIENCE: hasPhenomenalExperience(E),
  LOGOS: canRepresentAndNorm(E)
}
```

---

## Thresholds

| Threshold | Name | Meaning |
|-----------|------|---------|
| τ₁ | Autopoiesis | Minimal self-production for life |
| σ₁ | Sentience | Emergence of phenomenal experience |
| σ₂ | Evaluation | Capacity for self-interested judgment |
| τ₂ | Symbolic | Capacity for arbitrary representation |

The exact values of thresholds are matters of ongoing investigation. They may not be sharp boundaries but fuzzy transitions.

---

## Invariant

Every entity belongs to exactly one primary stratum (its highest), but participates in all lower strata. Stratal ascent requires new capabilities, not just more complexity.
