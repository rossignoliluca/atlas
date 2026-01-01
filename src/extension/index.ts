/**
 * Extension Layer
 *
 * Manages self-extension of the Atlas framework.
 * IMPORTANT: AXIS/ is frozen. Extensions go to EXTENSIONS/.
 */

import { Entity } from '../core/types';
import { Domain, DOMAIN_INFO } from '../core/domains';
import { Capability, CAPABILITY_INFO } from '../core/capabilities';
import { Mode, ModeConfiguration } from '../core/modes';
import { AxiomValidator, AxiomViolation } from '../engine/characterizer';
import { Hypothesis, ExtensionProposal } from '../engine';

/**
 * Extension types
 */
export type ExtensionType =
  | 'new_capability'
  | 'new_domain'
  | 'new_mode_value'
  | 'new_relation_type'
  | 'threshold_adjustment'
  | 'axiom_clarification';

/**
 * Proposed extension details
 */
export interface ExtensionDetails {
  // For new_capability
  capability?: {
    name: string;
    stratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS';
    description: string;
    indicators: string[];
    prerequisites: string[];
  };

  // For new_domain
  domain?: {
    name: string;
    description: string;
    typicalStrata: string[];
    typicalClosureRange: [number, number];
    typicalScopeRange: [number, number];
    examples: string[];
  };

  // For new_mode_value
  modeValue?: {
    mode: Mode;
    value: string;
    description: string;
  };

  // For threshold_adjustment
  threshold?: {
    name: string;
    currentValue: number;
    proposedValue: number;
    rationale: string;
  };

  // For axiom_clarification
  axiom?: {
    axiomId: string;
    clarification: string;
    examples: string[];
  };
}

/**
 * Full extension proposal
 */
export interface FullExtensionProposal {
  id: string;
  type: ExtensionType;
  title: string;
  description: string;
  rationale: string;
  details: ExtensionDetails;
  evidence: string[];
  axiomCompatibility: AxiomCompatibility;
  testCases: TestCase[];
  impact: ImpactAssessment;
  status: 'proposed' | 'under_review' | 'approved' | 'rejected' | 'integrated';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

/**
 * Axiom compatibility check
 */
export interface AxiomCompatibility {
  compatible: boolean;
  checkedAxioms: string[];
  potentialConflicts: Array<{
    axiom: string;
    concern: string;
    severity: 'blocking' | 'warning';
  }>;
}

/**
 * Test case for extension
 */
export interface TestCase {
  description: string;
  input: any;
  expectedOutput: any;
  passes?: boolean;
}

/**
 * Impact assessment
 */
export interface ImpactAssessment {
  affectedEntities: number;
  requiresRecharacterization: boolean;
  backwardsCompatible: boolean;
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Extension Engine
 * Manages the proposal, review, and integration of framework extensions
 */
export class ExtensionEngine {
  private proposals: Map<string, FullExtensionProposal> = new Map();

  constructor(private validator: AxiomValidator) {}

