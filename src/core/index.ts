/**
 * ECF Core Module
 * Entity Characterization Framework v0.1
 */

// Types
export * from './types';

// Axes
export * from './axes';

// Strata
export * from './strata';

// Capabilities
export * from './capabilities';

// Domains
export * from './domains';

// Modes
export * from './modes';

/**
 * ECF Version
 */
export const ECF_VERSION = '0.1.0';

/**
 * Quick entity factory
 */
export function createEntity(
  id: string,
  name: string,
  config: {
    closure: number;
    scope: number;
    primaryStratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS';
    domain: import('./domains').Domain;
    modes?: Partial<import('./modes').ModeConfiguration>;
  }
): import('./types').Entity {
  const { strataFromPrimary } = require('./strata');
  const { getStratumCapabilities, createCapabilitySet } = require('./capabilities');
  const { validateClosure, validateScope } = require('./axes');
  const { MODE_TEMPLATES } = require('./modes');

  const strata = strataFromPrimary(config.primaryStratum);
  const capabilities = createCapabilitySet(getStratumCapabilities(config.primaryStratum));

  const defaultModes = MODE_TEMPLATES.physical_object;
  const modes = {
    ...defaultModes,
    ...config.modes,
  };

  return {
    id,
    name,
    domain: config.domain,
    modes,
    config: {
      closure: validateClosure(config.closure),
      scope: validateScope(config.scope),
      strata,
      capabilities,
      relations: [],
      uncertainty: 0.3, // Default uncertainty
    },
  };
}

/**
 * Atlas self-characterization
 */
export const ATLAS_SELF: import('./types').Entity = {
  id: 'atlas',
  name: 'Atlas (ECF Framework)',
  description: 'The Entity Characterization Framework characterizing itself',
  domain: 'SYMBOLIC',
  modes: {
    composition: 'EMERGENT',
    origin: 'DESIGNED',
    temporality: 'DEVELOPING',
    localization: 'DISTRIBUTED',
  },
  config: {
    closure: 0.45,  // Partially self-producing through protocols
    scope: 0.8,     // Aims to characterize any entity
    strata: {
      MATTER: true,  // Has physical substrate (documents, code)
      LIFE: false,   // Not biologically alive
      SENTIENCE: false, // No phenomenal experience
      LOGOS: true,   // Symbolic, normative
    },
    capabilities: new Set(['PERSIST', 'REPRESENT', 'NORM']),
    relations: [],
    uncertainty: 0.2,
  },
  meta: {
    version: '0.1.0',
    notes: [
      'Atlas is autopoietic: it can extend itself through protocols',
      'Closure is moderate: depends on users and implementers',
      'Scope is high: universal applicability is the goal',
    ],
  },
};
