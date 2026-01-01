/**
 * Atlas Autopoietic Engine
 *
 * The engine that makes Atlas self-producing.
 * Coordinates: Ingest → Extract → Characterize → Store → Produce → Extend
 */

import { Entity, EntityConfiguration } from '../core/types';
import { IngestPipeline, RawDocument } from '../ingest';
import { EntityExtractor, RelationExtractor } from '../extraction';
import { ECFCharacterizer, AxiomValidator } from './characterizer';
import { KnowledgeGraph } from '../knowledge';
import { PatternDetector, HypothesisGenerator } from '../production';
import { ExtensionEngine, ReviewQueue } from '../extension';

/**
 * Engine configuration
 */
export interface EngineConfig {
  /** LLM provider for extraction/characterization */
  llm: {
    provider: 'anthropic' | 'openai';
    extractionModel: string;
    characterizationModel: string;
    productionModel: string;
  };

  /** Knowledge graph backend */
  storage: {
    type: 'sqlite' | 'neo4j' | 'memory';
    connection?: string;
  };

  /** Ingestion sources */
  sources: {
    arxiv?: boolean;
    pubmed?: boolean;
    wikipedia?: boolean;
    wikidata?: boolean;
  };

  /** Thresholds */
  thresholds: {
    /** Minimum confidence to auto-accept entity */
    autoAcceptConfidence: number;
    /** Maximum uncertainty before human review */
    humanReviewUncertainty: number;
    /** Minimum confidence for hypothesis */
    hypothesisMinConfidence: number;
  };

  /** Rate limits */
  rateLimits: {
    ingestionPerHour: number;
    llmCallsPerMinute: number;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: EngineConfig = {
  llm: {
    provider: 'anthropic',
    extractionModel: 'claude-3-haiku-20240307',
    characterizationModel: 'claude-sonnet-4-20250514',
    productionModel: 'claude-opus-4-20250514',
  },
  storage: {
    type: 'sqlite',
    connection: './atlas.db',
  },
  sources: {
    arxiv: true,
    pubmed: true,
    wikipedia: true,
    wikidata: true,
  },
  thresholds: {
    autoAcceptConfidence: 0.85,
    humanReviewUncertainty: 0.6,
    hypothesisMinConfidence: 0.7,
  },
  rateLimits: {
    ingestionPerHour: 100,
    llmCallsPerMinute: 30,
  },
};

/**
 * Engine state
 */
export interface EngineState {
  status: 'idle' | 'ingesting' | 'processing' | 'producing' | 'error';
  stats: EngineStats;
  lastRun?: Date;
  errors: EngineError[];
}

export interface EngineStats {
  entitiesTotal: number;
  entitiesAdded24h: number;
  relationsTotal: number;
  hypothesesGenerated: number;
  hypothesesVerified: number;
  pendingReview: number;
  extensionsProposed: number;
}

export interface EngineError {
  timestamp: Date;
  phase: 'ingest' | 'extract' | 'characterize' | 'store' | 'produce' | 'extend';
  message: string;
  recoverable: boolean;
}

/**
 * The Autopoietic Engine
 */
export class AtlasEngine {
  private config: EngineConfig;
  private state: EngineState;

  // Components (lazy initialized)
  private ingest?: IngestPipeline;
  private entityExtractor?: EntityExtractor;
  private relationExtractor?: RelationExtractor;
  private characterizer?: ECFCharacterizer;
  private validator?: AxiomValidator;
  private graph?: KnowledgeGraph;
  private patternDetector?: PatternDetector;
  private hypothesisGenerator?: HypothesisGenerator;
  private extensionEngine?: ExtensionEngine;
  private reviewQueue?: ReviewQueue;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      status: 'idle',
      stats: {
        entitiesTotal: 0,
        entitiesAdded24h: 0,
        relationsTotal: 0,
        hypothesesGenerated: 0,
        hypothesesVerified: 0,
        pendingReview: 0,
        extensionsProposed: 0,
      },
      errors: [],
    };
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    // Initialize in dependency order
    // Graph must be first as others depend on it
    this.graph = await this.initializeGraph();
    this.validator = new AxiomValidator();
    this.characterizer = new ECFCharacterizer(this.config.llm, this.validator);
    this.entityExtractor = new EntityExtractor(this.config.llm);
    this.relationExtractor = new RelationExtractor(this.config.llm);
    this.ingest = new IngestPipeline(this.config.sources);
    this.patternDetector = new PatternDetector(this.graph);
    this.hypothesisGenerator = new HypothesisGenerator(this.graph, this.config.llm);
    this.extensionEngine = new ExtensionEngine(this.validator);
    this.reviewQueue = new ReviewQueue();

    // Update stats from graph
    await this.updateStats();
  }