  /**
   * Create extension proposal from hypothesis
   */
  async propose(hypothesis: Hypothesis): Promise<FullExtensionProposal | null> {
    if (hypothesis.type !== 'framework_limitation') {
      return null;
    }

    // Analyze the limitation to determine extension type
    const extensionType = this.determineExtensionType(hypothesis);
    if (!extensionType) {
      return null;
    }

    const proposal: FullExtensionProposal = {
      id: `ext_${Date.now()}`,
      type: extensionType,
      title: this.generateTitle(hypothesis, extensionType),
      description: hypothesis.content.suggestion || 'Framework extension proposal',
      rationale: hypothesis.evidence.join('; '),
      details: this.generateDetails(hypothesis, extensionType),
      evidence: hypothesis.evidence,
      axiomCompatibility: await this.checkAxiomCompatibility(extensionType),
      testCases: this.generateTestCases(extensionType),
      impact: await this.assessImpact(extensionType),
      status: 'proposed',
      createdAt: new Date(),
    };

    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * Determine what type of extension is needed
   */
  private determineExtensionType(hypothesis: Hypothesis): ExtensionType | null {
    const content = hypothesis.content;

    if (content.anomalyDescription?.includes('closure') && content.anomalyDescription?.includes('scope')) {
      return 'axiom_clarification';
    }

    if (content.suggestion?.includes('new capability')) {
      return 'new_capability';
    }

    if (content.suggestion?.includes('new domain')) {
      return 'new_domain';
    }

    // Default: axiom clarification for framework limitation hypotheses
    return 'axiom_clarification';
  }

  /**
   * Generate proposal title
   */
  private generateTitle(hypothesis: Hypothesis, type: ExtensionType): string {
    switch (type) {
      case 'new_capability':
        return 'Proposal: Add New Capability';
      case 'new_domain':
        return 'Proposal: Add New Domain';
      case 'axiom_clarification':
        return 'Proposal: Clarify Axiom Interpretation';
      case 'threshold_adjustment':
        return 'Proposal: Adjust Threshold Value';
      default:
        return 'Proposal: Framework Extension';
    }
  }

  /**
   * Generate extension details based on type
   */
  private generateDetails(hypothesis: Hypothesis, type: ExtensionType): ExtensionDetails {
    switch (type) {
      case 'axiom_clarification':
        return {
          axiom: {
            axiomId: 'A3', // C-S tension is most common
            clarification: hypothesis.content.suggestion || 'Further clarification needed',
            examples: hypothesis.content.entities || [],
          },
        };

      case 'new_capability':
        return {
          capability: {
            name: 'UNNAMED',
            stratum: 'LOGOS',
            description: 'Capability description needed',
            indicators: [],
            prerequisites: [],
          },
        };

      case 'new_domain':
        return {
          domain: {
            name: 'UNNAMED',
            description: 'Domain description needed',
            typicalStrata: ['MATTER'],
            typicalClosureRange: [0, 1],
            typicalScopeRange: [0, 1],
            examples: [],
          },
        };

      default:
        return {};
    }
  }

  /**
   * Check compatibility with existing axioms
   */
  private async checkAxiomCompatibility(type: ExtensionType): Promise<AxiomCompatibility> {
    const compatibility: AxiomCompatibility = {
      compatible: true,
      checkedAxioms: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'],
      potentialConflicts: [],
    };

    // Type-specific checks
    switch (type) {
      case 'new_capability':
        // Must not violate A5 (capability emergence)
        compatibility.potentialConflicts.push({
          axiom: 'A5',
          concern: 'New capability must fit into stratal hierarchy',
          severity: 'warning',
        });
        break;

      case 'new_domain':
        // Must not violate A6 (geometric completeness)
        compatibility.potentialConflicts.push({
          axiom: 'A6',
          concern: 'New domain must be characterizable via all six geometries',
          severity: 'warning',
        });
        break;

      case 'threshold_adjustment':
        // Must not violate A4 (stratal nesting)
        compatibility.potentialConflicts.push({
          axiom: 'A4',
          concern: 'Threshold change must maintain stratal order',
          severity: 'blocking',
        });
        break;
    }

    // If any blocking conflicts, mark as incompatible
    if (compatibility.potentialConflicts.some(c => c.severity === 'blocking')) {
      compatibility.compatible = false;
    }

    return compatibility;
  }

  /**
   * Generate test cases for extension
   */
  private generateTestCases(type: ExtensionType): TestCase[] {
    const testCases: TestCase[] = [];

    // Generic test: extension should not break existing characterizations
    testCases.push({
      description: 'Existing catalog entities remain valid after extension',
      input: 'catalog_entities',
      expectedOutput: 'all_valid',
    });

    // Type-specific tests
    switch (type) {
      case 'new_capability':
        testCases.push({
          description: 'New capability has valid prerequisites',
          input: 'capability_prerequisites',
          expectedOutput: 'valid_chain',
        });
        break;

      case 'new_domain':
        testCases.push({
          description: 'At least 3 example entities fit new domain',
          input: 'domain_examples',
          expectedOutput: 'valid_examples',
        });
        break;
    }

    return testCases;
  }

  /**
   * Assess impact of proposed extension
   */
  private async assessImpact(type: ExtensionType): Promise<ImpactAssessment> {
    // Default impact assessment
    const impact: ImpactAssessment = {
      affectedEntities: 0,
      requiresRecharacterization: false,
      backwardsCompatible: true,
      complexity: 'low',
    };

    switch (type) {
      case 'new_capability':
        impact.complexity = 'medium';
        impact.backwardsCompatible = true; // Adding is always compatible
        break;

      case 'new_domain':
        impact.complexity = 'medium';
        impact.backwardsCompatible = true;
        break;

      case 'threshold_adjustment':
        impact.requiresRecharacterization = true;
        impact.complexity = 'high';
        impact.affectedEntities = 100; // Estimate
        break;

      case 'axiom_clarification':
        impact.complexity = 'low';
        impact.backwardsCompatible = true;
        break;
    }

    return impact;
  }

  /**
   * Approve extension proposal
   */
  async approve(proposal: FullExtensionProposal, reviewer?: string): Promise<void> {
    proposal.status = 'approved';
    proposal.reviewedAt = new Date();
    proposal.reviewedBy = reviewer;
    this.proposals.set(proposal.id, proposal);

    // In production: trigger integration
    console.log(`Extension ${proposal.id} approved. Ready for integration.`);
  }

  /**
   * Reject extension proposal
   */
  async reject(proposal: FullExtensionProposal, reason: string, reviewer?: string): Promise<void> {
    proposal.status = 'rejected';
    proposal.reviewedAt = new Date();
    proposal.reviewedBy = reviewer;
    proposal.reviewNotes = reason;
    this.proposals.set(proposal.id, proposal);
  }

  /**
   * List all proposals
   */
  list(filter?: { status?: string }): FullExtensionProposal[] {
    let proposals = Array.from(this.proposals.values());

    if (filter?.status) {
      proposals = proposals.filter(p => p.status === filter.status);
    }

    return proposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get proposal by ID
   */
  get(id: string): FullExtensionProposal | undefined {
    return this.proposals.get(id);
  }
}

/**
 * Review Queue
 * Manages items awaiting human review
 */
export class ReviewQueue {
  private items: Map<string, ReviewItem> = new Map();

  /**
   * Add item to review queue
   */
  async add(item: Omit<ReviewItem, 'id' | 'created' | 'status'>): Promise<string> {
    const id = `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const reviewItem: ReviewItem = {
      id,
      ...item,
      created: new Date(),
      status: 'pending',
    };

    this.items.set(id, reviewItem);
    return id;
  }

  /**
   * Get item by ID
   */
  async get(id: string): Promise<ReviewItem | undefined> {
    return this.items.get(id);
  }

  /**
   * List all pending items
   */
  list(filter?: { type?: string; status?: string }): ReviewItem[] {
    let items = Array.from(this.items.values());

    if (filter?.type) {
      items = items.filter(i => i.type === filter.type);
    }

    if (filter?.status) {
      items = items.filter(i => i.status === filter.status);
    }

    return items.sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Resolve item (approve or reject)
   */
  async resolve(id: string, resolution: 'approved' | 'rejected', notes?: string): Promise<void> {
    const item = this.items.get(id);
    if (!item) return;

    item.status = resolution;
    item.resolvedAt = new Date();
    item.resolutionNotes = notes;

    this.items.set(id, item);
  }

  /**
   * Get queue statistics
   */
  stats(): { pending: number; approved: number; rejected: number } {
    const items = Array.from(this.items.values());
    return {
      pending: items.filter(i => i.status === 'pending').length,
      approved: items.filter(i => i.status === 'approved').length,
      rejected: items.filter(i => i.status === 'rejected').length,
    };
  }
}

/**
 * Review item
 */
export interface ReviewItem {
  id: string;
  type: 'characterization' | 'validation_failure' | 'extension';
  entity?: Entity;
  proposal?: FullExtensionProposal;
  reason: string;
  uncertainty?: number;
  created: Date;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: Date;
  resolutionNotes?: string;
}
