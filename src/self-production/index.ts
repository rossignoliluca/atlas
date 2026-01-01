/**
 * Atlas Self-Production Engine
 *
 * The autopoietic core that allows Atlas to extend itself.
 *
 * Flow:
 *   Knowledge Graph → Gap Analyzer → Code Generator → AXIS Validator → Review Queue → Integrator
 *
 * Invariant: All generated code must pass AXIS validation before integration.
 * Invariant: All integrations require human approval.
 */

import { Entity } from '../core/types';
import { GapAnalyzer, Gap, GapAnalysisResult } from './gap-analyzer';
import { CodeGenerator, GeneratedCode } from './code-generator';
import { AxisValidator, ValidationResult, AXIOMS } from './axis-validator';
import { ReviewQueue, ReviewItem, formatReviewItem, QueueStats } from './review-queue';
import { Integrator, IntegrationResult, IntegrationHistoryEntry } from './integrator';

// Re-export components
export { GapAnalyzer, Gap, GapAnalysisResult } from './gap-analyzer';
export { CodeGenerator, GeneratedCode } from './code-generator';
export { AxisValidator, ValidationResult, AXIOMS } from './axis-validator';
export { ReviewQueue, ReviewItem, formatReviewItem, QueueStats } from './review-queue';
export { Integrator, IntegrationResult, IntegrationHistoryEntry } from './integrator';

/**
 * Self-Production Engine configuration
 */
export interface SelfProductionConfig {
  /** Enable automatic code generation (vs just gap detection) */
  enableGeneration: boolean;
  /** Require human approval for all changes */
  requireApproval: boolean;
  /** Minimum validation score to accept */
  minValidationScore: number;
  /** Maximum pending reviews before pausing */
  maxPendingReviews: number;
  /** Base directory for code */
  baseDir: string;
  /** Dry run mode */
  dryRun: boolean;
}

const DEFAULT_CONFIG: SelfProductionConfig = {
  enableGeneration: true,
  requireApproval: true,
  minValidationScore: 0.7,
  maxPendingReviews: 50,
  baseDir: process.cwd(),
  dryRun: false,
};

/**
 * Self-production cycle result
 */
export interface ProductionCycleResult {
  timestamp: Date;
  entitiesAnalyzed: number;
  gapsDetected: number;
  codeGenerated: number;
  validationsPassed: number;
  validationsFailed: number;
  pendingReviews: number;
  integrationsCompleted: number;
  errors: string[];
}

/**
 * Self-Production Engine
 *
 * The heart of Atlas's autopoietic capability.
 */
export class SelfProductionEngine {
  private config: SelfProductionConfig;
  private gapAnalyzer: GapAnalyzer;
  private codeGenerator: CodeGenerator;
  private axisValidator: AxisValidator;
  private reviewQueue: ReviewQueue;
  private integrator: Integrator;

  constructor(config: Partial<SelfProductionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize components
    this.gapAnalyzer = new GapAnalyzer();
    this.codeGenerator = new CodeGenerator();
    this.axisValidator = new AxisValidator();
    this.reviewQueue = new ReviewQueue();
    this.integrator = new Integrator({
      baseDir: this.config.baseDir,
      dryRun: this.config.dryRun,
    });
  }

