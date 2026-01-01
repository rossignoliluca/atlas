/**
 * Gap Analyzer
 *
 * Analyzes the knowledge graph to find:
 * - Entities that don't fit well in existing domains
 * - Missing capabilities for observed behaviors
 * - Patterns suggesting new relations needed
 * - Coverage gaps in scientific sources
 */

import { Entity } from '../core/types';
import { Domain } from '../core/domains';
import { Stratum, StrataSet } from '../core/strata';
import { Capability } from '../core/capabilities';

/**
 * Types of gaps that can be detected
 */
export type GapType =
  | 'domain_misfit'        // Entity doesn't fit any domain well
  | 'capability_missing'   // Behavior observed but no capability for it
  | 'relation_pattern'     // Recurring relation not in vocabulary
  | 'stratum_boundary'     // Entity at boundary between strata
  | 'source_coverage'      // Scientific domain poorly covered
  | 'axiom_tension'        // Near-violation of axiom (needs attention)
  | 'clustering_anomaly';  // Entity cluster suggests new category

/**
 * A detected gap in the framework
 */
export interface Gap {
  id: string;
  type: GapType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: GapEvidence[];
  suggestedAction: SuggestedAction;
  detectedAt: Date;
}

/**
 * Evidence supporting a gap detection
 */
export interface GapEvidence {
  entityId?: string;
  entityName?: string;
  metric: string;
  value: number;
  threshold: number;
  context: string;
}

/**
 * Suggested action to resolve a gap
 */
export interface SuggestedAction {
  type: 'new_domain' | 'new_capability' | 'new_relation' | 'new_connector' | 'axiom_review' | 'manual_review';
  description: string;
  parameters: Record<string, any>;
  confidence: number;
}

/**
 * Analysis result
 */
export interface GapAnalysisResult {
  timestamp: Date;
  entitiesAnalyzed: number;
  gaps: Gap[];
  summary: {
    byType: Record<GapType, number>;
    bySeverity: Record<string, number>;
    totalGaps: number;
  };
}

/**
 * Configuration for gap analysis
 */
export interface GapAnalyzerConfig {
  /** Minimum confidence to flag as gap */
  confidenceThreshold: number;
  /** Minimum entities with pattern to suggest new domain */
  domainMinClusterSize: number;
  /** Maximum fit score to consider misfit */
  domainMisfitThreshold: number;
  /** Minimum occurrences to suggest new relation */
  relationMinOccurrences: number;
}

const DEFAULT_CONFIG: GapAnalyzerConfig = {
  confidenceThreshold: 0.7,
  domainMinClusterSize: 5,
  domainMisfitThreshold: 0.4,
  relationMinOccurrences: 3,
};

/**
 * Gap Analyzer
 */
export class GapAnalyzer {
  private config: GapAnalyzerConfig;
  private gapCounter = 0;

