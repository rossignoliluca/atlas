/**
 * ECF Modes: Four dimensions for further characterization
 * Composition, Origin, Temporality, Localization
 */

/**
 * The four modes
 */
export type Mode = 'COMPOSITION' | 'ORIGIN' | 'TEMPORALITY' | 'LOCALIZATION';

/**
 * Composition: What is the entity made of?
 */
export type CompositionType =
  | 'SIMPLE'      // Irreducible (quarks, monads)
  | 'COMPOSITE'   // Made of parts
  | 'EMERGENT'    // Properties not in parts
  | 'VIRTUAL'     // No physical substrate
  | 'HYBRID';     // Mixed composition

/**
 * Origin: How did the entity come to be?
 */
export type OriginType =
  | 'NATURAL'     // Through natural processes
  | 'DESIGNED'    // Intentionally created
  | 'EVOLVED'     // Through selection
  | 'EMERGED'     // Spontaneously from interactions
  | 'INSTITUTED'  // Through social agreement
  | 'ETERNAL';    // No origin (if such exists)

/**
 * Temporality: How does the entity relate to time?
 */
export type TemporalityType =
  | 'MOMENTARY'   // Exists briefly
  | 'PERSISTENT'  // Endures through time
  | 'CYCLIC'      // Repeats
  | 'DEVELOPING'  // Changes according to pattern
  | 'ATEMPORAL';  // Outside time (mathematical objects)

/**
 * Localization: Where is the entity?
 */
export type LocalizationType =
  | 'LOCATED'     // Has specific location
  | 'DISTRIBUTED' // Spread across locations
  | 'UBIQUITOUS'  // Everywhere
  | 'NOWHERE'     // No spatial location
  | 'VIRTUAL';    // In virtual/abstract space

/**
 * Complete mode configuration for an entity
 */
export interface ModeConfiguration {
  composition: CompositionType;
  origin: OriginType;
  temporality: TemporalityType;
  localization: LocalizationType;
}

/**
 * Mode information
 */
export const MODE_INFO: Record<Mode, {
  name: string;
  question: string;
  description: string;
}> = {
  COMPOSITION: {
    name: 'Composition',
    question: 'What is E made of?',
    description: 'The material/structural constitution of the entity',
  },
  ORIGIN: {
    name: 'Origin',
    question: 'How did E come to be?',
    description: 'The causal history and genesis of the entity',
  },
  TEMPORALITY: {
    name: 'Temporality',
    question: 'How does E relate to time?',
    description: 'The temporal mode of existence',
  },
  LOCALIZATION: {
    name: 'Localization',
    question: 'Where is E?',
    description: 'The spatial mode of existence',
  },
};

/**
 * Common mode configurations for different entity types
 */
export const MODE_TEMPLATES: Record<string, ModeConfiguration> = {
  physical_object: {
    composition: 'COMPOSITE',
    origin: 'NATURAL',
    temporality: 'PERSISTENT',
    localization: 'LOCATED',
  },
  living_organism: {
    composition: 'EMERGENT',
    origin: 'EVOLVED',
    temporality: 'DEVELOPING',
    localization: 'LOCATED',
  },
  institution: {
    composition: 'EMERGENT',
    origin: 'INSTITUTED',
    temporality: 'PERSISTENT',
    localization: 'DISTRIBUTED',
  },
  software: {
    composition: 'VIRTUAL',
    origin: 'DESIGNED',
    temporality: 'PERSISTENT',
    localization: 'VIRTUAL',
  },
  event: {
    composition: 'EMERGENT',
    origin: 'EMERGED',
    temporality: 'MOMENTARY',
    localization: 'LOCATED',
  },
  mathematical_object: {
    composition: 'SIMPLE',
    origin: 'ETERNAL',
    temporality: 'ATEMPORAL',
    localization: 'NOWHERE',
  },
  artwork: {
    composition: 'HYBRID',
    origin: 'DESIGNED',
    temporality: 'PERSISTENT',
    localization: 'LOCATED',
  },
  tradition: {
    composition: 'EMERGENT',
    origin: 'EVOLVED',
    temporality: 'CYCLIC',
    localization: 'DISTRIBUTED',
  },
};

/**
 * Validate mode configuration
 */
export function validateModeConfiguration(config: ModeConfiguration): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for unusual combinations
  if (config.localization === 'NOWHERE' && config.composition === 'COMPOSITE') {
    warnings.push('NOWHERE + COMPOSITE is unusual: composite things usually have location');
  }

  if (config.temporality === 'ATEMPORAL' && config.origin !== 'ETERNAL') {
    warnings.push('ATEMPORAL entities typically have ETERNAL origin');
  }

  if (config.composition === 'VIRTUAL' && config.localization === 'LOCATED') {
    warnings.push('VIRTUAL entities are typically not simply LOCATED');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Mode compatibility with domains
 */
export function suggestModesForDomain(domain: string): Partial<ModeConfiguration> {
  switch (domain) {
    case 'INERT':
      return {
        composition: 'COMPOSITE',
        origin: 'NATURAL',
        temporality: 'PERSISTENT',
      };
    case 'LIVING':
      return {
        composition: 'EMERGENT',
        origin: 'EVOLVED',
        temporality: 'DEVELOPING',
      };
    case 'IDEAL':
      return {
        composition: 'SIMPLE',
        origin: 'ETERNAL',
        temporality: 'ATEMPORAL',
        localization: 'NOWHERE',
      };
    case 'ARTIFICIAL':
      return {
        origin: 'DESIGNED',
      };
    case 'COLLECTIVE':
      return {
        composition: 'EMERGENT',
        origin: 'INSTITUTED',
        localization: 'DISTRIBUTED',
      };
    default:
      return {};
  }
}

/**
 * Compare mode configurations
 */
export function compareModes(a: ModeConfiguration, b: ModeConfiguration): {
  same: Mode[];
  different: Mode[];
  similarity: number;
} {
  const modes: Mode[] = ['COMPOSITION', 'ORIGIN', 'TEMPORALITY', 'LOCALIZATION'];
  const same: Mode[] = [];
  const different: Mode[] = [];

  if (a.composition === b.composition) same.push('COMPOSITION');
  else different.push('COMPOSITION');

  if (a.origin === b.origin) same.push('ORIGIN');
  else different.push('ORIGIN');

  if (a.temporality === b.temporality) same.push('TEMPORALITY');
  else different.push('TEMPORALITY');

  if (a.localization === b.localization) same.push('LOCALIZATION');
  else different.push('LOCALIZATION');

  return {
    same,
    different,
    similarity: same.length / modes.length,
  };
}