  /**
   * Run a full self-production cycle
   */
  async runCycle(entities: Entity[]): Promise<ProductionCycleResult> {
    const result: ProductionCycleResult = {
      timestamp: new Date(),
      entitiesAnalyzed: entities.length,
      gapsDetected: 0,
      codeGenerated: 0,
      validationsPassed: 0,
      validationsFailed: 0,
      pendingReviews: 0,
      integrationsCompleted: 0,
      errors: [],
    };

    try {
      // Phase 1: Analyze for gaps
      console.log('\n🔍 Phase 1: Analyzing knowledge graph for gaps...');
      const gapAnalysis = await this.gapAnalyzer.analyze(entities);
      result.gapsDetected = gapAnalysis.gaps.length;

      console.log(`   Found ${gapAnalysis.gaps.length} gaps`);
      for (const [type, count] of Object.entries(gapAnalysis.summary.byType)) {
        if (count > 0) console.log(`   - ${type}: ${count}`);
      }

      if (!this.config.enableGeneration) {
        console.log('\n⚠️  Code generation disabled. Stopping after gap analysis.');
        return result;
      }

      // Check if we should pause due to pending reviews
      const queueStats = this.reviewQueue.getStats();
      if (queueStats.pending >= this.config.maxPendingReviews) {
        console.log(`\n⏸️  Too many pending reviews (${queueStats.pending}). Process existing reviews first.`);
        result.pendingReviews = queueStats.pending;
        return result;
      }

      // Phase 2: Generate code for actionable gaps
      console.log('\n🔧 Phase 2: Generating code for actionable gaps...');
      const actionableGaps = gapAnalysis.gaps.filter(g =>
        ['new_domain', 'new_capability', 'new_relation', 'new_connector'].includes(g.suggestedAction.type)
      );

      for (const gap of actionableGaps) {
        try {
          const generated = await this.codeGenerator.generate(gap);
          if (!generated) continue;

          result.codeGenerated++;
          console.log(`   Generated: ${generated.type} "${generated.name}"`);

          // Phase 3: Validate against AXIS
          const validation = this.axisValidator.validate(generated);

          if (validation.valid && validation.score >= this.config.minValidationScore) {
            result.validationsPassed++;
            console.log(`   ✓ Validation passed (score: ${validation.score.toFixed(2)})`);

            // Add to review queue
            const reviewItem = this.reviewQueue.addCodeReview(gap, generated, validation);
            console.log(`   📋 Added to review queue: ${reviewItem.id}`);

          } else {
            result.validationsFailed++;
            console.log(`   ✗ Validation failed (score: ${validation.score.toFixed(2)})`);
            for (const v of validation.violations) {
              console.log(`     - ${v.axiomId}: ${v.description}`);
            }
          }

        } catch (error) {
          result.errors.push(`Gap ${gap.id}: ${String(error)}`);
        }
      }

      // Phase 4: Process manual review gaps
      const manualGaps = gapAnalysis.gaps.filter(g => g.suggestedAction.type === 'manual_review');
      for (const gap of manualGaps) {
        this.reviewQueue.addGapReview(gap);
      }

      // Phase 5: Process axiom tension gaps
      const axiomGaps = gapAnalysis.gaps.filter(g => g.suggestedAction.type === 'axiom_review');
      for (const gap of axiomGaps) {
        this.reviewQueue.addAxiomReview(gap);
      }

      result.pendingReviews = this.reviewQueue.getStats().pending;

    } catch (error) {
      result.errors.push(`Cycle error: ${String(error)}`);
    }

    return result;
  }

  /**
   * Get pending reviews
   */
  getPendingReviews(): ReviewItem[] {
    return this.reviewQueue.listPending();
  }

  /**
   * Approve a review item
   */
  async approve(reviewId: string, reviewer: string, notes?: string): Promise<IntegrationResult | null> {
    const item = this.reviewQueue.approve(reviewId, reviewer, notes);

    if (!this.config.requireApproval) {
      // Auto-integrate if approval not required
      return this.integrateApproved(item.id);
    }

    return null;
  }

  /**
   * Reject a review item
   */
  reject(reviewId: string, reviewer: string, reason: string): ReviewItem {
    return this.reviewQueue.reject(reviewId, reviewer, reason);
  }

  /**
   * Integrate an approved item
   */
  async integrateApproved(reviewId: string): Promise<IntegrationResult> {
    const item = this.reviewQueue.get(reviewId);
    if (!item) throw new Error(`Review item ${reviewId} not found`);
    if (item.status !== 'approved' && item.status !== 'modified') {
      throw new Error(`Item ${reviewId} is not approved`);
    }

    const result = await this.integrator.integrate(item);

    if (result.success) {
      this.reviewQueue.markIntegrated(reviewId);
    }

    return result;
  }

  /**
   * Integrate all approved items
   */
  async integrateAllApproved(): Promise<IntegrationResult[]> {
    const approved = this.reviewQueue.getApprovedForIntegration();
    const results: IntegrationResult[] = [];

    for (const item of approved) {
      const result = await this.integrator.integrate(item);
      results.push(result);

      if (result.success) {
        this.reviewQueue.markIntegrated(item.id);
      }
    }

    return results;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    return this.reviewQueue.getStats();
  }

  /**
   * Get integration history
   */
  getIntegrationHistory(): IntegrationHistoryEntry[] {
    return this.integrator.getHistory();
  }

  /**
   * Rollback an integration
   */
  async rollback(integrationId: string): Promise<boolean> {
    return this.integrator.rollback(integrationId);
  }

  /**
   * Get axioms (for reference)
   */
  getAxioms() {
    return AXIOMS;
  }