  constructor(config: Partial<GapAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze a set of entities for gaps
   */
  async analyze(entities: Entity[]): Promise<GapAnalysisResult> {
    const gaps: Gap[] = [];

    // 1. Domain misfit analysis
    const domainGaps = this.analyzeDomainMisfits(entities);
    gaps.push(...domainGaps);

    // 2. Capability gaps
    const capabilityGaps = this.analyzeCapabilityGaps(entities);
    gaps.push(...capabilityGaps);

    // 3. Relation patterns
    const relationGaps = this.analyzeRelationPatterns(entities);
    gaps.push(...relationGaps);

    // 4. Stratum boundary anomalies
    const stratumGaps = this.analyzeStratumBoundaries(entities);
    gaps.push(...stratumGaps);

    // 5. Clustering anomalies
    const clusterGaps = this.analyzeClusteringAnomalies(entities);
    gaps.push(...clusterGaps);

    // 6. Axiom tensions
    const axiomGaps = this.analyzeAxiomTensions(entities);
    gaps.push(...axiomGaps);

    // Build summary
    const summary = this.buildSummary(gaps);

    return {
      timestamp: new Date(),
      entitiesAnalyzed: entities.length,
      gaps,
      summary,
    };
  }

  /**
   * Find entities that don't fit well in any domain
   */
  private analyzeDomainMisfits(entities: Entity[]): Gap[] {
    const gaps: Gap[] = [];
    const misfits: Entity[] = [];

    for (const entity of entities) {
      const fitScore = this.calculateDomainFitScore(entity);

      if (fitScore < this.config.domainMisfitThreshold) {
        misfits.push(entity);
      }
    }

    // Group misfits by similarity
    if (misfits.length >= this.config.domainMinClusterSize) {
      const clusters = this.clusterMisfits(misfits);

      for (const cluster of clusters) {
        if (cluster.entities.length >= this.config.domainMinClusterSize) {
          gaps.push({
            id: this.generateGapId(),
            type: 'domain_misfit',
            severity: cluster.entities.length >= 10 ? 'high' : 'medium',
            description: `${cluster.entities.length} entities don't fit existing domains well. Common characteristics: ${cluster.commonFeatures.join(', ')}`,
            evidence: cluster.entities.map(e => ({
              entityId: e.id,
              entityName: e.name,
              metric: 'domain_fit_score',
              value: this.calculateDomainFitScore(e),
              threshold: this.config.domainMisfitThreshold,
              context: `Current domain: ${e.domain}`,
            })),
            suggestedAction: {
              type: 'new_domain',
              description: `Consider creating a new domain for ${cluster.suggestedName}`,
              parameters: {
                suggestedName: cluster.suggestedName,
                characteristics: cluster.commonFeatures,
                exampleEntities: cluster.entities.slice(0, 5).map(e => e.name),
              },
              confidence: Math.min(0.9, 0.5 + cluster.entities.length * 0.05),
            },
            detectedAt: new Date(),
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Find entities with behaviors suggesting missing capabilities
   */
  private analyzeCapabilityGaps(entities: Entity[]): Gap[] {
    const gaps: Gap[] = [];

    // Look for patterns in entity contexts that suggest capabilities
    // not currently in our vocabulary
    const behaviorPatterns = this.extractBehaviorPatterns(entities);

    for (const pattern of behaviorPatterns) {
      if (!this.isExistingCapability(pattern.behavior)) {
        gaps.push({
          id: this.generateGapId(),
          type: 'capability_missing',
          severity: pattern.occurrences >= 10 ? 'high' : 'medium',
          description: `Behavior "${pattern.behavior}" observed in ${pattern.occurrences} entities but no corresponding capability exists`,
          evidence: pattern.entities.slice(0, 5).map(e => ({
            entityId: e.id,
            entityName: e.name,
            metric: 'behavior_occurrence',
            value: 1,
            threshold: 0,
            context: pattern.evidenceContext,
          })),
          suggestedAction: {
            type: 'new_capability',
            description: `Consider adding capability "${pattern.suggestedName}"`,
            parameters: {
              name: pattern.suggestedName,
              description: pattern.behavior,
              emergentFromStratum: pattern.inferredStratum,
              exampleEntities: pattern.entities.slice(0, 5).map(e => e.name),
            },
            confidence: Math.min(0.85, 0.4 + pattern.occurrences * 0.03),
          },
          detectedAt: new Date(),
        });
      }
    }

    return gaps;
  }

  /**
   * Find recurring relation types not in vocabulary
   */
  private analyzeRelationPatterns(entities: Entity[]): Gap[] {
    const gaps: Gap[] = [];
    const relationCounts = new Map<string, { count: number; examples: string[] }>();

    // Count relation types
    for (const entity of entities) {
      for (const rel of entity.config.relations) {
        const existing = relationCounts.get(rel.type) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 5) {
          existing.examples.push(`${entity.name} → ${rel.targetId}`);
        }
        relationCounts.set(rel.type, existing);
      }
    }

    // Check for unknown relation types
    const knownRelations = new Set([
      'contains', 'part_of', 'produces', 'depends_on', 'regulates',
      'is_a', 'instance_of', 'enables', 'inhibits', 'transforms',
    ]);

    for (const [relType, data] of relationCounts) {
      if (!knownRelations.has(relType) && data.count >= this.config.relationMinOccurrences) {
        gaps.push({
          id: this.generateGapId(),
          type: 'relation_pattern',
          severity: data.count >= 10 ? 'medium' : 'low',
          description: `Relation type "${relType}" used ${data.count} times but not in standard vocabulary`,
          evidence: data.examples.map(ex => ({
            metric: 'relation_usage',
            value: data.count,
            threshold: this.config.relationMinOccurrences,
            context: ex,
          })),
          suggestedAction: {
            type: 'new_relation',
            description: `Formalize relation type "${relType}"`,
            parameters: {
              name: relType,
              occurrences: data.count,
              examples: data.examples,
            },
            confidence: 0.6 + Math.min(0.3, data.count * 0.02),
          },
          detectedAt: new Date(),
        });
      }
    }

    return gaps;
  }

  /**
   * Find entities at stratum boundaries
   */
  private analyzeStratumBoundaries(entities: Entity[]): Gap[] {
    const gaps: Gap[] = [];
    const boundaryEntities: Entity[] = [];

    for (const entity of entities) {
      const strataArray = this.getActiveStrata(entity);

      // Check for unusual stratum combinations
      if (this.hasUnusualStratumCombination(strataArray)) {
        boundaryEntities.push(entity);
      }
    }

    if (boundaryEntities.length > 0) {
      gaps.push({
        id: this.generateGapId(),
        type: 'stratum_boundary',
        severity: boundaryEntities.length >= 5 ? 'medium' : 'low',
        description: `${boundaryEntities.length} entities have unusual stratum combinations that may indicate boundary cases`,
        evidence: boundaryEntities.slice(0, 5).map(e => ({
          entityId: e.id,
          entityName: e.name,
          metric: 'stratum_combination',
          value: 1,
          threshold: 0,
          context: `Strata: ${this.getActiveStrata(e).join(', ')}`,
        })),
        suggestedAction: {
          type: 'manual_review',
          description: 'Review stratum assignments for boundary entities',
          parameters: {
            entities: boundaryEntities.map(e => e.name),
          },
          confidence: 0.5,
        },
        detectedAt: new Date(),
      });
    }

    return gaps;
  }

  /**
   * Find clustering anomalies suggesting new categories
   */
  private analyzeClusteringAnomalies(entities: Entity[]): Gap[] {
    const gaps: Gap[] = [];

    // Simple clustering by closure/scope
    const clusters = this.clusterByClosureScope(entities);

    for (const cluster of clusters) {
      // Check if cluster crosses domain boundaries unexpectedly
      const domains = new Set(cluster.entities.map(e => e.domain));

      if (domains.size > 2 && cluster.entities.length >= 5) {
        // Suggest a new domain if cluster is coherent enough
        const suggestedDomainName = this.suggestCrossCuttingDomain(cluster, domains);

        gaps.push({
          id: this.generateGapId(),
          type: 'clustering_anomaly',
          severity: cluster.entities.length >= 8 ? 'high' : 'medium',
          description: `Cluster of ${cluster.entities.length} entities with similar closure/scope spans ${domains.size} domains. Suggests cross-cutting category "${suggestedDomainName}".`,
          evidence: cluster.entities.slice(0, 5).map(e => ({
            entityId: e.id,
            entityName: e.name,
            metric: 'cluster_coherence',
            value: cluster.coherence,
            threshold: 0.7,
            context: `Domain: ${e.domain}, C: ${e.config.closure.toFixed(2)}, S: ${e.config.scope.toFixed(2)}`,
          })),
          suggestedAction: {
            type: cluster.entities.length >= 8 ? 'new_domain' : 'manual_review',
            description: cluster.entities.length >= 8
              ? `Consider creating new domain "${suggestedDomainName}" for this cluster`
              : 'Review whether cluster suggests a cross-cutting category',
            parameters: {
              suggestedName: suggestedDomainName,
              avgClosure: cluster.avgClosure,
              avgScope: cluster.avgScope,
              domains: Array.from(domains),
              characteristics: [
                `closure ~${cluster.avgClosure.toFixed(2)}`,
                `scope ~${cluster.avgScope.toFixed(2)}`,
                `spans ${domains.size} domains: ${Array.from(domains).join(', ')}`,
              ],
              exampleEntities: cluster.entities.slice(0, 5).map(e => e.name),
            },
            confidence: cluster.coherence * 0.8,
          },
          detectedAt: new Date(),
        });
      }
    }

    return gaps;
  }

  /**
   * Find near-violations of axioms
   */
  private analyzeAxiomTensions(entities: Entity[]): Gap[] {
    const gaps: Gap[] = [];

    for (const entity of entities) {
      // A3: Closure-Scope tension
      // FORMAL EXCEPTION: IDEAL domain entities are exempt from A3 (see AXIS/AXIOMS.md)
      // Mathematical objects genuinely have both high C and S without tension
      if (entity.domain === 'IDEAL') {
        // A3 Exception applies - skip entirely, no flagging needed
        // Rationale: IDEAL entities (numbers, logical laws, etc.) are necessary beings
        // that don't maintain themselves against an environment - they simply ARE.
        continue;
      }

      if (entity.config.closure > 0.8 && entity.config.scope > 0.8) {
        // Non-IDEAL entities with high C+S still create tension

        gaps.push({
          id: this.generateGapId(),
          type: 'axiom_tension',
          severity: 'low',
          description: `Entity "${entity.name}" has both high closure (${entity.config.closure.toFixed(2)}) and high scope (${entity.config.scope.toFixed(2)}), creating A3 tension`,
          evidence: [{
            entityId: entity.id,
            entityName: entity.name,
            metric: 'closure_scope_product',
            value: entity.config.closure * entity.config.scope,
            threshold: 0.64,
            context: 'High closure + high scope is unusual (A3)',
          }],
          suggestedAction: {
            type: 'manual_review',
            description: 'Verify if entity truly has both high autonomy and broad relevance',
            parameters: {
              closure: entity.config.closure,
              scope: entity.config.scope,
            },
            confidence: 0.6,
          },
          detectedAt: new Date(),
        });
      }

      // A4: Stratal nesting violation check
      const activeStrata = this.getActiveStrata(entity);
      if (!this.respectsStratalNesting(activeStrata)) {
        gaps.push({
          id: this.generateGapId(),
          type: 'axiom_tension',
          severity: 'critical',
          description: `Entity "${entity.name}" may violate A4 (stratal nesting): has ${activeStrata.join(', ')} but missing required lower strata`,
          evidence: [{
            entityId: entity.id,
            entityName: entity.name,
            metric: 'stratal_nesting',
            value: 0,
            threshold: 1,
            context: `Strata: ${activeStrata.join(' → ')}`,
          }],
          suggestedAction: {
            type: 'axiom_review',
            description: 'Stratal nesting violation - needs immediate review',
            parameters: {
              currentStrata: activeStrata,
              missingStrata: this.getMissingStrata(activeStrata),
            },
            confidence: 0.95,
          },
          detectedAt: new Date(),
        });
      }
    }

    return gaps;
  }

  // ============ Helper Methods ============

  private generateGapId(): string {
    return `gap_${Date.now()}_${++this.gapCounter}`;
  }

  private calculateDomainFitScore(entity: Entity): number {
    // Simple heuristic based on domain characteristics
    // In production, this would use more sophisticated analysis
    const domainCharacteristics: Record<Domain, { typicalClosure: number; typicalScope: number }> = {
      INERT: { typicalClosure: 0.3, typicalScope: 0.2 },
      LIVING: { typicalClosure: 0.7, typicalScope: 0.4 },
      SENTIENT: { typicalClosure: 0.8, typicalScope: 0.5 },
      SYMBOLIC: { typicalClosure: 0.5, typicalScope: 0.7 },
      COLLECTIVE: { typicalClosure: 0.6, typicalScope: 0.8 },
      IDEAL: { typicalClosure: 0.2, typicalScope: 0.9 },
      EPHEMERAL: { typicalClosure: 0.4, typicalScope: 0.3 },
      ARTIFICIAL: { typicalClosure: 0.5, typicalScope: 0.6 },
    };

    const typical = domainCharacteristics[entity.domain];
    if (!typical) return 0.5;

    const closureDiff = Math.abs(entity.config.closure - typical.typicalClosure);
    const scopeDiff = Math.abs(entity.config.scope - typical.typicalScope);

    return 1 - (closureDiff + scopeDiff) / 2;
  }

  private clusterMisfits(entities: Entity[]): Array<{
    entities: Entity[];
    commonFeatures: string[];
    suggestedName: string;
  }> {
    // Simple clustering by closure/scope similarity
    const clusters: Array<{ entities: Entity[]; commonFeatures: string[]; suggestedName: string }> = [];
    const assigned = new Set<string>();

    for (const entity of entities) {
      if (assigned.has(entity.id)) continue;

      const cluster = [entity];
      assigned.add(entity.id);

      for (const other of entities) {
        if (assigned.has(other.id)) continue;

        const closureSimilar = Math.abs(entity.config.closure - other.config.closure) < 0.2;
        const scopeSimilar = Math.abs(entity.config.scope - other.config.scope) < 0.2;

        if (closureSimilar && scopeSimilar) {
          cluster.push(other);
          assigned.add(other.id);
        }
      }

      if (cluster.length >= 2) {
        const avgClosure = cluster.reduce((s, e) => s + e.config.closure, 0) / cluster.length;
        const avgScope = cluster.reduce((s, e) => s + e.config.scope, 0) / cluster.length;

        clusters.push({
          entities: cluster,
          commonFeatures: [
            `closure ~${avgClosure.toFixed(2)}`,
            `scope ~${avgScope.toFixed(2)}`,
          ],
          suggestedName: this.suggestDomainName(avgClosure, avgScope),
        });
      }
    }

    return clusters;
  }

  private suggestDomainName(closure: number, scope: number): string {
    if (closure > 0.7 && scope > 0.7) return 'AUTONOMOUS_EXTENSIVE';
    if (closure > 0.7 && scope < 0.3) return 'AUTONOMOUS_LOCAL';
    if (closure < 0.3 && scope > 0.7) return 'DEPENDENT_EXTENSIVE';
    if (closure < 0.3 && scope < 0.3) return 'DEPENDENT_LOCAL';
    return 'HYBRID';
  }

  private suggestCrossCuttingDomain(
    cluster: { entities: Entity[]; avgClosure: number; avgScope: number; coherence: number },
    domains: Set<string>
  ): string {
    // Analyze the cluster to suggest a meaningful cross-cutting domain name
    const domainsArray = Array.from(domains);

    // Check for common patterns
    const hasLiving = domainsArray.includes('LIVING');
    const hasArtificial = domainsArray.includes('ARTIFICIAL');
    const hasSentient = domainsArray.includes('SENTIENT');
    const hasCollective = domainsArray.includes('COLLECTIVE');
    const hasSymbolic = domainsArray.includes('SYMBOLIC');
    const hasIdeal = domainsArray.includes('IDEAL');

    // Hybrid bio-tech entities
    if (hasLiving && hasArtificial) {
      return 'HYBRID_BIOTECH';
    }

    // Socio-technical systems
    if (hasCollective && hasArtificial) {
      return 'SOCIOTECHNICAL';
    }

    // Cognitive-symbolic entities
    if (hasSentient && hasSymbolic) {
      return 'COGNITIVE';
    }

    // Autonomous agents (living or artificial)
    if (cluster.avgClosure > 0.6 && (hasLiving || hasSentient || hasArtificial)) {
      return 'AUTONOMOUS_AGENT';
    }

    // Distributed/network entities
    if (cluster.avgScope > 0.6 && hasCollective) {
      return 'NETWORKED';
    }

    // Mid-range autonomy entities
    if (cluster.avgClosure > 0.4 && cluster.avgClosure < 0.7) {
      if (cluster.avgScope > 0.5) {
        return 'SEMI_AUTONOMOUS_EXTENSIVE';
      }
      return 'SEMI_AUTONOMOUS';
    }

    // Default based on closure/scope
    return this.suggestDomainName(cluster.avgClosure, cluster.avgScope);
  }

  private extractBehaviorPatterns(entities: Entity[]): Array<{
    behavior: string;
    occurrences: number;
    entities: Entity[];
    suggestedName: string;
    inferredStratum: Stratum;
    evidenceContext: string;
  }> {
    // In production, this would analyze entity contexts for behavioral patterns
    // For now, return empty (would need NLP analysis)
    return [];
  }

  private isExistingCapability(behavior: string): boolean {
    const capabilities = ['persist', 'self_produce', 'feel', 'evaluate', 'represent', 'norm'];
    return capabilities.some(c => behavior.toLowerCase().includes(c));
  }

  private hasUnusualStratumCombination(strata: Stratum[]): boolean {
    // Unusual: has LOGOS but not SENTIENCE, or has SENTIENCE but not LIFE
    const strataSet = new Set(strata);

    if (strataSet.has('LOGOS') && !strataSet.has('SENTIENCE')) return true;
    if (strataSet.has('SENTIENCE') && !strataSet.has('LIFE')) return true;
    if (strataSet.has('LIFE') && !strataSet.has('MATTER')) return true;

    return false;
  }

  private getActiveStrata(entity: Entity): Stratum[] {
    const strata: Stratum[] = [];
    if (entity.config.strata.MATTER) strata.push('MATTER');
    if (entity.config.strata.LIFE) strata.push('LIFE');
    if (entity.config.strata.SENTIENCE) strata.push('SENTIENCE');
    if (entity.config.strata.LOGOS) strata.push('LOGOS');
    return strata;
  }

  private respectsStratalNesting(strata: Stratum[]): boolean {
    const order: Stratum[] = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];
    const strataSet = new Set(strata);

    let foundGap = false;
    let sawHigher = false;

    for (const s of order) {
      if (strataSet.has(s)) {
        if (foundGap) return false; // Gap in nesting
        sawHigher = true;
      } else if (sawHigher) {
        foundGap = true;
      }
    }

    return true;
  }

  private getMissingStrata(strata: Stratum[]): Stratum[] {
    const order: Stratum[] = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];
    const strataSet = new Set(strata);
    const missing: Stratum[] = [];

    const highestIdx = Math.max(...strata.map(s => order.indexOf(s)));

    for (let i = 0; i <= highestIdx; i++) {
      if (!strataSet.has(order[i])) {
        missing.push(order[i]);
      }
    }

    return missing;
  }

  private clusterByClosureScope(entities: Entity[]): Array<{
    entities: Entity[];
    avgClosure: number;
    avgScope: number;
    coherence: number;
  }> {
    // Simple grid-based clustering
    const gridSize = 0.25;
    const grid = new Map<string, Entity[]>();

    for (const entity of entities) {
      const cx = Math.floor(entity.config.closure / gridSize);
      const sx = Math.floor(entity.config.scope / gridSize);
      const key = `${cx},${sx}`;

      const list = grid.get(key) || [];
      list.push(entity);
      grid.set(key, list);
    }

    const clusters: Array<{
      entities: Entity[];
      avgClosure: number;
      avgScope: number;
      coherence: number;
    }> = [];

    for (const [_, ents] of grid) {
      if (ents.length >= 3) {
        const avgClosure = ents.reduce((s, e) => s + e.config.closure, 0) / ents.length;
        const avgScope = ents.reduce((s, e) => s + e.config.scope, 0) / ents.length;

        // Coherence = how similar entities are within cluster
        const closureVariance = ents.reduce((s, e) => s + Math.pow(e.config.closure - avgClosure, 2), 0) / ents.length;
        const scopeVariance = ents.reduce((s, e) => s + Math.pow(e.config.scope - avgScope, 2), 0) / ents.length;
        const coherence = 1 - Math.sqrt(closureVariance + scopeVariance);

        clusters.push({ entities: ents, avgClosure, avgScope, coherence });
      }
    }

    return clusters;
  }

  private buildSummary(gaps: Gap[]): GapAnalysisResult['summary'] {
    const byType: Record<GapType, number> = {
      domain_misfit: 0,
      capability_missing: 0,
      relation_pattern: 0,
      stratum_boundary: 0,
      source_coverage: 0,
      axiom_tension: 0,
      clustering_anomaly: 0,
    };

    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const gap of gaps) {
      byType[gap.type]++;
      bySeverity[gap.severity]++;
    }

    return {
      byType,
      bySeverity,
      totalGaps: gaps.length,
    };
  }
}
