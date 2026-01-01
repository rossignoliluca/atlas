/**
 * AXIS Validator
 *
 * Validates generated code against the 10 foundational axioms.
 * This is the guardian that ensures Atlas never violates its core principles.
 *
 * THE AXIOMS ARE FROZEN. They cannot be modified by generated code.
 */

import { GeneratedCode, AxiomJustification } from './code-generator';
import { Gap } from './gap-analyzer';

/**
 * Axiom definition
 */
export interface Axiom {
  id: string;
  name: string;
  statement: string;
  checkable: boolean;  // Can we programmatically check this?
  criticalFor: string[];  // Which generation types must respect this
}

/**
 * The 10 Foundational Axioms + Meta-Axiom
 */
export const AXIOMS: Axiom[] = [
  {
    id: 'A1',
    name: 'Entity Axiom',
    statement: 'An entity is a difference that maintains itself and makes a difference.',
    checkable: false,
    criticalFor: ['domain'],
  },
  {
    id: 'A2',
    name: 'Configuration Axiom',
    statement: 'Every entity E has a configuration Config(E) = { C, S, Σ, K, R, U }',
    checkable: true,
    criticalFor: ['domain', 'capability'],
  },
  {
    id: 'A3',
    name: 'Closure-Scope Trade-off',
    statement: 'High Closure (C) and high Scope (S) create tension.',
    checkable: true,
    criticalFor: ['domain'],
  },
  {
    id: 'A4',
    name: 'Stratal Nesting',
    statement: 'Higher strata presuppose and include lower strata: LOGOS ⊃ SENTIENCE ⊃ LIFE ⊃ MATTER',
    checkable: true,
    criticalFor: ['capability', 'domain'],
  },
  {
    id: 'A5',
    name: 'Capability Emergence',
    statement: 'Each stratum enables new capabilities. Capabilities are cumulative.',
    checkable: true,
    criticalFor: ['capability'],
  },
  {
    id: 'A6',
    name: 'Geometric Completeness',
    statement: 'Any entity can be fully characterized through the six geometries.',
    checkable: false,
    criticalFor: [],
  },
  {
    id: 'A7',
    name: 'Observer Entanglement',
    statement: 'Characterization depends on observer perspective.',
    checkable: false,
    criticalFor: [],
  },
  {
    id: 'A8',
    name: 'Boundary Constructivism',
    statement: 'Boundaries are drawn, not found.',
    checkable: false,
    criticalFor: ['domain'],
  },
  {
    id: 'A9',
    name: 'Temporal Identity',
    statement: 'Entity identity persists through change via continuity of organization.',
    checkable: false,
    criticalFor: [],
  },
  {
    id: 'A10',
    name: 'Minimal Characterization',
    statement: 'Prefer simpler characterizations over complex ones.',
    checkable: true,
    criticalFor: ['domain', 'capability', 'relation'],
  },
];

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  score: number;  // 0-1, overall compliance score
  violations: AxiomViolation[];
  warnings: AxiomWarning[];
  passed: string[];  // Axiom IDs that passed
  requiresHumanReview: boolean;
  reviewReasons: string[];
}

/**
 * A violation of an axiom (blocking)
 */
export interface AxiomViolation {
  axiomId: string;
  axiomName: string;
  description: string;
  severity: 'error' | 'fatal';
  suggestedFix?: string;
}

/**
 * A warning about potential axiom tension (non-blocking)
 */
export interface AxiomWarning {
  axiomId: string;
  axiomName: string;
  description: string;
  requiresReview: boolean;
}

/**
 * AXIS Validator
 */
export class AxisValidator {
  private axioms: Map<string, Axiom>;

  constructor() {
    this.axioms = new Map(AXIOMS.map(a => [a.id, a]));
  }

