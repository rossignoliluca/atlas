/**
 * ECF Characterizer
 *
 * Applies the Entity Characterization Framework to extracted entities.
 * Uses LLM for semantic understanding, validates against AXIS axioms.
 */

import { Entity, EntityConfiguration, Geometry } from '../core/types';
import { Closure, Scope, validateClosure, validateScope } from '../core/axes';
import { StrataSet, strataFromPrimary, Stratum, getPrimaryStratum } from '../core/strata';
import { CapabilitySet, getStratumCapabilities, createCapabilitySet, isConsistentCapabilitySet } from '../core/capabilities';
import { Domain, DOMAIN_INFO } from '../core/domains';
import { ModeConfiguration, validateModeConfiguration } from '../core/modes';
import { ExtractedEntity, ExtractedRelation } from './index';

/**
 * LLM configuration for characterization
 */
export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  extractionModel: string;
  characterizationModel: string;
  productionModel: string;
}

/**
 * Characterization result
 */
export interface CharacterizationResult {
  entity: Entity;
  evidence: Evidence[];
  uncertainty: number;
  validation: ValidationResult;
}

/**
 * Evidence for characterization
 */
export interface Evidence {
  type: 'text' | 'relation' | 'inference';
  content: string;
  supports: string; // What aspect it supports
  confidence: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  violations: AxiomViolation[];
  warnings: string[];
}

/**
 * Axiom violation
 */
export interface AxiomViolation {
  axiom: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * ECF Characterizer
 * Transforms extracted entities into fully characterized ECF entities
 */
export class ECFCharacterizer {
  constructor(
    private llmConfig: LLMConfig,
    private validator: AxiomValidator
  ) {}

  /**
   * Characterize an extracted entity
   */
  async characterize(
    extracted: ExtractedEntity,
    relations: ExtractedRelation[]
  ): Promise<CharacterizationResult> {
    // Step 1: Determine domain
    const domain = await this.determineDomain(extracted);

    // Step 2: Determine strata
    const strata = await this.determineStrata(extracted, domain);

    // Step 3: Estimate closure
    const closure = await this.estimateClosure(extracted, relations);

    // Step 4: Estimate scope
    const scope = await this.estimateScope(extracted, relations);

    // Step 5: Get capabilities from strata
    const capabilities = this.deriveCapabilities(strata);

    // Step 6: Determine modes
    const modes = await this.determineModes(extracted, domain);

    // Step 7: Build entity
    const entity: Entity = {
      id: this.generateId(extracted.name),
      name: extracted.name,
      domain,
      modes,
      config: {
        closure: validateClosure(closure.value),
        scope: validateScope(scope.value),
        strata,
        capabilities,
        relations: this.mapRelations(extracted.name, relations),
        uncertainty: this.calculateOverallUncertainty([
          closure.uncertainty,
          scope.uncertainty,
          domain.uncertainty || 0.3,
        ]),
      },
    };

    // Step 8: Validate
    const validation = this.validator.validate(entity);

    // Step 9: Collect evidence
    const evidence = this.collectEvidence(extracted, relations, {
      domain,
      strata,
      closure,
      scope,
    });

    return {
      entity,
      evidence,
      uncertainty: entity.config.uncertainty,
      validation,
    };
  }

  /**
   * Determine domain using LLM
   */
  private async determineDomain(
    extracted: ExtractedEntity
  ): Promise<Domain & { uncertainty?: number }> {
    // In production, this would call LLM
    // For now, use heuristics

    const name = extracted.name.toLowerCase();
    const context = extracted.context.toLowerCase();

    // Simple heuristics (replace with LLM in production)
    if (this.matchesPatterns(context, ['cell', 'organism', 'species', 'biological', 'living'])) {
      return 'LIVING';
    }
    if (this.matchesPatterns(context, ['animal', 'conscious', 'brain', 'perceive', 'feel'])) {
      return 'SENTIENT';
    }
    if (this.matchesPatterns(context, ['language', 'symbol', 'meaning', 'culture', 'text'])) {
      return 'SYMBOLIC';
    }
    if (this.matchesPatterns(context, ['organization', 'institution', 'company', 'nation', 'group'])) {
      return 'COLLECTIVE';
    }
    if (this.matchesPatterns(context, ['number', 'mathematical', 'abstract', 'logical', 'theorem'])) {
      return 'IDEAL';
    }
    if (this.matchesPatterns(context, ['event', 'temporary', 'process', 'moment', 'happening'])) {
      return 'EPHEMERAL';
    }
    if (this.matchesPatterns(context, ['tool', 'machine', 'software', 'artificial', 'designed'])) {
      return 'ARTIFICIAL';
    }

    return 'INERT'; // Default
  }

