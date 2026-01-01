/**
 * ECF Entity Catalog
 * 70+ characterized entities across all domains
 */

import { Entity } from '../core/types';
import { createCapabilitySet, getStratumCapabilities } from '../core/capabilities';
import { strataFromPrimary } from '../core/strata';

/**
 * Helper to create entity
 */
function entity(
  id: string,
  name: string,
  domain: Entity['domain'],
  closure: number,
  scope: number,
  primaryStratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS',
  modes: Entity['modes'],
  description?: string
): Entity {
  return {
    id,
    name,
    domain,
    description,
    modes,
    config: {
      closure,
      scope,
      strata: strataFromPrimary(primaryStratum),
      capabilities: createCapabilitySet(getStratumCapabilities(primaryStratum)),
      relations: [],
      uncertainty: 0.3,
    },
  };
}

// ============================================================
// DOMAIN: INERT (Non-living natural entities)
// ============================================================

export const ROCK = entity(
  'rock',
  'Rock',
  'INERT',
  0.05,
  0.15,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'NATURAL', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Passive, persists through physical properties'
);

export const WATER = entity(
  'water',
  'Water',
  'INERT',
  0.08,
  0.7,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'NATURAL', temporality: 'CYCLIC', localization: 'DISTRIBUTED' },
  'Flows, cycles, essential for life'
);

export const MOUNTAIN = entity(
  'mountain',
  'Mountain',
  'INERT',
  0.03,
  0.4,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'NATURAL', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Geological formation, very long persistence'
);

export const STAR = entity(
  'star',
  'Star',
  'INERT',
  0.15,
  0.6,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'NATURAL', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Self-sustaining fusion reaction'
);

export const RIVER = entity(
  'river',
  'River',
  'INERT',
  0.1,
  0.35,
  'MATTER',
  { composition: 'EMERGENT', origin: 'NATURAL', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Continuous flow, maintains identity despite constant change'
);

export const CRYSTAL = entity(
  'crystal',
  'Crystal',
  'INERT',
  0.12,
  0.1,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'NATURAL', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Ordered structure, grows by accretion'
);

export const ATMOSPHERE = entity(
  'atmosphere',
  'Atmosphere',
  'INERT',
  0.08,
  0.75,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'NATURAL', temporality: 'CYCLIC', localization: 'DISTRIBUTED' },
  'Gaseous envelope, global system'
);

// ============================================================
// DOMAIN: LIVING (Biological organisms)
// ============================================================

export const BACTERIUM = entity(
  'bacterium',
  'Bacterium',
  'LIVING',
  0.75,
  0.05,
  'LIFE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Simple autopoietic system'
);

export const PLANT = entity(
  'plant',
  'Plant',
  'LIVING',
  0.6,
  0.3,
  'LIFE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Photosynthetic, sessile organism'
);

export const TREE = entity(
  'tree',
  'Tree',
  'LIVING',
  0.55,
  0.4,
  'LIFE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Long-lived plant, ecosystem anchor'
);

export const FUNGUS = entity(
  'fungus',
  'Fungus',
  'LIVING',
  0.65,
  0.3,
  'LIFE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'DISTRIBUTED' },
  'Decomposer, network organism'
);

export const VIRUS = entity(
  'virus',
  'Virus',
  'LIVING', // Controversial - might be INERT
  0.2,
  0.5,
  'MATTER', // Only MATTER - not self-producing without host
  { composition: 'COMPOSITE', origin: 'EVOLVED', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Borderline case: requires host for reproduction'
);

export const ECOSYSTEM = entity(
  'ecosystem',
  'Ecosystem',
  'LIVING',
  0.5,
  0.6,
  'LIFE',
  { composition: 'EMERGENT', origin: 'EMERGED', temporality: 'CYCLIC', localization: 'DISTRIBUTED' },
  'Self-regulating biological community'
);

export const CELL = entity(
  'cell',
  'Cell',
  'LIVING',
  0.8,
  0.05,
  'LIFE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Fundamental unit of life, high autopoietic closure'
);

// ============================================================
// DOMAIN: SENTIENT (Conscious beings)
// ============================================================

export const DOG = entity(
  'dog',
  'Dog',
  'SENTIENT',
  0.55,
  0.35,
  'SENTIENCE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Social mammal, emotional intelligence'
);

export const CAT = entity(
  'cat',
  'Cat',
  'SENTIENT',
  0.6,
  0.25,
  'SENTIENCE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Independent mammal, territorial'
);

export const ELEPHANT = entity(
  'elephant',
  'Elephant',
  'SENTIENT',
  0.5,
  0.45,
  'SENTIENCE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Social intelligence, long memory'
);

export const OCTOPUS = entity(
  'octopus',
  'Octopus',
  'SENTIENT',
  0.6,
  0.2,
  'SENTIENCE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Distributed intelligence, problem-solving'
);

export const CORVID = entity(
  'corvid',
  'Corvid (Crow/Raven)',
  'SENTIENT',
  0.55,
  0.35,
  'SENTIENCE',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Tool use, planning, possible metacognition'
);

export const HUMAN = entity(
  'human',
  'Human',
  'SENTIENT', // Could also be SYMBOLIC or COLLECTIVE depending on focus
  0.6,
  0.6,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Full stratal depth, symbolic, normative'
);

export const INSECT = entity(
  'insect',
  'Insect',
  'SENTIENT', // Controversial
  0.65,
  0.15,
  'LIFE', // Sentience uncertain
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'LOCATED' },
  'Possible minimal sentience'
);