  /**
   * Validate generated code against axioms
   */
  validate(generated: GeneratedCode): ValidationResult {
    const violations: AxiomViolation[] = [];
    const warnings: AxiomWarning[] = [];
    const passed: string[] = [];
    const reviewReasons: string[] = [];

    // Get relevant axioms for this generation type
    const relevantAxioms = AXIOMS.filter(a =>
      a.criticalFor.includes(generated.type) || a.criticalFor.length === 0
    );

    // Check each relevant axiom
    for (const axiom of relevantAxioms) {
      const result = this.checkAxiom(axiom, generated);

      if (result.violated) {
        violations.push({
          axiomId: axiom.id,
          axiomName: axiom.name,
          description: result.reason,
          severity: result.fatal ? 'fatal' : 'error',
          suggestedFix: result.suggestedFix,
        });
      } else if (result.warning) {
        warnings.push({
          axiomId: axiom.id,
          axiomName: axiom.name,
          description: result.reason,
          requiresReview: result.requiresReview,
        });
        if (result.requiresReview) {
          reviewReasons.push(`${axiom.id}: ${result.reason}`);
        }
      } else {
        passed.push(axiom.id);
      }
    }

    // Also validate the self-provided justification
    const justificationIssues = this.validateJustification(generated.axiomJustification);
    warnings.push(...justificationIssues);

    // Calculate score
    const totalChecks = relevantAxioms.length;
    const passedChecks = passed.length;
    const warningPenalty = warnings.filter(w => w.requiresReview).length * 0.1;
    const score = Math.max(0, (passedChecks / totalChecks) - warningPenalty);

    return {
      valid: violations.length === 0,
      score,
      violations,
      warnings,
      passed,
      requiresHumanReview: reviewReasons.length > 0 || violations.some(v => v.severity === 'error'),
      reviewReasons,
    };
  }

  /**
   * Check a specific axiom
   */
  private checkAxiom(axiom: Axiom, generated: GeneratedCode): {
    violated: boolean;
    warning: boolean;
    reason: string;
    fatal: boolean;
    requiresReview: boolean;
    suggestedFix?: string;
  } {
    switch (axiom.id) {
      case 'A2':
        return this.checkA2Configuration(generated);
      case 'A3':
        return this.checkA3ClosureScope(generated);
      case 'A4':
        return this.checkA4StratalNesting(generated);
      case 'A5':
        return this.checkA5CapabilityEmergence(generated);
      case 'A10':
        return this.checkA10MinimalCharacterization(generated);
      default:
        // Non-checkable axioms pass with a review note
        return {
          violated: false,
          warning: !axiom.checkable,
          reason: axiom.checkable ? 'Passed' : `${axiom.name} requires human judgment`,
          fatal: false,
          requiresReview: !axiom.checkable && axiom.criticalFor.includes(generated.type),
        };
    }
  }

  /**
   * A2: Every entity must have Config(E) = { C, S, Σ, K, R, U }
   */
  private checkA2Configuration(generated: GeneratedCode): {
    violated: boolean;
    warning: boolean;
    reason: string;
    fatal: boolean;
    requiresReview: boolean;
    suggestedFix?: string;
  } {
    if (generated.type === 'domain') {
      // Domain must specify typical Config values
      const hasTypicalClosure = generated.code.includes('typicalClosure');
      const hasTypicalScope = generated.code.includes('typicalScope');

      if (!hasTypicalClosure || !hasTypicalScope) {
        return {
          violated: true,
          warning: false,
          reason: 'Domain must specify typicalClosure and typicalScope (A2: Config requirement)',
          fatal: false,
          requiresReview: false,
          suggestedFix: 'Add typicalClosure: number and typicalScope: number to domain definition',
        };
      }
    }

    return {
      violated: false,
      warning: false,
      reason: 'Config requirements satisfied',
      fatal: false,
      requiresReview: false,
    };
  }

  /**
   * A3: High Closure and high Scope create tension
   */
  private checkA3ClosureScope(generated: GeneratedCode): {
    violated: boolean;
    warning: boolean;
    reason: string;
    fatal: boolean;
    requiresReview: boolean;
    suggestedFix?: string;
  } {
    if (generated.type === 'domain') {
      // Extract typical values from code
      const closureMatch = generated.code.match(/typicalClosure:\s*([\d.]+)/);
      const scopeMatch = generated.code.match(/typicalScope:\s*([\d.]+)/);

      if (closureMatch && scopeMatch) {
        const closure = parseFloat(closureMatch[1]);
        const scope = parseFloat(scopeMatch[1]);

        // High closure + high scope is unusual (tension)
        if (closure > 0.7 && scope > 0.7) {
          return {
            violated: false,  // Not a violation, but a tension
            warning: true,
            reason: `Domain has both high closure (${closure}) and high scope (${scope}). This creates A3 tension. Verify this is intentional.`,
            fatal: false,
            requiresReview: true,
          };
        }
      }
    }

    return {
      violated: false,
      warning: false,
      reason: 'Closure-Scope relationship is reasonable',
      fatal: false,
      requiresReview: false,
    };
  }

