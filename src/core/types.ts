/**
 * Entity Characterization Framework (ECF) v0.1
 * Core Types
 */

import { Closure, Scope } from './axes';
import { StrataSet } from './strata';
import { CapabilitySet } from './capabilities';
import { Domain } from './domains';
import { Mode, ModeConfiguration } from './modes';

/**
 * An entity is a difference that maintains itself and makes a difference.
 */
export interface Entity {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Entity configuration */
  config: EntityConfiguration;

  /** Optional description */
  description?: string;

  /** Primary domain classification */
  domain: Domain;

  /** Mode configuration */
  modes: ModeConfiguration;

  /** Metadata */
  meta?: EntityMetadata;
}

/**
 * Config(E) = { C, S, Σ, K, R, U }
 * The complete configuration of an entity
 */
export interface EntityConfiguration {
  /** C: Closure [0,1] - degree of self-production */
  closure: Closure;

  /** S: Scope [0,∞) - extent of relevance field */
  scope: Scope;

  /** Σ: Strata - which strata E participates in */
  strata: StrataSet;

  /** K: Capabilities - active capabilities */
  capabilities: CapabilitySet;

  /** R: Relations - connections to other entities */
  relations: EntityRelation[];

  /** U: Uncertainty [0,1] - confidence in characterization */
  uncertainty: number;
}

/**
 * Relation between entities
 */
export interface EntityRelation {
  /** Target entity ID */
  targetId: string;

  /** Relation type */
  type: RelationType;

  /** Relation strength [0,1] */
  strength: number;

  /** Optional description */
  description?: string;
}

/**
 * Types of relations between entities
 */
export type RelationType =
  | 'part_of'        // E is part of target (Inclusion)
  | 'contains'       // E contains target (Inclusion)
  | 'depends_on'     // E depends on target
  | 'produces'       // E produces target
  | 'observes'       // E observes target
  | 'transforms'     // E transforms target
  | 'connects_to'    // E connects to target (symmetric)
  | 'inherits_from'  // E inherits from target
  | 'instantiates';  // E is instance of target

/**
 * Metadata for entity characterization
 */
export interface EntityMetadata {
  /** Who characterized this entity */
  characterizedBy?: string;

  /** When characterized */
  characterizedAt?: Date;

  /** Source documents/references */
  sources?: string[];

  /** Version of characterization */
  version?: string;

  /** Notes */
  notes?: string[];
}

/**
 * Result of applying a geometry to an entity
 */
export interface GeometricAnalysis {
  /** Entity being analyzed */
  entityId: string;

  /** Geometry applied */
  geometry: Geometry;

  /** Analysis results */
  results: {
    /** Primary findings */
    findings: string[];

    /** Questions raised */
    questions: string[];

    /** Connections discovered */
    connections: EntityRelation[];

    /** Confidence [0,1] */
    confidence: number;
  };
}

/**
 * The six geometries
 */
export type Geometry =
  | 'DISTINCTION'   // G1: Boundary
  | 'TRANSFORMATION'// G2: Process
  | 'INCLUSION'     // G3: Hierarchy
  | 'CONNECTION'    // G4: Relation
  | 'REFLEXION'     // G5: Self-reference
  | 'QUALITY';      // G6: Valuation

/**
 * Protocol for extending Atlas
 */
export interface Protocol {
  /** Protocol identifier */
  id: 'A' | 'B' | 'C' | 'D';

  /** Protocol name */
  name: string;

  /** When to use this protocol */
  trigger: string;

  /** Steps to execute */
  steps: ProtocolStep[];
}

/**
 * Step in a protocol
 */
export interface ProtocolStep {
  /** Step number */
  order: number;

  /** Action to take */
  action: string;

  /** Expected output */
  output: string;
}

/**
 * Comparison between two entities
 */
export interface EntityComparison {
  /** First entity */
  entityA: string;

  /** Second entity */
  entityB: string;

  /** Closure difference */
  closureDelta: number;

  /** Scope difference */
  scopeDelta: number;

  /** Strata overlap */
  strataOverlap: number;

  /** Shared capabilities */
  sharedCapabilities: string[];

  /** Shared domain */
  sameDomain: boolean;

  /** Overall similarity [0,1] */
  similarity: number;
}
