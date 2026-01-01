/**
 * ECF Autopoietic Protocols
 *
 * Atlas extends itself through four protocols:
 * - Protocol A: New Entity (characterize something new)
 * - Protocol B: Explore Boundary (probe entity limits)
 * - Protocol C: Integrate Tradition (incorporate wisdom)
 * - Protocol D: Apply to Problem (practical application)
 */

import { Entity, Protocol, ProtocolStep, Geometry, EntityConfiguration } from '../core/types';
import { Domain } from '../core/domains';
import { Stratum, StrataSet } from '../core/strata';

/**
 * Protocol A: New Entity
 * Triggered when encountering something not yet characterized
 */
export const PROTOCOL_A: Protocol = {
  id: 'A',
  name: 'New Entity Protocol',
  trigger: 'Encounter with uncharacterized entity',
  steps: [
    {
      order: 1,
      action: 'Apply G1 (Distinction): Draw provisional boundary',
      output: 'Boundary definition and uncertainty estimate',
    },
    {
      order: 2,
      action: 'Apply G2 (Transformation): Identify maintaining processes',
      output: 'List of processes that maintain entity identity',
    },
    {
      order: 3,
      action: 'Estimate Closure (C): Degree of self-production',
      output: 'C value [0,1] with justification',
    },
    {
      order: 4,
      action: 'Estimate Scope (S): Field of relevance',
      output: 'S value [0,∞) with justification',
    },
    {
      order: 5,
      action: 'Determine Strata (Σ): Which levels does it reach?',
      output: 'Strata set with evidence',
    },
    {
      order: 6,
      action: 'Identify Capabilities (K): What can it do?',
      output: 'Capability set derived from strata',
    },
    {
      order: 7,
      action: 'Assign Domain: Which of the 8 domains?',
      output: 'Primary domain with rationale',
    },
    {
      order: 8,
      action: 'Determine Modes: Composition, Origin, Temporality, Localization',
      output: 'Complete mode configuration',
    },
    {
      order: 9,
      action: 'Record Relations (R): Connections to known entities',
      output: 'Relation graph',
    },
    {
      order: 10,
      action: 'Assign Uncertainty (U): How confident is this characterization?',
      output: 'U value [0,1]',
    },
  ],
};

/**
 * Protocol B: Explore Boundary
 * Triggered when an existing boundary seems problematic
 */
export const PROTOCOL_B: Protocol = {
  id: 'B',
  name: 'Boundary Exploration Protocol',
  trigger: 'Boundary dispute, edge case, or classification problem',
  steps: [
    {
      order: 1,
      action: 'Identify the problematic boundary',
      output: 'Description of the boundary in question',
    },
    {
      order: 2,
      action: 'List competing boundary proposals',
      output: 'Alternative ways to draw the boundary',
    },
    {
      order: 3,
      action: 'Apply G6 (Quality): What values are at stake?',
      output: 'Normative implications of each proposal',
    },
    {
      order: 4,
      action: 'Test with edge cases',
      output: 'How each proposal handles borderline cases',
    },
    {
      order: 5,
      action: 'Consider pragmatic consequences',
      output: 'What happens if we adopt each proposal?',
    },
    {
      order: 6,
      action: 'Propose resolution or acknowledge irreducible plurality',
      output: 'Recommended boundary or documented disagreement',
    },
    {
      order: 7,
      action: 'Update affected entities',
      output: 'Revised characterizations if needed',
    },
  ],
};

/**
 * Protocol C: Integrate Tradition
 * Triggered when encountering wisdom from another tradition
 */
export const PROTOCOL_C: Protocol = {
  id: 'C',
  name: 'Tradition Integration Protocol',
  trigger: 'Encounter with concept from wisdom tradition not yet integrated',
  steps: [
    {
      order: 1,
      action: 'Identify the tradition and its source concepts',
      output: 'Tradition name, key texts, core concepts',
    },
    {
      order: 2,
      action: 'Map concepts to ECF vocabulary',
      output: 'Translation table: tradition term → ECF term',
    },
    {
      order: 3,
      action: 'Identify unique contributions',
      output: 'What does this tradition add that ECF lacks?',
    },
    {
      order: 4,
      action: 'Identify tensions and conflicts',
      output: 'Where does the tradition disagree with current ECF?',
    },
    {
      order: 5,
      action: 'Propose extensions to ECF if warranted',
      output: 'New distinctions, capabilities, or domains to add',
    },
    {
      order: 6,
      action: 'Document the mapping in wisdom module',
      output: 'Updated wisdom mappings',
    },
  ],
};