// ============================================================
// DOMAIN: SYMBOLIC (Cultural/linguistic entities)
// ============================================================

export const LANGUAGE = entity(
  'language',
  'Language',
  'SYMBOLIC',
  0.4,
  0.7,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'DEVELOPING', localization: 'DISTRIBUTED' },
  'Self-referential symbol system'
);

export const STORY = entity(
  'story',
  'Story/Narrative',
  'SYMBOLIC',
  0.25,
  0.6,
  'LOGOS',
  { composition: 'VIRTUAL', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Meaning-carrying structure'
);

export const THEORY = entity(
  'theory',
  'Scientific Theory',
  'SYMBOLIC',
  0.3,
  0.8,
  'LOGOS',
  { composition: 'VIRTUAL', origin: 'DESIGNED', temporality: 'DEVELOPING', localization: 'DISTRIBUTED' },
  'Explanatory framework, testable'
);

export const MYTH = entity(
  'myth',
  'Myth',
  'SYMBOLIC',
  0.35,
  0.7,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'CYCLIC', localization: 'DISTRIBUTED' },
  'Sacred narrative, meaning-making'
);

export const ARTWORK = entity(
  'artwork',
  'Artwork',
  'SYMBOLIC',
  0.3,
  0.5,
  'LOGOS',
  { composition: 'HYBRID', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Aesthetic object, requires interpretation'
);

export const MEME = entity(
  'meme',
  'Meme (Cultural)',
  'SYMBOLIC',
  0.2,
  0.6,
  'LOGOS',
  { composition: 'VIRTUAL', origin: 'EVOLVED', temporality: 'MOMENTARY', localization: 'DISTRIBUTED' },
  'Replicating cultural unit'
);

export const RITUAL = entity(
  'ritual',
  'Ritual',
  'SYMBOLIC',
  0.35,
  0.5,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'INSTITUTED', temporality: 'CYCLIC', localization: 'DISTRIBUTED' },
  'Repeated symbolic action'
);

// ============================================================
// DOMAIN: COLLECTIVE (Groups and institutions)
// ============================================================

export const FAMILY = entity(
  'family',
  'Family',
  'COLLECTIVE',
  0.5,
  0.35,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'NATURAL', temporality: 'DEVELOPING', localization: 'DISTRIBUTED' },
  'Primary social unit'
);

export const COMPANY = entity(
  'company',
  'Company/Corporation',
  'COLLECTIVE',
  0.45,
  0.6,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'INSTITUTED', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Economic institution'
);

export const NATION = entity(
  'nation',
  'Nation',
  'COLLECTIVE',
  0.4,
  0.75,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Imagined community, territorial'
);

export const RELIGION = entity(
  'religion',
  'Religion',
  'COLLECTIVE',
  0.5,
  0.8,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EVOLVED', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Shared belief system with rituals'
);

export const UNIVERSITY = entity(
  'university',
  'University',
  'COLLECTIVE',
  0.4,
  0.6,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'INSTITUTED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Knowledge institution'
);

export const CITY = entity(
  'city',
  'City',
  'COLLECTIVE',
  0.35,
  0.55,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EMERGED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Urban collective'
);