  private async initializeGraph(): Promise<KnowledgeGraph> {
    const { KnowledgeGraph } = await import('../knowledge');
    return new KnowledgeGraph(this.config.storage);
  }

  private async updateStats(): Promise<void> {
    if (!this.graph) return;

    const stats = await this.graph.getStats();
    this.state.stats = {
      ...this.state.stats,
      entitiesTotal: stats.entityCount,
      relationsTotal: stats.relationCount,
    };
  }

  /**
   * Run the full autopoietic cycle
   */
  async runCycle(options: {
    query?: string;
    source?: string;
    maxDocuments?: number;
  } = {}): Promise<CycleResult> {
    const result: CycleResult = {
      startTime: new Date(),
      endTime: new Date(),
      documentsProcessed: 0,
      entitiesExtracted: 0,
      entitiesCharacterized: 0,
      entitiesStored: 0,
      hypothesesGenerated: 0,
      extensionsProposed: 0,
      errors: [],
    };

    try {
      // Phase 1: Ingest
      this.state.status = 'ingesting';
      const documents = await this.ingestPhase(options);
      result.documentsProcessed = documents.length;

      // Phase 2: Extract + Characterize + Store
      this.state.status = 'processing';
      for (const doc of documents) {
        try {
          const { entities, relations } = await this.extractPhase(doc);
          result.entitiesExtracted += entities.length;

          for (const entity of entities) {
            const characterized = await this.characterizePhase(entity, relations);
            if (characterized) {
              result.entitiesCharacterized++;

              const stored = await this.storePhase(characterized);
              if (stored) {
                result.entitiesStored++;
              }
            }
          }
        } catch (error) {
          result.errors.push({
            timestamp: new Date(),
            phase: 'extract',
            message: String(error),
            recoverable: true,
          });
        }
      }

      // Phase 3: Produce
      this.state.status = 'producing';
      const hypotheses = await this.producePhase();
      result.hypothesesGenerated = hypotheses.length;

      // Phase 4: Extend (if patterns warrant)
      const extensions = await this.extendPhase(hypotheses);
      result.extensionsProposed = extensions.length;

      result.endTime = new Date();
      this.state.status = 'idle';
      this.state.lastRun = result.endTime;

    } catch (error) {
      this.state.status = 'error';
      result.errors.push({
        timestamp: new Date(),
        phase: 'ingest',
        message: String(error),
        recoverable: false,
      });
    }

    return result;
  }

  /**
   * Ingest phase: Fetch documents from sources
   */
  private async ingestPhase(options: {
    query?: string;
    source?: string;
    maxDocuments?: number;
  }): Promise<RawDocument[]> {
    if (!this.ingest) throw new Error('Ingest not initialized');

    const query = options.query || await this.identifyNextQuery();
    const documents = await this.ingest.fetch(query, {
      source: options.source,
      limit: options.maxDocuments || 10,
    });

    return documents;
  }

  /**
   * Identify what to query next based on knowledge gaps
   */
  private async identifyNextQuery(): Promise<string> {
    if (!this.patternDetector) return 'entity ontology';

    const gaps = await this.patternDetector.findGaps();
    if (gaps.length > 0) {
      // Query for the most pressing gap
      return gaps[0].suggestedQuery;
    }

    // Default to general ontology expansion
    return 'entity types classification';
  }

  /**
   * Extract phase: Get entities and relations from document
   */
  private async extractPhase(doc: RawDocument): Promise<{
    entities: ExtractedEntity[];
    relations: ExtractedRelation[];
  }> {
    if (!this.entityExtractor || !this.relationExtractor) {
      throw new Error('Extractors not initialized');
    }

    const entities = await this.entityExtractor.extract(doc.text);
    const relations = await this.relationExtractor.extract(doc.text, entities);

    return { entities, relations };
  }

  /**
   * Characterize phase: Apply ECF to extracted entity
   */
  private async characterizePhase(
    entity: ExtractedEntity,
    relations: ExtractedRelation[]
  ): Promise<Entity | null> {
    if (!this.characterizer) throw new Error('Characterizer not initialized');

    const result = await this.characterizer.characterize(entity, relations);

    // Check if needs human review
    if (result.uncertainty > this.config.thresholds.humanReviewUncertainty) {
      await this.reviewQueue?.add({
        type: 'characterization',
        entity: result.entity,
        reason: 'High uncertainty',
        uncertainty: result.uncertainty,
      });
      return null; // Don't auto-accept
    }

    // Check validation
    if (!result.validation.valid) {
      await this.reviewQueue?.add({
        type: 'validation_failure',
        entity: result.entity,
        reason: result.validation.violations.map(v => v.message).join('; '),
      });
      return null;
    }

    return result.entity;
  }