  /**
   * Determine strata based on domain and context
   */
  private async determineStrata(
    extracted: ExtractedEntity,
    domain: Domain
  ): Promise<StrataSet> {
    // Map domain to typical primary stratum
    const domainToStratum: Record<Domain, Stratum> = {
      INERT: 'MATTER',
      LIVING: 'LIFE',
      SENTIENT: 'SENTIENCE',
      SYMBOLIC: 'LOGOS',
      COLLECTIVE: 'LOGOS',
      IDEAL: 'LOGOS',
      EPHEMERAL: 'MATTER', // Default, but varies
      ARTIFICIAL: 'MATTER', // Unless AI
    };

    let primaryStratum = domainToStratum[domain];

    // Adjust based on context
    const context = extracted.context.toLowerCase();
    if (domain === 'ARTIFICIAL' && this.matchesPatterns(context, ['AI', 'intelligent', 'learns', 'decides'])) {
      primaryStratum = 'LOGOS';
    }
    if (domain === 'EPHEMERAL' && this.matchesPatterns(context, ['conscious', 'experience', 'felt'])) {
      primaryStratum = 'SENTIENCE';
    }

    return strataFromPrimary(primaryStratum);
  }

  /**
   * Estimate closure (degree of self-production)
   */
  private async estimateClosure(
    extracted: ExtractedEntity,
    relations: ExtractedRelation[]
  ): Promise<{ value: number; uncertainty: number }> {
    const context = extracted.context.toLowerCase();

    // Indicators of high closure
    const highClosureIndicators = [
      'self-producing', 'autonomous', 'self-maintaining', 'autopoietic',
      'self-organizing', 'self-regulating', 'homeostatic', 'self-sufficient',
    ];

    // Indicators of low closure
    const lowClosureIndicators = [
      'depends on', 'requires', 'needs', 'passive', 'inert',
      'artifact', 'made by', 'created by', 'designed',
    ];

    let closureScore = 0.5; // Start neutral
    let indicatorCount = 0;

    for (const indicator of highClosureIndicators) {
      if (context.includes(indicator)) {
        closureScore += 0.1;
        indicatorCount++;
      }
    }

    for (const indicator of lowClosureIndicators) {
      if (context.includes(indicator)) {
        closureScore -= 0.1;
        indicatorCount++;
      }
    }

    // Check relations for dependency patterns
    const dependencies = relations.filter(r =>
      r.source === extracted.name && r.type === 'depends_on'
    );
    closureScore -= dependencies.length * 0.05;

    // Clamp to valid range
    closureScore = Math.max(0, Math.min(1, closureScore));

    // Uncertainty is higher with fewer indicators
    const uncertainty = indicatorCount > 3 ? 0.2 : indicatorCount > 1 ? 0.4 : 0.6;

    return { value: closureScore, uncertainty };
  }

  /**
   * Estimate scope (field of relevance)
   */
  private async estimateScope(
    extracted: ExtractedEntity,
    relations: ExtractedRelation[]
  ): Promise<{ value: number; uncertainty: number }> {
    const context = extracted.context.toLowerCase();

    // Indicators of high scope
    const highScopeIndicators = [
      'universal', 'global', 'everywhere', 'all', 'ubiquitous',
      'fundamental', 'eternal', 'infinite', 'cosmic',
    ];

    // Indicators of low scope
    const lowScopeIndicators = [
      'local', 'specific', 'particular', 'brief', 'momentary',
      'microscopic', 'individual', 'singular', 'isolated',
    ];

    let scopeScore = 0.5;
    let indicatorCount = 0;

    for (const indicator of highScopeIndicators) {
      if (context.includes(indicator)) {
        scopeScore += 0.1;
        indicatorCount++;
      }
    }

    for (const indicator of lowScopeIndicators) {
      if (context.includes(indicator)) {
        scopeScore -= 0.1;
        indicatorCount++;
      }
    }

    // More relations generally means higher scope
    const relationCount = relations.filter(r =>
      r.source === extracted.name || r.target === extracted.name
    ).length;
    scopeScore += Math.min(relationCount * 0.02, 0.2);

    scopeScore = Math.max(0, Math.min(1, scopeScore));
    const uncertainty = indicatorCount > 3 ? 0.2 : indicatorCount > 1 ? 0.4 : 0.6;

    return { value: scopeScore, uncertainty };
  }

