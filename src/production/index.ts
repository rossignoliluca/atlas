/**
 * Production Layer
 *
 * Generates new knowledge from patterns in the knowledge graph.
 * This is where Atlas becomes autopoietic - producing new entities and relations.
 */

import { Entity, EntityRelation, Geometry } from '../core/types';
import { Domain } from '../core/domains';
import { Stratum } from '../core/strata';
import { KnowledgeGraph, EntityCluster, KnowledgeGap } from '../knowledge';
import { LLMConfig, Hypothesis, ExtractedEntity, ExtractedRelation } from '../engine';

/**
 * Detected pattern in the knowledge graph
 */
export interface Pattern {
  type: PatternType;
  description: string;
  entities: string[];
  confidence: number;
  evidence: string[];
}

export type PatternType =
  | 'cluster'           // Group of similar entities
  | 'hierarchy'         // Part-of chain
  | 'cycle'             // Circular dependencies
  | 'bridge'            // Entity connecting clusters
  | 'anomaly'           // Unusual C/S combination
  | 'correlation'       // C-S or domain correlations
  | 'missing_link';     // Expected but absent relation

/**
 * Pattern Detector
 * Finds patterns in the knowledge graph
 */
export class PatternDetector {
  constructor(private graph: KnowledgeGraph) {}

  /**
   * Detect all patterns
   */
  async detect(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Detect clusters
    const clusters = await this.detectClusters();
    patterns.push(...clusters);

    // Detect anomalies
    const anomalies = await this.detectAnomalies();
    patterns.push(...anomalies);

    // Detect correlations
    const correlations = await this.detectCorrelations();
    patterns.push(...correlations);

    // Detect missing links
    const missingLinks = await this.detectMissingLinks();
    patterns.push(...missingLinks);

    return patterns;
  }

  /**
   * Detect entity clusters
   */
  private async detectClusters(): Promise<Pattern[]> {
    const clusters = await this.graph.findClusters(8);
    const patterns: Pattern[] = [];

    for (const cluster of clusters) {
      if (cluster.entities.length >= 3) {
        // Identify what makes this cluster cohesive
        const domains = new Map<Domain, number>();
        let avgClosure = 0;
        let avgScope = 0;

        for (const entity of cluster.entities) {
          domains.set(entity.domain, (domains.get(entity.domain) || 0) + 1);
          avgClosure += entity.config.closure;
          avgScope += entity.config.scope;
        }

        avgClosure /= cluster.entities.length;
        avgScope /= cluster.entities.length;

        const dominantDomain = Array.from(domains.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        patterns.push({
          type: 'cluster',
          description: `Cluster of ${cluster.entities.length} entities, ` +
            `primarily ${dominantDomain}, ` +
            `avg C=${avgClosure.toFixed(2)}, S=${avgScope.toFixed(2)}`,
          entities: cluster.entities.map(e => e.id),
          confidence: cluster.cohesion,
          evidence: [`Cohesion: ${cluster.cohesion.toFixed(2)}`],
        });
      }
    }

    return patterns;
  }

  /**
   * Detect anomalous entities
   */
  private async detectAnomalies(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const stats = await this.graph.getStats();

    // Find entities with unusual C-S combinations
    const highBoth = await this.graph.findByClosureRange(0.7, 1.0);
    for (const entity of highBoth) {
      if (entity.config.scope > 0.7) {
        patterns.push({
          type: 'anomaly',
          description: `${entity.name} has unusually high both closure (${entity.config.closure.toFixed(2)}) and scope (${entity.config.scope.toFixed(2)})`,
          entities: [entity.id],
          confidence: 0.6,
          evidence: ['High C-S tension typically unstable'],
        });
      }
    }

    // Find entities with strata/capability mismatches
    // (This would need capability checking logic)

    return patterns;
  }

  /**
   * Detect correlations
   */
  private async detectCorrelations(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Domain-closure correlations
    const domains: Domain[] = ['LIVING', 'ARTIFICIAL', 'IDEAL'];

    for (const domain of domains) {
      const entities = await this.graph.findByDomain(domain);
      if (entities.length < 5) continue;

      const avgClosure = entities.reduce((sum, e) => sum + e.config.closure, 0) / entities.length;
      const stdDev = Math.sqrt(
        entities.reduce((sum, e) => sum + Math.pow(e.config.closure - avgClosure, 2), 0) / entities.length
      );

      // If low variance, there's a correlation
      if (stdDev < 0.15) {
        patterns.push({
          type: 'correlation',
          description: `${domain} entities cluster around closure ${avgClosure.toFixed(2)} (σ=${stdDev.toFixed(2)})`,
          entities: entities.map(e => e.id),
          confidence: 1 - stdDev,
          evidence: [`n=${entities.length}`, `avg=${avgClosure.toFixed(2)}`, `std=${stdDev.toFixed(2)}`],
        });
      }
    }

    return patterns;
  }

  /**
   * Detect missing links
   */
  private async detectMissingLinks(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Find entities that are related to the same targets
    // but not related to each other (transitive closure violations)

    const exported = await this.graph.export();

    // Build adjacency map
    const adjacent = new Map<string, Set<string>>();
    for (const rel of exported.relations) {
      // Note: relations in export include all from entities
    }

    // For simplicity, just flag orphan relations for now
    const gaps = await this.graph.findGaps();
    for (const gap of gaps.filter(g => g.type === 'missing_entity')) {
      patterns.push({
        type: 'missing_link',
        description: gap.description,
        entities: [],
        confidence: gap.severity,
        evidence: [gap.suggestedQuery],
      });
    }

    return patterns;
  }

  /**
   * Find knowledge gaps
   */
  async findGaps(): Promise<KnowledgeGap[]> {
    return this.graph.findGaps();
  }
}

/**
 * Hypothesis Generator
 * Creates hypotheses from detected patterns
 */
export class HypothesisGenerator {
  constructor(
    private graph: KnowledgeGraph,
    private llmConfig: LLMConfig
  ) {}

