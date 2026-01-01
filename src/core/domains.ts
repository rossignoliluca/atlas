/**
 * ECF Domains: The eight ontological domains
 * Categories of entities based on their nature and origin
 */

/**
 * The eight domains
 */
export type Domain =
  | 'INERT'       // Non-living natural entities
  | 'LIVING'      // Biological organisms
  | 'SENTIENT'    // Conscious beings
  | 'SYMBOLIC'    // Cultural/linguistic entities
  | 'COLLECTIVE'  // Groups and institutions
  | 'IDEAL'       // Abstract entities (numbers, laws)
  | 'EPHEMERAL'   // Temporary/event-like entities
  | 'ARTIFICIAL'; // Human-made entities

/**
 * Domain information
 */
export const DOMAIN_INFO: Record<Domain, {
  name: string;
  description: string;
  typicalStrata: ('MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS')[];
  typicalClosure: [number, number]; // [min, max] range
  typicalScope: [number, number];   // [min, max] range
  examples: string[];
  boundaryQuestions: string[];
}> = {
  INERT: {
    name: 'Inert',
    description: 'Non-living natural entities that persist through physical processes',
    typicalStrata: ['MATTER'],
    typicalClosure: [0.0, 0.2],
    typicalScope: [0.1, 0.8],
    examples: ['rocks', 'water', 'mountains', 'stars', 'atoms'],
    boundaryQuestions: [
      'Does it have any self-maintaining processes?',
      'Is there any feedback loop?',
    ],
  },
  LIVING: {
    name: 'Living',
    description: 'Biological organisms with metabolism and reproduction',
    typicalStrata: ['MATTER', 'LIFE'],
    typicalClosure: [0.4, 0.8],
    typicalScope: [0.2, 0.6],
    examples: ['bacteria', 'plants', 'fungi', 'animals'],
    boundaryQuestions: [
      'Does it metabolize?',
      'Can it reproduce (even if it doesn\'t)?',
      'Does it maintain homeostasis?',
    ],
  },
  SENTIENT: {
    name: 'Sentient',
    description: 'Beings with phenomenal experience',
    typicalStrata: ['MATTER', 'LIFE', 'SENTIENCE'],
    typicalClosure: [0.5, 0.7],
    typicalScope: [0.3, 0.7],
    examples: ['mammals', 'birds', 'some fish', 'octopuses'],
    boundaryQuestions: [
      'Is there something it is like to be this entity?',
      'Does it show pain/pleasure responses?',
      'Does it have preferences?',
    ],
  },
  SYMBOLIC: {
    name: 'Symbolic',
    description: 'Cultural, linguistic, and meaning-bearing entities',
    typicalStrata: ['MATTER', 'LOGOS'],
    typicalClosure: [0.2, 0.5],
    typicalScope: [0.4, 0.9],
    examples: ['languages', 'stories', 'theories', 'artworks', 'rituals'],
    boundaryQuestions: [
      'Does it require interpretation to exist?',
      'Does it carry meaning?',
      'Can it exist without minds to think it?',
    ],
  },
  COLLECTIVE: {
    name: 'Collective',
    description: 'Groups, organizations, and institutions',
    typicalStrata: ['MATTER', 'LIFE', 'LOGOS'],
    typicalClosure: [0.3, 0.6],
    typicalScope: [0.5, 0.9],
    examples: ['companies', 'nations', 'religions', 'families', 'teams'],
    boundaryQuestions: [
      'Does it have identity beyond its members?',
      'Can members be replaced while it persists?',
      'Does it have collective agency?',
    ],
  },
  IDEAL: {
    name: 'Ideal',
    description: 'Abstract entities like numbers, laws, and mathematical objects',
    typicalStrata: ['LOGOS'],
    typicalClosure: [0.9, 1.0],
    typicalScope: [0.9, 1.0],
    examples: ['numbers', 'geometric forms', 'logical laws', 'sets'],
    boundaryQuestions: [
      'Does it exist independently of physical instantiation?',
      'Is it discovered or invented?',
      'Can it change?',
    ],
  },
  EPHEMERAL: {
    name: 'Ephemeral',
    description: 'Temporary, event-like, or processual entities',
    typicalStrata: ['MATTER', 'LIFE', 'SENTIENCE'],
    typicalClosure: [0.1, 0.4],
    typicalScope: [0.1, 0.5],
    examples: ['conversations', 'battles', 'performances', 'waves', 'flames'],
    boundaryQuestions: [
      'When does it begin and end?',
      'Is it a thing or a happening?',
      'Can it recur or is each instance unique?',
    ],
  },
  ARTIFICIAL: {
    name: 'Artificial',
    description: 'Human-made entities, both physical and digital',
    typicalStrata: ['MATTER', 'LOGOS'],
    typicalClosure: [0.1, 0.6],
    typicalScope: [0.2, 0.9],
    examples: ['tools', 'machines', 'software', 'AI systems', 'buildings'],
    boundaryQuestions: [
      'Was it intentionally created?',
      'Does it have a function?',
      'Can it exist without users?',
    ],
  },
};