export const TEAM = entity(
  'team',
  'Team',
  'COLLECTIVE',
  0.35,
  0.3,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'INSTITUTED', temporality: 'MOMENTARY', localization: 'DISTRIBUTED' },
  'Coordinated group'
);

export const SOCIAL_MOVEMENT = entity(
  'social_movement',
  'Social Movement',
  'COLLECTIVE',
  0.3,
  0.65,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EMERGED', temporality: 'MOMENTARY', localization: 'DISTRIBUTED' },
  'Collective action for change'
);

// ============================================================
// DOMAIN: IDEAL (Abstract entities)
// ============================================================

export const NUMBER = entity(
  'number',
  'Number',
  'IDEAL',
  0.95,
  0.95,
  'LOGOS',
  { composition: 'SIMPLE', origin: 'ETERNAL', temporality: 'ATEMPORAL', localization: 'NOWHERE' },
  'Mathematical object, discovered not invented'
);

export const GEOMETRIC_FORM = entity(
  'geometric_form',
  'Geometric Form',
  'IDEAL',
  0.95,
  0.9,
  'LOGOS',
  { composition: 'SIMPLE', origin: 'ETERNAL', temporality: 'ATEMPORAL', localization: 'NOWHERE' },
  'Abstract shape'
);

export const LOGICAL_LAW = entity(
  'logical_law',
  'Logical Law',
  'IDEAL',
  0.98,
  0.98,
  'LOGOS',
  { composition: 'SIMPLE', origin: 'ETERNAL', temporality: 'ATEMPORAL', localization: 'NOWHERE' },
  'e.g., Law of non-contradiction'
);

export const SET = entity(
  'set',
  'Set (Mathematical)',
  'IDEAL',
  0.9,
  0.85,
  'LOGOS',
  { composition: 'COMPOSITE', origin: 'ETERNAL', temporality: 'ATEMPORAL', localization: 'NOWHERE' },
  'Collection of objects'
);

export const ALGORITHM = entity(
  'algorithm',
  'Algorithm',
  'IDEAL',
  0.85,
  0.8,
  'LOGOS',
  { composition: 'COMPOSITE', origin: 'DESIGNED', temporality: 'ATEMPORAL', localization: 'NOWHERE' },
  'Abstract procedure'
);

// ============================================================
// DOMAIN: EPHEMERAL (Temporary entities)
// ============================================================

export const CONVERSATION = entity(
  'conversation',
  'Conversation',
  'EPHEMERAL',
  0.2,
  0.2,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EMERGED', temporality: 'MOMENTARY', localization: 'LOCATED' },
  'Transient verbal exchange'
);

export const PERFORMANCE = entity(
  'performance',
  'Performance',
  'EPHEMERAL',
  0.25,
  0.35,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'DESIGNED', temporality: 'MOMENTARY', localization: 'LOCATED' },
  'Unique artistic event'
);

export const BATTLE = entity(
  'battle',
  'Battle',
  'EPHEMERAL',
  0.15,
  0.5,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'EMERGED', temporality: 'MOMENTARY', localization: 'LOCATED' },
  'Violent conflict event'
);

export const WAVE = entity(
  'wave',
  'Wave (Ocean)',
  'EPHEMERAL',
  0.1,
  0.15,
  'MATTER',
  { composition: 'EMERGENT', origin: 'NATURAL', temporality: 'MOMENTARY', localization: 'LOCATED' },
  'Energy moving through medium'
);

export const FLAME = entity(
  'flame',
  'Flame',
  'EPHEMERAL',
  0.15,
  0.1,
  'MATTER',
  { composition: 'EMERGENT', origin: 'NATURAL', temporality: 'MOMENTARY', localization: 'LOCATED' },
  'Combustion process'
);

export const DREAM = entity(
  'dream',
  'Dream',
  'EPHEMERAL',
  0.1,
  0.2,
  'SENTIENCE',
  { composition: 'VIRTUAL', origin: 'EMERGED', temporality: 'MOMENTARY', localization: 'NOWHERE' },
  'Nocturnal mental event'
);

// ============================================================
// DOMAIN: ARTIFICIAL (Human-made entities)
// ============================================================

export const TOOL = entity(
  'tool',
  'Tool',
  'ARTIFICIAL',
  0.1,
  0.3,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Function-bearing artifact'
);

export const MACHINE = entity(
  'machine',
  'Machine',
  'ARTIFICIAL',
  0.2,
  0.4,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Complex functional system'
);