  /**
   * Store phase: Add to knowledge graph
   */
  private async storePhase(entity: Entity): Promise<boolean> {
    if (!this.graph) throw new Error('Graph not initialized');

    // Check for duplicates
    const existing = await this.graph.findSimilar(entity.name);
    if (existing) {
      // Merge with existing
      await this.graph.merge(existing.id, entity);
      return true;
    }

    // Add new
    await this.graph.add(entity);
    return true;
  }

  /**
   * Produce phase: Generate hypotheses from patterns
   */
  private async producePhase(): Promise<Hypothesis[]> {
    if (!this.patternDetector || !this.hypothesisGenerator) {
      return [];
    }

    // Detect patterns
    const patterns = await this.patternDetector.detect();

    // Generate hypotheses
    const hypotheses = await this.hypothesisGenerator.generate(patterns);

    // Filter by confidence
    return hypotheses.filter(
      h => h.confidence >= this.config.thresholds.hypothesisMinConfidence
    );
  }

  /**
   * Extend phase: Propose framework extensions
   */
  private async extendPhase(hypotheses: Hypothesis[]): Promise<ExtensionProposal[]> {
    if (!this.extensionEngine) return [];

    // Look for patterns suggesting framework limitations
    const frameworkHypotheses = hypotheses.filter(
      h => h.type === 'framework_limitation'
    );

    const proposals: ExtensionProposal[] = [];
    for (const h of frameworkHypotheses) {
      const proposal = await this.extensionEngine.propose(h);
      if (proposal) {
        proposals.push(proposal);
        await this.reviewQueue?.add({
          type: 'extension',
          proposal,
          reason: 'Framework extension proposed',
        });
      }
    }

    return proposals;
  }

  /**
   * Get current state
   */
  getState(): EngineState {
    return { ...this.state };
  }

  /**
   * Get review queue
   */
  async getReviewQueue(): Promise<ReviewItem[]> {
    return this.reviewQueue?.list() || [];
  }

  /**
   * Approve review item
   */
  async approveReview(id: string): Promise<void> {
    const item = await this.reviewQueue?.get(id);
    if (!item) throw new Error('Review item not found');

    switch (item.type) {
      case 'characterization':
        if (item.entity) {
          await this.graph?.add(item.entity);
        }
        break;
      case 'extension':
        if (item.proposal) {
          await this.extensionEngine?.approve(item.proposal);
        }
        break;
    }

    await this.reviewQueue?.resolve(id, 'approved');
  }

  /**
   * Reject review item
   */
  async rejectReview(id: string, reason: string): Promise<void> {
    await this.reviewQueue?.resolve(id, 'rejected', reason);
  }
}

/**
 * Result of a cycle run
 */
export interface CycleResult {
  startTime: Date;
  endTime: Date;
  documentsProcessed: number;
  entitiesExtracted: number;
  entitiesCharacterized: number;
  entitiesStored: number;
  hypothesesGenerated: number;
  extensionsProposed: number;
  errors: EngineError[];
}

/**
 * Extracted entity (pre-characterization)
 */
export interface ExtractedEntity {
  name: string;
  mentions: Array<{ text: string; start: number; end: number }>;
  context: string;
  confidence: number;
}

/**
 * Extracted relation
 */
export interface ExtractedRelation {
  source: string;
  target: string;
  type: string;
  evidence: string;
  confidence: number;
}

/**
 * Generated hypothesis
 */
export interface Hypothesis {
  id: string;
  type: 'new_entity' | 'new_relation' | 'framework_limitation';
  content: any;
  confidence: number;
  evidence: string[];
  testable: boolean;
}

/**
 * Extension proposal
 */
export interface ExtensionProposal {
  id: string;
  type: 'capability' | 'domain' | 'mode' | 'axiom_refinement';
  description: string;
  rationale: string;
  axiomCompatibility: boolean;
  status: 'proposed' | 'approved' | 'rejected';
}

/**
 * Review queue item
 */
export interface ReviewItem {
  id: string;
  type: 'characterization' | 'validation_failure' | 'extension';
  entity?: Entity;
  proposal?: ExtensionProposal;
  reason: string;
  uncertainty?: number;
  created: Date;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Create and initialize engine
 */
export async function createEngine(config?: Partial<EngineConfig>): Promise<AtlasEngine> {
  const engine = new AtlasEngine(config);
  await engine.initialize();
  return engine;
}