/**
 * Domain compatibility matrix
 * Some domains naturally overlap or exclude each other
 */
export const DOMAIN_RELATIONS: Record<Domain, {
  overlaps: Domain[];
  excludes: Domain[];
  transforms_to: Domain[];
}> = {
  INERT: {
    overlaps: [],
    excludes: ['LIVING', 'SENTIENT'],
    transforms_to: ['LIVING', 'ARTIFICIAL'],
  },
  LIVING: {
    overlaps: ['SENTIENT'],
    excludes: ['INERT', 'IDEAL'],
    transforms_to: ['INERT', 'SENTIENT'],
  },
  SENTIENT: {
    overlaps: ['LIVING'],
    excludes: ['INERT', 'IDEAL'],
    transforms_to: ['LIVING'],
  },
  SYMBOLIC: {
    overlaps: ['COLLECTIVE', 'ARTIFICIAL'],
    excludes: ['INERT'],
    transforms_to: ['EPHEMERAL'],
  },
  COLLECTIVE: {
    overlaps: ['SYMBOLIC', 'ARTIFICIAL'],
    excludes: ['INERT'],
    transforms_to: ['EPHEMERAL', 'SYMBOLIC'],
  },
  IDEAL: {
    overlaps: ['SYMBOLIC'],
    excludes: ['LIVING', 'SENTIENT', 'EPHEMERAL'],
    transforms_to: [],
  },
  EPHEMERAL: {
    overlaps: ['SYMBOLIC'],
    excludes: ['IDEAL'],
    transforms_to: ['SYMBOLIC'],
  },
  ARTIFICIAL: {
    overlaps: ['SYMBOLIC', 'COLLECTIVE'],
    excludes: [],
    transforms_to: ['INERT', 'LIVING', 'SENTIENT'],
  },
};

/**
 * Get likely domain from entity characteristics
 */
export function suggestDomain(characteristics: {
  isNatural: boolean;
  isLiving: boolean;
  isSentient: boolean;
  isAbstract: boolean;
  isTemporary: boolean;
  isCollective: boolean;
  isMeaningBearing: boolean;
}): Domain[] {
  const suggestions: Domain[] = [];

  if (characteristics.isAbstract && !characteristics.isTemporary) {
    suggestions.push('IDEAL');
  }
  if (characteristics.isSentient) {
    suggestions.push('SENTIENT');
  }
  if (characteristics.isLiving && !characteristics.isSentient) {
    suggestions.push('LIVING');
  }
  if (characteristics.isCollective) {
    suggestions.push('COLLECTIVE');
  }
  if (characteristics.isMeaningBearing && !characteristics.isCollective) {
    suggestions.push('SYMBOLIC');
  }
  if (characteristics.isTemporary && !characteristics.isAbstract) {
    suggestions.push('EPHEMERAL');
  }
  if (!characteristics.isNatural && !characteristics.isAbstract) {
    suggestions.push('ARTIFICIAL');
  }
  if (characteristics.isNatural && !characteristics.isLiving) {
    suggestions.push('INERT');
  }

  return suggestions.length > 0 ? suggestions : ['INERT'];
}

/**
 * Domain hierarchy (some domains presuppose others)
 */
export function getDomainPrerequisites(domain: Domain): Domain[] {
  switch (domain) {
    case 'SENTIENT': return ['LIVING'];
    case 'COLLECTIVE': return [];
    case 'SYMBOLIC': return [];
    case 'IDEAL': return [];
    case 'EPHEMERAL': return [];
    case 'ARTIFICIAL': return [];
    case 'LIVING': return [];
    case 'INERT': return [];
    default: return [];
  }
}
