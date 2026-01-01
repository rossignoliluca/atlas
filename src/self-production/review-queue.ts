/**
 * Review Queue
 *
 * Human-in-the-loop approval system for generated code.
 * No code is integrated into Atlas without human approval.
 */

import { GeneratedCode } from './code-generator';
import { ValidationResult } from './axis-validator';
import { Gap } from './gap-analyzer';

/**
 * Review item status
 */
export type ReviewStatus =
  | 'pending'      // Awaiting review
  | 'approved'     // Human approved
  | 'rejected'     // Human rejected
  | 'modified'     // Human modified then approved
  | 'expired';     // Timed out

/**
 * Review item
 */
export interface ReviewItem {
  id: string;
  type: 'code_generation' | 'gap_detection' | 'axiom_tension';
  status: ReviewStatus;

  // What triggered this review
  sourceGap: Gap;

  // Generated code (if code_generation)
  generatedCode?: GeneratedCode;

  // Validation result
  validation?: ValidationResult;

  // Review metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;

  // Human feedback
  reviewer?: string;
  reviewedAt?: Date;
  feedback?: ReviewFeedback;

  // Priority
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Human feedback on a review item
 */
export interface ReviewFeedback {
  decision: 'approve' | 'reject' | 'modify';
  reason: string;
  modifications?: string;  // If modified, what was changed
  notes?: string;
}

/**
 * Review queue statistics
 */
export interface QueueStats {
  pending: number;
  approved: number;
  rejected: number;
  modified: number;
  expired: number;
  avgReviewTimeMs: number;
  oldestPendingAge: number;  // milliseconds
}

/**
 * Review Queue Configuration
 */
export interface ReviewQueueConfig {
  /** Time before items expire (ms) */
  expirationTime: number;
  /** Maximum pending items */
  maxPending: number;
  /** Auto-expire low priority after this time */
  lowPriorityTimeout: number;
}

const DEFAULT_CONFIG: ReviewQueueConfig = {
  expirationTime: 7 * 24 * 60 * 60 * 1000,  // 7 days
  maxPending: 100,
  lowPriorityTimeout: 30 * 24 * 60 * 60 * 1000,  // 30 days
};

/**
 * Review Queue
 */
export class ReviewQueue {
  private config: ReviewQueueConfig;
  private items: Map<string, ReviewItem> = new Map();
  private itemCounter = 0;

  constructor(config: Partial<ReviewQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a code generation to the review queue
   */
  addCodeReview(
    gap: Gap,
    generatedCode: GeneratedCode,
    validation: ValidationResult
  ): ReviewItem {
    const now = new Date();
    const priority = this.determinePriority(gap, validation);

    const item: ReviewItem = {
      id: this.generateId(),
      type: 'code_generation',
      status: 'pending',
      sourceGap: gap,
      generatedCode,
      validation,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.config.expirationTime),
      priority,
    };

    this.items.set(item.id, item);
    this.enforceMaxPending();

    return item;
  }

  /**
   * Add a gap detection for review (manual review requested)
   */
  addGapReview(gap: Gap): ReviewItem {
    const now = new Date();

    const item: ReviewItem = {
      id: this.generateId(),
      type: 'gap_detection',
      status: 'pending',
      sourceGap: gap,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.config.expirationTime),
      priority: gap.severity === 'critical' ? 'critical' : gap.severity === 'high' ? 'high' : 'medium',
    };

    this.items.set(item.id, item);
    this.enforceMaxPending();

    return item;
  }

  /**
   * Add an axiom tension for review
   */
  addAxiomReview(gap: Gap): ReviewItem {
    const now = new Date();

    const item: ReviewItem = {
      id: this.generateId(),
      type: 'axiom_tension',
      status: 'pending',
      sourceGap: gap,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.config.expirationTime),
      priority: gap.severity === 'critical' ? 'critical' : 'high',
    };

    this.items.set(item.id, item);