/**
 * Protocol D: Apply to Problem
 * Triggered when using Atlas to address a practical question
 */
export const PROTOCOL_D: Protocol = {
  id: 'D',
  name: 'Problem Application Protocol',
  trigger: 'Practical question requiring entity characterization',
  steps: [
    {
      order: 1,
      action: 'Clarify the problem and stakeholders',
      output: 'Problem statement and who cares about the answer',
    },
    {
      order: 2,
      action: 'Identify relevant entities',
      output: 'List of entities involved in the problem',
    },
    {
      order: 3,
      action: 'Characterize entities using Protocol A if needed',
      output: 'Entity configurations',
    },
    {
      order: 4,
      action: 'Map relations between entities',
      output: 'Relation graph for the problem domain',
    },
    {
      order: 5,
      action: 'Identify the key question in ECF terms',
      output: 'Question translated into ECF vocabulary',
    },
    {
      order: 6,
      action: 'Apply relevant geometries systematically',
      output: 'Geometric analysis results',
    },
    {
      order: 7,
      action: 'Synthesize answer',
      output: 'Answer to original problem',
    },
    {
      order: 8,
      action: 'Note what Atlas learned',
      output: 'Feedback to improve future characterizations',
    },
  ],
};

/**
 * All protocols
 */
export const PROTOCOLS: Protocol[] = [PROTOCOL_A, PROTOCOL_B, PROTOCOL_C, PROTOCOL_D];

/**
 * Execute Protocol A: New Entity
 */
export function executeProtocolA(input: {
  name: string;
  description: string;
  initialObservations: string[];
}): Partial<Entity> {
  // This would be expanded with actual implementation
  // For now, returns a template to be filled in
  return {
    name: input.name,
    description: input.description,
    config: {
      closure: 0.5, // Placeholder
      scope: 0.5,   // Placeholder
      strata: {
        MATTER: true,
        LIFE: false,
        SENTIENCE: false,
        LOGOS: false,
      },
      capabilities: new Set(['PERSIST']),
      relations: [],
      uncertainty: 0.8, // High uncertainty for new characterizations
    },
    meta: {
      notes: [
        `Initial observations: ${input.initialObservations.join('; ')}`,
        'Characterization pending full Protocol A execution',
      ],
    },
  };
}

/**
 * Protocol execution tracking
 */
export interface ProtocolExecution {
  protocolId: 'A' | 'B' | 'C' | 'D';
  startedAt: Date;
  completedAt?: Date;
  currentStep: number;
  stepOutputs: Record<number, string>;
  status: 'in_progress' | 'completed' | 'abandoned';
}

/**
 * Create new protocol execution
 */
export function startProtocol(protocolId: 'A' | 'B' | 'C' | 'D'): ProtocolExecution {
  return {
    protocolId,
    startedAt: new Date(),
    currentStep: 1,
    stepOutputs: {},
    status: 'in_progress',
  };
}

/**
 * Advance protocol execution
 */
export function advanceProtocol(
  execution: ProtocolExecution,
  output: string
): ProtocolExecution {
  const protocol = PROTOCOLS.find(p => p.id === execution.protocolId)!;
  const newExecution = {
    ...execution,
    stepOutputs: {
      ...execution.stepOutputs,
      [execution.currentStep]: output,
    },
  };

  if (execution.currentStep >= protocol.steps.length) {
    newExecution.status = 'completed';
    newExecution.completedAt = new Date();
  } else {
    newExecution.currentStep = execution.currentStep + 1;
  }

  return newExecution;
}

/**
 * Get current step description
 */
export function getCurrentStep(execution: ProtocolExecution): ProtocolStep | null {
  const protocol = PROTOCOLS.find(p => p.id === execution.protocolId);
  if (!protocol) return null;
  return protocol.steps.find(s => s.order === execution.currentStep) || null;
}