  /**
   * Generate hypotheses from patterns
   */
  async generate(patterns: Pattern[]): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    for (const pattern of patterns) {
      const generated = await this.generateFromPattern(pattern);
      hypotheses.push(...generated);
    }

    return hypotheses;
  }

  /**
   * Generate hypotheses from a single pattern
   */
  private async generateFromPattern(pattern: Pattern): Promise<Hypothesis[]> {
    switch (pattern.type) {
      case 'cluster':
        return this.generateClusterHypotheses(pattern);
      case 'anomaly':
        return this.generateAnomalyHypotheses(pattern);
      case 'missing_link':
        return this.generateMissingLinkHypotheses(pattern);
      case 'correlation':
        return this.generateCorrelationHypotheses(pattern);
      default:
        return [];
    }
  }

  /**
   * Hypotheses from cluster patterns
   */
  private async generateClusterHypotheses(pattern: Pattern): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    // Hypothesis: There may be more entities of this type
    hypotheses.push({
      id: `hyp_cluster_${Date.now()}`,
      type: 'new_entity',
      content: {
        suggestion: 'Search for more entities in this cluster',
        clusterDescription: pattern.description,
      },
      confidence: pattern.confidence * 0.8,
      evidence: pattern.evidence,
      testable: true,
    });

    return hypotheses;
  }

  /**
   * Hypotheses from anomaly patterns
   */
  private async generateAnomalyHypotheses(pattern: Pattern): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    // Hypothesis: The anomaly might indicate framework limitation
    hypotheses.push({
      id: `hyp_anomaly_${Date.now()}`,
      type: 'framework_limitation',
      content: {
        suggestion: 'Investigate if C-S axiom needs refinement',
        anomalyDescription: pattern.description,
        entities: pattern.entities,
      },
      confidence: pattern.confidence * 0.5, // Lower confidence for framework changes
      evidence: pattern.evidence,
      testable: false,
    });

    return hypotheses;
  }

  /**
   * Hypotheses from missing link patterns
   */
  private async generateMissingLinkHypotheses(pattern: Pattern): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    // Hypothesis: The missing entity should be characterized
    hypotheses.push({
      id: `hyp_missing_${Date.now()}`,
      type: 'new_entity',
      content: {
        suggestion: `Characterize: ${pattern.evidence[0]}`,
        reason: pattern.description,
      },
      confidence: pattern.confidence,
      evidence: pattern.evidence,
      testable: true,
    });

    return hypotheses;
  }

  /**
   * Hypotheses from correlation patterns
   */
  private async generateCorrelationHypotheses(pattern: Pattern): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    // Hypothesis: This correlation might be a predictive rule
    hypotheses.push({
      id: `hyp_corr_${Date.now()}`,
      type: 'new_relation',
      content: {
        suggestion: 'This correlation could predict closure for new entities in this domain',
        correlation: pattern.description,
      },
      confidence: pattern.confidence * 0.7,
      evidence: pattern.evidence,
      testable: true,
    });

    return hypotheses;
  }

  /**
   * Generate predictions about new entities
   */
  async predictEntity(name: string, context: string): Promise<Partial<Entity>> {
    // Use patterns to predict characterization
    const patterns = await new PatternDetector(this.graph).detect();

    // Find relevant cluster
    // (In production, this would use embeddings or LLM)

    // Default prediction based on average stats
    const stats = await this.graph.getStats();

    return {
      name,
      domain: 'INERT', // Default
      config: {
        closure: stats.avgClosure,
        scope: stats.avgScope,
        strata: { MATTER: true, LIFE: false, SENTIENCE: false, LOGOS: false },
        capabilities: new Set(['PERSIST']),
        relations: [],
        uncertainty: 0.7, // High uncertainty for predictions
      },
    };
  }

  /**
   * Generate research questions
   */
  async generateQuestions(gaps: KnowledgeGap[]): Promise<string[]> {
    const questions: string[] = [];

    for (const gap of gaps) {
      switch (gap.type) {
        case 'sparse_domain':
          questions.push(`What are the fundamental entities in the ${gap.description.split(' ')[1]} domain?`);
          break;
        case 'high_uncertainty':
          questions.push(`What additional evidence would clarify the characterization of uncertain entities?`);
          break;
        case 'missing_entity':
          questions.push(`What is ${gap.suggestedQuery} and how should it be characterized?`);
          break;
      }
    }

    return questions;
  }
}