  /**
   * Print a status report
   */
  printStatus(): void {
    const queueStats = this.reviewQueue.getStats();
    const history = this.integrator.getHistory();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          ATLAS SELF-PRODUCTION ENGINE STATUS                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('Review Queue:');
    console.log(`  Pending:  ${queueStats.pending}`);
    console.log(`  Approved: ${queueStats.approved}`);
    console.log(`  Rejected: ${queueStats.rejected}`);
    console.log(`  Modified: ${queueStats.modified}`);
    console.log(`  Expired:  ${queueStats.expired}`);

    if (queueStats.avgReviewTimeMs > 0) {
      const avgHours = queueStats.avgReviewTimeMs / (1000 * 60 * 60);
      console.log(`  Avg Review Time: ${avgHours.toFixed(1)} hours`);
    }

    console.log('\nIntegration History:');
    console.log(`  Total Integrations: ${history.length}`);
    console.log(`  Rollbackable: ${history.filter(h => h.canRollback).length}`);

    if (history.length > 0) {
      console.log('\n  Recent Integrations:');
      for (const entry of this.integrator.getRecent(5)) {
        console.log(`    - ${entry.type} "${entry.name}" (${entry.integratedAt.toLocaleDateString()})`);
      }
    }

    console.log('\nConfiguration:');
    console.log(`  Generation: ${this.config.enableGeneration ? 'Enabled' : 'Disabled'}`);
    console.log(`  Require Approval: ${this.config.requireApproval ? 'Yes' : 'No'}`);
    console.log(`  Min Validation Score: ${this.config.minValidationScore}`);
    console.log(`  Dry Run: ${this.config.dryRun ? 'Yes' : 'No'}`);
  }

  /**
   * Export state (for persistence)
   */
  exportState(): {
    reviewQueue: ReviewItem[];
    integrationHistory: IntegrationHistoryEntry[];
  } {
    return {
      reviewQueue: this.reviewQueue.export(),
      integrationHistory: this.integrator.exportHistory(),
    };
  }

  /**
   * Import state (from persistence)
   */
  importState(state: {
    reviewQueue: ReviewItem[];
    integrationHistory: IntegrationHistoryEntry[];
  }): void {
    this.reviewQueue.import(state.reviewQueue);
    this.integrator.importHistory(state.integrationHistory);
  }
}

/**
 * Create and initialize a self-production engine
 */
export function createSelfProductionEngine(
  config?: Partial<SelfProductionConfig>
): SelfProductionEngine {
  return new SelfProductionEngine(config);
}

/**
 * Demo function to show self-production in action
 */
export async function demoSelfProduction(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     ATLAS SELF-PRODUCTION ENGINE - DEMONSTRATION              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Create engine in dry-run mode
  const engine = new SelfProductionEngine({ dryRun: true });

  // Create some sample entities that might trigger gaps
  const sampleEntities: Entity[] = [
    {
      id: 'quantum_computer',
      name: 'Quantum Computer',
      domain: 'ARTIFICIAL',
      modes: { composition: 'EMERGENT', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
      config: {
        closure: 0.85,  // High closure
        scope: 0.75,    // High scope - tension!
        strata: { MATTER: true, LIFE: false, SENTIENCE: false, LOGOS: true },  // Gap in nesting!
        capabilities: new Set(['PERSIST', 'REPRESENT'] as const),
        relations: [],
        uncertainty: 0.4,
      },
    },
    {
      id: 'cyborg_entity',
      name: 'Cyborg',
      domain: 'ARTIFICIAL', // Doesn't quite fit...
      modes: { composition: 'HYBRID', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
      config: {
        closure: 0.6,
        scope: 0.5,
        strata: { MATTER: true, LIFE: true, SENTIENCE: true, LOGOS: false },
        capabilities: new Set(['PERSIST', 'SELF_PRODUCE', 'FEEL'] as const),
        relations: [{ type: 'part_of', targetId: 'human', strength: 0.5 }, { type: 'contains', targetId: 'machine', strength: 0.5 }],
        uncertainty: 0.3,
      },
    },
  ];

  // Run a cycle
  console.log('Running self-production cycle with sample entities...\n');
  const result = await engine.runCycle(sampleEntities);

  console.log('\n📊 Cycle Results:');
  console.log(`   Entities analyzed: ${result.entitiesAnalyzed}`);
  console.log(`   Gaps detected: ${result.gapsDetected}`);
  console.log(`   Code generated: ${result.codeGenerated}`);
  console.log(`   Validations passed: ${result.validationsPassed}`);
  console.log(`   Validations failed: ${result.validationsFailed}`);
  console.log(`   Pending reviews: ${result.pendingReviews}`);

  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.length}`);
  }

  // Show pending reviews
  const pending = engine.getPendingReviews();
  if (pending.length > 0) {
    console.log('\n📋 Pending Reviews:');
    for (const item of pending.slice(0, 3)) {
      console.log(formatReviewItem(item));
    }
  }

  console.log('\n✓ Demo complete. In production, a human would review and approve items.');
}