  /**
   * Derive capabilities from strata
   */
  private deriveCapabilities(strata: StrataSet): CapabilitySet {
    const primary = getPrimaryStratum(strata);
    return createCapabilitySet(getStratumCapabilities(primary));
  }

  /**
   * Determine modes
   */
  private async determineModes(
    extracted: ExtractedEntity,
    domain: Domain
  ): Promise<ModeConfiguration> {
    const domainInfo = DOMAIN_INFO[domain];
    const context = extracted.context.toLowerCase();

    // Default modes based on domain
    const modes: ModeConfiguration = {
      composition: 'COMPOSITE',
      origin: 'NATURAL',
      temporality: 'PERSISTENT',
      localization: 'LOCATED',
    };

    // Adjust based on context
    if (context.includes('abstract') || context.includes('mathematical')) {
      modes.composition = 'VIRTUAL';
      modes.localization = 'NOWHERE';
    }
    if (context.includes('designed') || context.includes('created') || context.includes('built')) {
      modes.origin = 'DESIGNED';
    }
    if (context.includes('evolved') || context.includes('natural selection')) {
      modes.origin = 'EVOLVED';
    }
    if (context.includes('emerged') || context.includes('spontaneous')) {
      modes.origin = 'EMERGED';
    }
    if (context.includes('brief') || context.includes('temporary') || context.includes('ephemeral')) {
      modes.temporality = 'MOMENTARY';
    }
    if (context.includes('distributed') || context.includes('network') || context.includes('spread')) {
      modes.localization = 'DISTRIBUTED';
    }

    return modes;
  }

  /**
   * Map extracted relations to entity relations
   */
  private mapRelations(
    entityName: string,
    relations: ExtractedRelation[]
  ): Entity['config']['relations'] {
    return relations
      .filter(r => r.source === entityName)
      .map(r => ({
        targetId: this.generateId(r.target),
        type: this.mapRelationType(r.type),
        strength: r.confidence,
        description: r.evidence,
      }));
  }

  /**
   * Map extracted relation type to ECF relation type
   */
  private mapRelationType(type: string): Entity['config']['relations'][0]['type'] {
    const typeMap: Record<string, Entity['config']['relations'][0]['type']> = {
      'is part of': 'part_of',
      'part of': 'part_of',
      'contains': 'contains',
      'depends on': 'depends_on',
      'produces': 'produces',
      'observes': 'observes',
      'transforms': 'transforms',
      'connects to': 'connects_to',
      'inherits from': 'inherits_from',
      'is instance of': 'instantiates',
    };

    return typeMap[type.toLowerCase()] || 'connects_to';
  }

  /**
   * Calculate overall uncertainty from component uncertainties
   */
  private calculateOverallUncertainty(uncertainties: number[]): number {
    // Use max uncertainty (most uncertain component dominates)
    return Math.max(...uncertainties);
  }

  /**
   * Collect evidence for the characterization
   */
  private collectEvidence(
    extracted: ExtractedEntity,
    relations: ExtractedRelation[],
    determinations: any
  ): Evidence[] {
    const evidence: Evidence[] = [];

    // Text evidence
    evidence.push({
      type: 'text',
      content: extracted.context,
      supports: 'overall characterization',
      confidence: extracted.confidence,
    });

    // Relation evidence
    for (const rel of relations) {
      if (rel.source === extracted.name || rel.target === extracted.name) {
        evidence.push({
          type: 'relation',
          content: `${rel.source} --${rel.type}--> ${rel.target}`,
          supports: rel.source === extracted.name ? 'scope/relations' : 'context',
          confidence: rel.confidence,
        });
      }
    }

    return evidence;
  }

