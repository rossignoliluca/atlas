/**
 * ECF Axes: Closure and Scope
 * The two primary dimensions of entity characterization
 */

/**
 * C: Closure [0,1]
 * Degree to which an entity produces the conditions of its own persistence.
 *
 * C = 0: Fully dependent on external factors (e.g., artifact without user)
 * C = 1: Fully self-producing (theoretical limit, never achieved)
 *
 * @example
 * - Rock: C ≈ 0.05 (persists through physical properties, not self-production)
 * - Cell: C ≈ 0.7 (produces most of its own components)
 * - Human: C ≈ 0.6 (high but needs food, air, society)
 * - Company: C ≈ 0.4 (produces some conditions, depends on market)
 */
export type Closure = number; // [0, 1]

/**
 * S: Scope [0,∞)
 * Extent of an entity's field of relevance.
 * Combines spatial, temporal, and relational reach.
 *
 * S = 0: Point-like, momentary, isolated
 * S → ∞: Universal, eternal, connected to everything
 *
 * @example
 * - Mayfly: S ≈ 0.1 (small, brief, local)
 * - Tree: S ≈ 0.4 (fixed location, long-lived, ecosystem role)
 * - Human: S ≈ 0.6 (mobile, decades, social networks)
 * - Nation: S ≈ 0.8 (large territory, centuries, global relations)
 * - Universe: S → 1.0 (everything, always, all connections)
 */
export type Scope = number; // [0, ∞), typically normalized to [0, 1]

/**
 * Validate closure value
 */
export function validateClosure(c: number): Closure {
  if (c < 0 || c > 1) {
    throw new Error(`Closure must be in [0,1], got ${c}`);
  }
  return c;
}

/**
 * Validate scope value
 */
export function validateScope(s: number): Scope {
  if (s < 0) {
    throw new Error(`Scope must be >= 0, got ${s}`);
  }
  return s;
}

/**
 * Closure-Scope tension
 * High C and high S create opposing demands:
 * - High C requires tight boundaries → reduces S
 * - High S requires openness → reduces C
 *
 * Returns tension value [0,1] where 1 = maximum tension
 */
export function closureScopeTension(c: Closure, s: Scope): number {
  // Normalized tension: high when both C and S are high
  const normalizedS = Math.min(s, 1); // Cap at 1 for calculation
  return c * normalizedS;
}

/**
 * Closure categories
 */
export type ClosureCategory =
  | 'MINIMAL'    // C < 0.2: Almost no self-production
  | 'LOW'        // C < 0.4: Mostly dependent
  | 'MODERATE'   // C < 0.6: Mixed
  | 'HIGH'       // C < 0.8: Mostly self-producing
  | 'MAXIMAL';   // C >= 0.8: Highly autonomous

/**
 * Categorize closure value
 */
export function categorizeClosure(c: Closure): ClosureCategory {
  if (c < 0.2) return 'MINIMAL';
  if (c < 0.4) return 'LOW';
  if (c < 0.6) return 'MODERATE';
  if (c < 0.8) return 'HIGH';
  return 'MAXIMAL';
}

/**
 * Scope categories
 */
export type ScopeCategory =
  | 'POINT'      // S < 0.2: Minimal reach
  | 'LOCAL'      // S < 0.4: Local effects
  | 'REGIONAL'   // S < 0.6: Regional influence
  | 'GLOBAL'     // S < 0.8: Global presence
  | 'UNIVERSAL'; // S >= 0.8: Universal scope

/**
 * Categorize scope value
 */
export function categorizeScope(s: Scope): ScopeCategory {
  if (s < 0.2) return 'POINT';
  if (s < 0.4) return 'LOCAL';
  if (s < 0.6) return 'REGIONAL';
  if (s < 0.8) return 'GLOBAL';
  return 'UNIVERSAL';
}

/**
 * Examples of C-S configurations
 */
export const EXAMPLES = {
  // Low C, Low S
  rock: { closure: 0.05, scope: 0.1, description: 'Passive, local' },

  // Low C, High S
  internet: { closure: 0.3, scope: 0.95, description: 'Dependent but global' },

  // High C, Low S
  hermit: { closure: 0.7, scope: 0.15, description: 'Self-sufficient but isolated' },

  // High C, High S (tension)
  empire: { closure: 0.5, scope: 0.85, description: 'Strives for both, unstable' },

  // Moderate both
  human: { closure: 0.6, scope: 0.6, description: 'Balanced' },
} as const;