  /**
   * A4: Higher strata presuppose lower strata
   */
  private checkA4StratalNesting(generated: GeneratedCode): {
    violated: boolean;
    warning: boolean;
    reason: string;
    fatal: boolean;
    requiresReview: boolean;
    suggestedFix?: string;
  } {
    if (generated.type === 'capability') {
      // Check that emergentFrom stratum is valid
      const emergentMatch = generated.code.match(/emergentFrom:\s*['"](\w+)['"]/);

      if (emergentMatch) {
        const stratum = emergentMatch[1];
        const validStrata = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];

        if (!validStrata.includes(stratum)) {
          return {
            violated: true,
            warning: false,
            reason: `Invalid stratum "${stratum}". Must be one of: ${validStrata.join(', ')}`,
            fatal: true,
            requiresReview: false,
            suggestedFix: `Use a valid stratum: ${validStrata.join(', ')}`,
          };
        }

        // Check requires field respects nesting
        const requiresMatch = generated.code.match(/requires:\s*\[(.*?)\]/s);
        if (requiresMatch) {
          const stratumIndex = validStrata.indexOf(stratum);
          const requiredCapabilities = this.getRequiredCapabilitiesForStratum(stratumIndex);

          // Verify all required capabilities are listed
          for (const required of requiredCapabilities) {
            if (!requiresMatch[1].includes(required)) {
              return {
                violated: false,
                warning: true,
                reason: `Capability at ${stratum} stratum should require ${required} (lower stratum capability)`,
                fatal: false,
                requiresReview: true,
              };
            }
          }
        }
      }
    }

    if (generated.type === 'domain') {
      // Check compatibleStrata respects nesting
      const strataMatch = generated.code.match(/compatibleStrata:\s*\[(.*?)\]/s);

      if (strataMatch) {
        const strata = strataMatch[1].match(/'(\w+)'/g)?.map(s => s.replace(/'/g, '')) || [];
        const validOrder = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];

        // Check for gaps in nesting
        let highestIdx = -1;
        for (const s of strata) {
          const idx = validOrder.indexOf(s);
          if (idx > highestIdx) highestIdx = idx;
        }

        for (let i = 0; i <= highestIdx; i++) {
          if (!strata.includes(validOrder[i])) {
            return {
              violated: true,
              warning: false,
              reason: `Domain compatible with ${validOrder[highestIdx]} must also include ${validOrder[i]} (A4: Stratal Nesting)`,
              fatal: true,
              requiresReview: false,
              suggestedFix: `Add '${validOrder[i]}' to compatibleStrata`,
            };
          }
        }
      }
    }

    return {
      violated: false,
      warning: false,
      reason: 'Stratal nesting respected',
      fatal: false,
      requiresReview: false,
    };
  }

  /**
   * A5: Each stratum enables new capabilities
   */
  private checkA5CapabilityEmergence(generated: GeneratedCode): {
    violated: boolean;
    warning: boolean;
    reason: string;
    fatal: boolean;
    requiresReview: boolean;
    suggestedFix?: string;
  } {
    if (generated.type === 'capability') {
      // Must specify emergentFrom
      if (!generated.code.includes('emergentFrom')) {
        return {
          violated: true,
          warning: false,
          reason: 'Capability must specify emergentFrom stratum (A5: Capability Emergence)',
          fatal: true,
          requiresReview: false,
          suggestedFix: "Add emergentFrom: 'STRATUM' to capability definition",
        };
      }

      // Check it's not duplicating existing capabilities
      const existingCapabilities = ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE', 'REPRESENT', 'NORM'];
      const nameMatch = generated.code.match(/name:\s*['"](\w+)['"]/);

      if (nameMatch && existingCapabilities.includes(nameMatch[1].toUpperCase())) {
        return {
          violated: true,
          warning: false,
          reason: `Capability "${nameMatch[1]}" already exists. Cannot duplicate.`,
          fatal: true,
          requiresReview: false,
        };
      }
    }

    return {
      violated: false,
      warning: false,
      reason: 'Capability emergence rules satisfied',
      fatal: false,
      requiresReview: false,
    };
  }

  /**
   * A10: Prefer simpler characterizations
   */
  private checkA10MinimalCharacterization(generated: GeneratedCode): {
    violated: boolean;
    warning: boolean;
    reason: string;
    fatal: boolean;
    requiresReview: boolean;
    suggestedFix?: string;
  } {
    // Check if this might be reducible to existing constructs

    if (generated.type === 'domain') {
      // Warning if domain is very similar to existing ones
      const existingDomains = ['INERT', 'LIVING', 'SENTIENT', 'SYMBOLIC', 'COLLECTIVE', 'IDEAL', 'EPHEMERAL', 'ARTIFICIAL'];
      const nameMatch = generated.code.match(/name:\s*['"](\w+)['"]/);

      if (nameMatch) {
        const name = nameMatch[1].toUpperCase();
        for (const existing of existingDomains) {
          if (this.stringSimilarity(name, existing) > 0.7) {
            return {
              violated: false,
              warning: true,
              reason: `Domain "${name}" is similar to existing domain "${existing}". Verify it's not reducible (A10: Minimal Characterization)`,
              fatal: false,
              requiresReview: true,
            };
          }
        }
      }
    }

    if (generated.type === 'capability') {
      // Warning if capability might be composite
      if (generated.code.includes(' and ') || generated.code.includes(' or ')) {
        return {
          violated: false,
          warning: true,
          reason: 'Capability description suggests it might be composite. Consider if it can be decomposed (A10)',
          fatal: false,
          requiresReview: true,
        };
      }
    }

    return {
      violated: false,
      warning: false,
      reason: 'Minimal characterization principle respected',
      fatal: false,
      requiresReview: false,
    };
  }

  /**
   * Validate the self-provided axiom justification
   */
  private validateJustification(justification: AxiomJustification): AxiomWarning[] {
    const warnings: AxiomWarning[] = [];

    // Check for low confidence
    if (justification.overallCompliance < 0.7) {
      warnings.push({
        axiomId: 'META',
        axiomName: 'Self-Assessment',
        description: `Generator's self-assessed compliance is low (${justification.overallCompliance.toFixed(2)}). Extra scrutiny recommended.`,
        requiresReview: true,
      });
    }

    // Check for 'needs_review' items
    const needsReview = justification.axioms.filter(a => a.status === 'needs_review');
    for (const item of needsReview) {
      warnings.push({
        axiomId: item.id,
        axiomName: `Self-flagged: ${item.id}`,
        description: item.explanation,
        requiresReview: true,
      });
    }

    return warnings;
  }

  /**
   * Get required capabilities for entities at a given stratum level
   */
  private getRequiredCapabilitiesForStratum(stratumIndex: number): string[] {
    const capabilities = [
      [],                                    // MATTER: none
      ['PERSIST'],                           // LIFE: persist
      ['PERSIST', 'SELF_PRODUCE'],           // SENTIENCE: + self-produce
      ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE'],  // LOGOS: + feel, evaluate
    ];

    return capabilities[stratumIndex] || [];
  }

  /**
   * Simple string similarity (Dice coefficient)
   */
  private stringSimilarity(a: string, b: string): number {
    const aBigrams = this.getBigrams(a.toLowerCase());
    const bBigrams = this.getBigrams(b.toLowerCase());

    const intersection = aBigrams.filter(x => bBigrams.includes(x));
    return (2 * intersection.length) / (aBigrams.length + bBigrams.length);
  }

  private getBigrams(str: string): string[] {
    const bigrams: string[] = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.slice(i, i + 2));
    }
    return bigrams;
  }

  /**
   * Get all axioms
   */
  getAxioms(): Axiom[] {
    return AXIOMS;
  }

  /**
   * Get a specific axiom
   */
  getAxiom(id: string): Axiom | undefined {
    return this.axioms.get(id);
  }
}