/**
 * Verification engine for hypotheses
 */
export class HypothesisVerifier {
  constructor(private graph: KnowledgeGraph) {}

  /**
   * Verify a hypothesis against new evidence
   */
  async verify(hypothesis: Hypothesis, evidence: VerificationEvidence): Promise<VerificationResult> {
    // Check if hypothesis is testable
    if (!hypothesis.testable) {
      return {
        hypothesis: hypothesis.id,
        status: 'not_testable',
        confidence: 0,
        notes: ['This hypothesis requires human judgment'],
      };
    }

    // Different verification strategies by type
    switch (hypothesis.type) {
      case 'new_entity':
        return this.verifyNewEntity(hypothesis, evidence);
      case 'new_relation':
        return this.verifyNewRelation(hypothesis, evidence);
      default:
        return {
          hypothesis: hypothesis.id,
          status: 'unknown',
          confidence: 0,
          notes: ['Verification strategy not implemented'],
        };
    }
  }

  private async verifyNewEntity(
    hypothesis: Hypothesis,
    evidence: VerificationEvidence
  ): Promise<VerificationResult> {
    // Check if entity was found and characterized
    if (evidence.entityFound) {
      return {
        hypothesis: hypothesis.id,
        status: 'confirmed',
        confidence: evidence.characterizationConfidence || 0.8,
        notes: ['Entity found and characterized'],
      };
    }

    return {
      hypothesis: hypothesis.id,
      status: 'rejected',
      confidence: 0.2,
      notes: ['Entity not found in searched sources'],
    };
  }

  private async verifyNewRelation(
    hypothesis: Hypothesis,
    evidence: VerificationEvidence
  ): Promise<VerificationResult> {
    // Check if predicted relation holds
    if (evidence.relationFound) {
      return {
        hypothesis: hypothesis.id,
        status: 'confirmed',
        confidence: evidence.relationStrength || 0.7,
        notes: ['Relation confirmed'],
      };
    }

    return {
      hypothesis: hypothesis.id,
      status: 'inconclusive',
      confidence: 0.5,
      notes: ['Relation not directly confirmed but not disproven'],
    };
  }
}

/**
 * Evidence for hypothesis verification
 */
export interface VerificationEvidence {
  entityFound?: boolean;
  characterizationConfidence?: number;
  relationFound?: boolean;
  relationStrength?: number;
  sources?: string[];
}

/**
 * Verification result
 */
export interface VerificationResult {
  hypothesis: string;
  status: 'confirmed' | 'rejected' | 'inconclusive' | 'not_testable' | 'unknown';
  confidence: number;
  notes: string[];
}