  /**
   * Generate ID from name
   */
  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Check if context matches any patterns
   */
  private matchesPatterns(context: string, patterns: string[]): boolean {
    return patterns.some(p => context.includes(p.toLowerCase()));
  }
}

/**
 * Axiom Validator
 * Ensures characterizations conform to AXIS invariants
 */
export class AxiomValidator {
  /**
   * Validate an entity against all axioms
   */
  validate(entity: Entity): ValidationResult {
    const violations: AxiomViolation[] = [];
    const warnings: string[] = [];

    // A4: Stratal Nesting
    this.validateStratalNesting(entity, violations);

    // A5: Capability Emergence
    this.validateCapabilityConsistency(entity, violations);

    // A3: Closure-Scope Tension
    this.validateClosureScopeTension(entity, warnings);

    // Mode coherence
    this.validateModeCoherence(entity, warnings);

    return {
      valid: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      warnings,
    };
  }

  /**
   * A4: Stratal Nesting - higher strata include lower
   */
  private validateStratalNesting(entity: Entity, violations: AxiomViolation[]): void {
    const { strata } = entity.config;

    // If LOGOS, must have all lower
    if (strata.LOGOS && (!strata.MATTER)) {
      violations.push({
        axiom: 'A4',
        message: 'LOGOS stratum requires MATTER',
        severity: 'error',
      });
    }

    // If SENTIENCE, must have LIFE and MATTER
    if (strata.SENTIENCE && (!strata.LIFE || !strata.MATTER)) {
      violations.push({
        axiom: 'A4',
        message: 'SENTIENCE stratum requires LIFE and MATTER',
        severity: 'error',
      });
    }

    // If LIFE, must have MATTER
    if (strata.LIFE && !strata.MATTER) {
      violations.push({
        axiom: 'A4',
        message: 'LIFE stratum requires MATTER',
        severity: 'error',
      });
    }

    // Note: LOGOS without SENTIENCE is controversial but allowed (e.g., AI)
    // LOGOS without LIFE is allowed (e.g., AI, institutions)
  }

  /**
   * A5: Capability Emergence - capabilities must match strata
   */
  private validateCapabilityConsistency(entity: Entity, violations: AxiomViolation[]): void {
    const { strata, capabilities } = entity.config;

    // SELF_PRODUCE requires LIFE
    if (capabilities.has('SELF_PRODUCE') && !strata.LIFE) {
      violations.push({
        axiom: 'A5',
        message: 'SELF_PRODUCE capability requires LIFE stratum',
        severity: 'error',
      });
    }

    // FEEL/EVALUATE requires SENTIENCE
    if ((capabilities.has('FEEL') || capabilities.has('EVALUATE')) && !strata.SENTIENCE) {
      violations.push({
        axiom: 'A5',
        message: 'FEEL/EVALUATE capabilities require SENTIENCE stratum',
        severity: 'error',
      });
    }

    // REPRESENT/NORM requires LOGOS
    if ((capabilities.has('REPRESENT') || capabilities.has('NORM')) && !strata.LOGOS) {
      violations.push({
        axiom: 'A5',
        message: 'REPRESENT/NORM capabilities require LOGOS stratum',
        severity: 'error',
      });
    }

    // Check prerequisite chain
    if (!isConsistentCapabilitySet(capabilities)) {
      violations.push({
        axiom: 'A5',
        message: 'Capability prerequisites not satisfied',
        severity: 'error',
      });
    }
  }

  /**
   * A3: Closure-Scope Tension - flag unusual combinations
   */
  private validateClosureScopeTension(entity: Entity, warnings: string[]): void {
    const { closure, scope } = entity.config;

    // Very high closure + very high scope is unusual
    if (closure > 0.8 && scope > 0.8) {
      warnings.push('High closure (>0.8) + high scope (>0.8) creates tension; verify this is intentional');
    }

    // Very low closure + very high scope might indicate dependency
    if (closure < 0.2 && scope > 0.8) {
      warnings.push('Low closure (<0.2) + high scope (>0.8) is unusual; entity may be highly dependent');
    }
  }

  /**
   * Mode coherence checks
   */
  private validateModeCoherence(entity: Entity, warnings: string[]): void {
    const { modes } = entity;
    const validation = validateModeConfiguration(modes);

    for (const warning of validation.warnings) {
      warnings.push(warning);
    }
  }
}