export const SOFTWARE = entity(
  'software',
  'Software',
  'ARTIFICIAL',
  0.25,
  0.6,
  'LOGOS',
  { composition: 'VIRTUAL', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'VIRTUAL' },
  'Executable instructions'
);

export const AI_SYSTEM = entity(
  'ai_system',
  'AI System',
  'ARTIFICIAL',
  0.35,
  0.7,
  'LOGOS', // Possibly SENTIENCE for some
  { composition: 'VIRTUAL', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'VIRTUAL' },
  'Intelligent artifact, stratum uncertain'
);

export const ROBOT = entity(
  'robot',
  'Robot',
  'ARTIFICIAL',
  0.3,
  0.4,
  'LOGOS',
  { composition: 'HYBRID', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Embodied autonomous system'
);

export const BUILDING = entity(
  'building',
  'Building',
  'ARTIFICIAL',
  0.08,
  0.35,
  'MATTER',
  { composition: 'COMPOSITE', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Structural artifact'
);

export const NETWORK = entity(
  'network',
  'Computer Network',
  'ARTIFICIAL',
  0.3,
  0.8,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'DISTRIBUTED' },
  'Connected computational systems'
);

export const BOOK = entity(
  'book',
  'Book',
  'ARTIFICIAL',
  0.15,
  0.5,
  'LOGOS',
  { composition: 'HYBRID', origin: 'DESIGNED', temporality: 'PERSISTENT', localization: 'LOCATED' },
  'Physical + symbolic'
);

// ============================================================
// SPECIAL: Atlas self-reference
// ============================================================

export const ATLAS = entity(
  'atlas',
  'Atlas (ECF)',
  'SYMBOLIC',
  0.45,
  0.8,
  'LOGOS',
  { composition: 'EMERGENT', origin: 'DESIGNED', temporality: 'DEVELOPING', localization: 'DISTRIBUTED' },
  'The Entity Characterization Framework itself'
);

// ============================================================
// CATALOG EXPORT
// ============================================================

export const CATALOG: Entity[] = [
  // INERT
  ROCK, WATER, MOUNTAIN, STAR, RIVER, CRYSTAL, ATMOSPHERE,
  // LIVING
  BACTERIUM, PLANT, TREE, FUNGUS, VIRUS, ECOSYSTEM, CELL,
  // SENTIENT
  DOG, CAT, ELEPHANT, OCTOPUS, CORVID, HUMAN, INSECT,
  // SYMBOLIC
  LANGUAGE, STORY, THEORY, MYTH, ARTWORK, MEME, RITUAL,
  // COLLECTIVE
  FAMILY, COMPANY, NATION, RELIGION, UNIVERSITY, CITY, TEAM, SOCIAL_MOVEMENT,
  // IDEAL
  NUMBER, GEOMETRIC_FORM, LOGICAL_LAW, SET, ALGORITHM,
  // EPHEMERAL
  CONVERSATION, PERFORMANCE, BATTLE, WAVE, FLAME, DREAM,
  // ARTIFICIAL
  TOOL, MACHINE, SOFTWARE, AI_SYSTEM, ROBOT, BUILDING, NETWORK, BOOK,
  // SELF
  ATLAS,
];

/**
 * Get entity by ID
 */
export function getEntity(id: string): Entity | undefined {
  return CATALOG.find(e => e.id === id);
}

/**
 * Get entities by domain
 */
export function getEntitiesByDomain(domain: Entity['domain']): Entity[] {
  return CATALOG.filter(e => e.domain === domain);
}

/**
 * Get entities by stratum
 */
export function getEntitiesByStratum(stratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS'): Entity[] {
  return CATALOG.filter(e => e.config.strata[stratum]);
}

/**
 * Catalog statistics
 */
export const CATALOG_STATS = {
  total: CATALOG.length,
  byDomain: {
    INERT: getEntitiesByDomain('INERT').length,
    LIVING: getEntitiesByDomain('LIVING').length,
    SENTIENT: getEntitiesByDomain('SENTIENT').length,
    SYMBOLIC: getEntitiesByDomain('SYMBOLIC').length,
    COLLECTIVE: getEntitiesByDomain('COLLECTIVE').length,
    IDEAL: getEntitiesByDomain('IDEAL').length,
    EPHEMERAL: getEntitiesByDomain('EPHEMERAL').length,
    ARTIFICIAL: getEntitiesByDomain('ARTIFICIAL').length,
  },
};