    return item;
  }

  /**
   * Get an item by ID
   */
  get(id: string): ReviewItem | undefined {
    return this.items.get(id);
  }

  /**
   * List all pending items
   */
  listPending(): ReviewItem[] {
    this.expireOldItems();

    return Array.from(this.items.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // Sort by priority, then by age
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  /**
   * List all items (for history)
   */
  listAll(): ReviewItem[] {
    return Array.from(this.items.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Approve an item
   */
  approve(id: string, reviewer: string, notes?: string): ReviewItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Review item ${id} not found`);
    if (item.status !== 'pending') throw new Error(`Item ${id} is not pending`);

    item.status = 'approved';
    item.reviewer = reviewer;
    item.reviewedAt = new Date();
    item.updatedAt = new Date();
    item.feedback = {
      decision: 'approve',
      reason: notes || 'Approved without notes',
    };

    this.items.set(id, item);
    return item;
  }

  /**
   * Reject an item
   */
  reject(id: string, reviewer: string, reason: string): ReviewItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Review item ${id} not found`);
    if (item.status !== 'pending') throw new Error(`Item ${id} is not pending`);

    item.status = 'rejected';
    item.reviewer = reviewer;
    item.reviewedAt = new Date();
    item.updatedAt = new Date();
    item.feedback = {
      decision: 'reject',
      reason,
    };

    this.items.set(id, item);
    return item;
  }

  /**
   * Modify and approve an item
   */
  modifyAndApprove(
    id: string,
    reviewer: string,
    modifications: string,
    notes?: string
  ): ReviewItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Review item ${id} not found`);
    if (item.status !== 'pending') throw new Error(`Item ${id} is not pending`);

    item.status = 'modified';
    item.reviewer = reviewer;
    item.reviewedAt = new Date();
    item.updatedAt = new Date();
    item.feedback = {
      decision: 'modify',
      reason: notes || 'Modified before approval',
      modifications,
    };

    // Update the generated code if present
    if (item.generatedCode) {
      item.generatedCode.code = modifications;
    }

    this.items.set(id, item);
    return item;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    this.expireOldItems();

    const items = Array.from(this.items.values());
    const pending = items.filter(i => i.status === 'pending');
    const approved = items.filter(i => i.status === 'approved');
    const rejected = items.filter(i => i.status === 'rejected');
    const modified = items.filter(i => i.status === 'modified');
    const expired = items.filter(i => i.status === 'expired');

    // Calculate average review time
    const reviewed = [...approved, ...rejected, ...modified];
    let avgReviewTimeMs = 0;
    if (reviewed.length > 0) {
      const totalTime = reviewed.reduce((sum, item) => {
        if (item.reviewedAt) {
          return sum + (item.reviewedAt.getTime() - item.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgReviewTimeMs = totalTime / reviewed.length;
    }

    // Find oldest pending
    let oldestPendingAge = 0;
    if (pending.length > 0) {
      const oldest = pending.reduce((oldest, item) =>
        item.createdAt < oldest.createdAt ? item : oldest
      );
      oldestPendingAge = Date.now() - oldest.createdAt.getTime();
    }

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      modified: modified.length,
      expired: expired.length,
      avgReviewTimeMs,
      oldestPendingAge,
    };
  }

  /**
   * Get items by type
   */
  getByType(type: ReviewItem['type']): ReviewItem[] {
    return Array.from(this.items.values())
      .filter(item => item.type === type);
  }

  /**
   * Get approved items ready for integration
   */
  getApprovedForIntegration(): ReviewItem[] {
    return Array.from(this.items.values())
      .filter(item =>
        (item.status === 'approved' || item.status === 'modified') &&
        item.generatedCode
      );
  }

  /**
   * Mark an item as integrated (remove from queue)
   */
  markIntegrated(id: string): void {
    this.items.delete(id);
  }

  /**
   * Export queue state (for persistence)
   */
  export(): ReviewItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Import queue state (from persistence)
   */
  import(items: ReviewItem[]): void {
    for (const item of items) {
      // Restore Date objects
      item.createdAt = new Date(item.createdAt);
      item.updatedAt = new Date(item.updatedAt);
      item.expiresAt = new Date(item.expiresAt);
      if (item.reviewedAt) item.reviewedAt = new Date(item.reviewedAt);

      this.items.set(item.id, item);
    }
  }

  /**
   * Clear all items (for testing)
   */
  clear(): void {
    this.items.clear();
  }

  // ============ Private Methods ============

  private generateId(): string {
    return `review_${Date.now()}_${++this.itemCounter}`;
  }

  private determinePriority(gap: Gap, validation: ValidationResult): ReviewItem['priority'] {
    // Critical if axiom tension or validation has violations
    if (gap.type === 'axiom_tension') return 'critical';
    if (validation.violations.length > 0) return 'high';

    // High if gap is high severity
    if (gap.severity === 'critical') return 'critical';
    if (gap.severity === 'high') return 'high';

    // Medium for most things
    if (gap.severity === 'medium') return 'medium';

    return 'low';
  }

  private enforceMaxPending(): void {
    const pending = this.listPending();

    if (pending.length > this.config.maxPending) {
      // Expire oldest low-priority items
      const lowPriority = pending
        .filter(i => i.priority === 'low')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      let toRemove = pending.length - this.config.maxPending;
      for (const item of lowPriority) {
        if (toRemove <= 0) break;
        item.status = 'expired';
        item.updatedAt = new Date();
        this.items.set(item.id, item);
        toRemove--;
      }
    }
  }

  private expireOldItems(): void {
    const now = Date.now();

    for (const item of this.items.values()) {
      if (item.status === 'pending' && item.expiresAt.getTime() < now) {
        item.status = 'expired';
        item.updatedAt = new Date();
        this.items.set(item.id, item);
      }
    }
  }
}

/**
 * Format a review item for display
 */
export function formatReviewItem(item: ReviewItem): string {
  const lines: string[] = [];

  lines.push(`┌─────────────────────────────────────────────────────────────`);
  lines.push(`│ Review: ${item.id}`);
  lines.push(`│ Type: ${item.type} | Status: ${item.status} | Priority: ${item.priority}`);
  lines.push(`├─────────────────────────────────────────────────────────────`);

  // Gap info
  lines.push(`│ Gap: ${item.sourceGap.type} (${item.sourceGap.severity})`);
  lines.push(`│ ${item.sourceGap.description.slice(0, 60)}...`);

  if (item.generatedCode) {
    lines.push(`├─────────────────────────────────────────────────────────────`);
    lines.push(`│ Generated: ${item.generatedCode.type} "${item.generatedCode.name}"`);
    lines.push(`│ Target: ${item.generatedCode.targetFile}`);
  }

  if (item.validation) {
    lines.push(`├─────────────────────────────────────────────────────────────`);
    lines.push(`│ Validation: ${item.validation.valid ? '✓ VALID' : '✗ INVALID'} (score: ${item.validation.score.toFixed(2)})`);
    if (item.validation.violations.length > 0) {
      lines.push(`│ Violations: ${item.validation.violations.map(v => v.axiomId).join(', ')}`);
    }
    if (item.validation.warnings.length > 0) {
      lines.push(`│ Warnings: ${item.validation.warnings.length}`);
    }
  }

  if (item.feedback) {
    lines.push(`├─────────────────────────────────────────────────────────────`);
    lines.push(`│ Reviewer: ${item.reviewer}`);
    lines.push(`│ Decision: ${item.feedback.decision}`);
    lines.push(`│ Reason: ${item.feedback.reason.slice(0, 50)}...`);
  }

  lines.push(`└─────────────────────────────────────────────────────────────`);

  return lines.join('\n');
}
