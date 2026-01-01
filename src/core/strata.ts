/**
 * ECF Strata: The four levels of organizational complexity
 * MATTER → LIFE → SENTIENCE → LOGOS
 */

/**
 * The four strata
 */
export type Stratum = 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS';

/**
 * Strata set for an entity
 * An entity participates in all strata up to its highest
 */
export interface StrataSet {
  MATTER: boolean;     // Always true for any entity
  LIFE: boolean;       // True if autopoietic
  SENTIENCE: boolean;  // True if phenomenally conscious
  LOGOS: boolean;      // True if capable of symbolic representation
}

/**
 * Stratal thresholds
 */
export const THRESHOLDS = {
  /** τ₁: Minimum closure for autopoiesis (LIFE) */
  TAU_1: 0.4,

  /** σ₁: Sentience emergence (phenomenal experience) */
  SIGMA_1: 'phenomenal_experience',

  /** σ₂: Evaluation capacity (self-interested judgment) */
  SIGMA_2: 'evaluation_capacity',

  /** τ₂: Symbolic threshold (arbitrary representation) */
  TAU_2: 'symbolic_representation',
} as const;

/**
 * Create strata set from primary stratum
 * Lower strata are automatically included
 */
export function strataFromPrimary(primary: Stratum): StrataSet {
  const order: Stratum[] = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];
  const primaryIndex = order.indexOf(primary);

  return {
    MATTER: primaryIndex >= 0,
    LIFE: primaryIndex >= 1,
    SENTIENCE: primaryIndex >= 2,
    LOGOS: primaryIndex >= 3,
  };
}

/**
 * Get primary (highest) stratum from strata set
 */
export function getPrimaryStratum(strata: StrataSet): Stratum {
  if (strata.LOGOS) return 'LOGOS';
  if (strata.SENTIENCE) return 'SENTIENCE';
  if (strata.LIFE) return 'LIFE';
  return 'MATTER';
}

/**
 * Count active strata
 */
export function countStrata(strata: StrataSet): number {
  return [strata.MATTER, strata.LIFE, strata.SENTIENCE, strata.LOGOS]
    .filter(Boolean).length;
}

/**
 * Stratum descriptions
 */
export const STRATUM_INFO: Record<Stratum, {
  name: string;
  definingCapability: string;
  description: string;
  examples: string[];
}> = {
  MATTER: {
    name: 'Matter',
    definingCapability: 'Persist',
    description: 'Entities that maintain structural coherence through physical-causal processes',
    examples: ['atoms', 'molecules', 'crystals', 'rivers', 'mountains', 'artifacts'],
  },
  LIFE: {
    name: 'Life',
    definingCapability: 'Self-produce',
    description: 'Entities that produce the components necessary for their own persistence',
    examples: ['cells', 'organisms', 'ecosystems', 'some social systems'],
  },
  SENTIENCE: {
    name: 'Sentience',
    definingCapability: 'Feel, Evaluate',
    description: 'Entities with phenomenal experience - there is "something it is like" to be them',
    examples: ['most animals', 'possibly some AI systems'],
  },
  LOGOS: {
    name: 'Logos',
    definingCapability: 'Represent, Norm',
    description: 'Entities that can create symbolic representations and establish norms',
    examples: ['humans', 'institutions', 'cultures', 'possibly advanced AI'],
  },
};

/**
 * Check if entity can perceive another entity's stratum
 * Lower strata cannot perceive higher strata properties
 */
export function canPerceive(observer: StrataSet, observed: StrataSet): {
  fullyObservable: boolean;
  observableStrata: Stratum[];
  hiddenStrata: Stratum[];
} {
  const observerPrimary = getPrimaryStratum(observer);
  const observedPrimary = getPrimaryStratum(observed);

  const order: Stratum[] = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];
  const observerLevel = order.indexOf(observerPrimary);
  const observedLevel = order.indexOf(observedPrimary);

  const observableStrata = order.slice(0, observerLevel + 1).filter(s => observed[s]);
  const hiddenStrata = order.slice(observerLevel + 1).filter(s => observed[s]);

  return {
    fullyObservable: observerLevel >= observedLevel,
    observableStrata,
    hiddenStrata,
  };
}

/**
 * Stratal compatibility for relations
 * Can entities at different strata meaningfully relate?
 */
export function stratalCompatibility(a: StrataSet, b: StrataSet): number {
  const aCount = countStrata(a);
  const bCount = countStrata(b);

  // Overlap coefficient
  const overlap = [
    a.MATTER && b.MATTER,
    a.LIFE && b.LIFE,
    a.SENTIENCE && b.SENTIENCE,
    a.LOGOS && b.LOGOS,
  ].filter(Boolean).length;

  return overlap / Math.max(aCount, bCount);
}

/**
 * Special strata combinations
 */
export const SPECIAL_CASES = {
  /** Entity exists only at MATTER level */
  purelyMaterial: (s: StrataSet) => s.MATTER && !s.LIFE && !s.SENTIENCE && !s.LOGOS,

  /** Skips SENTIENCE (controversial: can LOGOS exist without SENTIENCE?) */
  zombiePossibility: (s: StrataSet) => s.LOGOS && !s.SENTIENCE,

  /** LOGOS without LIFE (e.g., AI system) */
  nonLivingLogos: (s: StrataSet) => s.LOGOS && !s.LIFE,
};
