/**
 * ECF Capabilities: The six fundamental capabilities
 * Each stratum enables new capabilities
 */

/**
 * The six capabilities
 */
export type Capability =
  | 'PERSIST'       // Maintain structural coherence
  | 'SELF_PRODUCE'  // Generate own components (autopoiesis)
  | 'FEEL'          // Have phenomenal experience
  | 'EVALUATE'      // Judge states as good/bad for self
  | 'REPRESENT'     // Create symbolic models
  | 'NORM';         // Establish and follow rules

/**
 * Capability set for an entity
 */
export type CapabilitySet = Set<Capability>;

/**
 * Create capability set from array
 */
export function createCapabilitySet(capabilities: Capability[]): CapabilitySet {
  return new Set(capabilities);
}

/**
 * Capability information
 */
export const CAPABILITY_INFO: Record<Capability, {
  name: string;
  stratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS';
  description: string;
  indicators: string[];
  prerequisites: Capability[];
}> = {
  PERSIST: {
    name: 'Persist',
    stratum: 'MATTER',
    description: 'Maintain structural coherence over time through physical-causal processes',
    indicators: [
      'Maintains physical structure',
      'Resists entropy',
      'Has temporal extent',
    ],
    prerequisites: [],
  },
  SELF_PRODUCE: {
    name: 'Self-Produce',
    stratum: 'LIFE',
    description: 'Generate the components necessary for own persistence (autopoiesis)',
    indicators: [
      'Metabolic cycle present',
      'Component replacement',
      'Self-repair capability',
      'Boundary maintenance',
    ],
    prerequisites: ['PERSIST'],
  },
  FEEL: {
    name: 'Feel',
    stratum: 'SENTIENCE',
    description: 'Have phenomenal experience - there is "something it is like" to be this entity',
    indicators: [
      'Behavioral responses to stimuli',
      'Pleasure/pain responses',
      'Attention and awareness',
      'Sleep/wake cycles (in some cases)',
    ],
    prerequisites: ['PERSIST', 'SELF_PRODUCE'],
  },
  EVALUATE: {
    name: 'Evaluate',
    stratum: 'SENTIENCE',
    description: 'Judge states as good or bad for self',
    indicators: [
      'Preference expression',
      'Approach/avoidance behavior',
      'Goal-directed action',
      'Emotional responses',
    ],
    prerequisites: ['PERSIST', 'SELF_PRODUCE', 'FEEL'],
  },
  REPRESENT: {
    name: 'Represent',
    stratum: 'LOGOS',
    description: 'Create and manipulate symbolic models of self, others, and world',
    indicators: [
      'Language use',
      'Tool creation and use',
      'Abstract reasoning',
      'Counterfactual thinking',
      'Planning for distant future',
    ],
    prerequisites: ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE'],
  },
  NORM: {
    name: 'Norm',
    stratum: 'LOGOS',
    description: 'Establish and follow rules, distinguish "is" from "ought"',
    indicators: [
      'Rule-following behavior',
      'Moral judgment',
      'Social contract participation',
      'Self-binding commitments',
      'Normative criticism',
    ],
    prerequisites: ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE', 'REPRESENT'],
  },
};

/**
 * Get capabilities enabled by a stratum
 */
export function getStratumCapabilities(stratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS'): Capability[] {
  const stratumOrder = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];
  const index = stratumOrder.indexOf(stratum);

  const capabilities: Capability[] = [];

  if (index >= 0) capabilities.push('PERSIST');
  if (index >= 1) capabilities.push('SELF_PRODUCE');
  if (index >= 2) capabilities.push('FEEL', 'EVALUATE');
  if (index >= 3) capabilities.push('REPRESENT', 'NORM');

  return capabilities;
}

/**
 * Check if capability set is consistent (all prerequisites met)
 */
export function isConsistentCapabilitySet(caps: CapabilitySet): boolean {
  for (const cap of caps) {
    const prereqs = CAPABILITY_INFO[cap].prerequisites;
    for (const prereq of prereqs) {
      if (!caps.has(prereq)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get missing prerequisites for a capability
 */
export function getMissingPrerequisites(
  desired: Capability,
  current: CapabilitySet
): Capability[] {
  const prereqs = CAPABILITY_INFO[desired].prerequisites;
  return prereqs.filter(p => !current.has(p));
}

/**
 * Capability comparison between entities
 */
export function compareCapabilities(a: CapabilitySet, b: CapabilitySet): {
  shared: Capability[];
  onlyA: Capability[];
  onlyB: Capability[];
  overlap: number;
} {
  const shared = [...a].filter(c => b.has(c));
  const onlyA = [...a].filter(c => !b.has(c));
  const onlyB = [...b].filter(c => !a.has(c));

  const total = new Set([...a, ...b]).size;
  const overlap = total > 0 ? shared.length / total : 1;

  return { shared, onlyA, onlyB, overlap };
}

/**
 * Wisdom tradition mappings
 * How capabilities map to concepts from various traditions
 */
export const WISDOM_MAPPINGS: Record<Capability, Record<string, string>> = {
  PERSIST: {
    buddhism: 'Rūpa (form)',
    samkhya: 'Prakṛti (matter)',
    kabbalah: 'Malkhut (kingdom)',
    aristotle: 'Hyle (matter)',
  },
  SELF_PRODUCE: {
    buddhism: 'Vedanā (sensation)',
    samkhya: 'Prāṇa (life force)',
    taoism: 'Qi (vital energy)',
    aristotle: 'Physis (nature)',
  },
  FEEL: {
    buddhism: 'Vedanā, Saññā (feeling, perception)',
    samkhya: 'Manas (mind)',
    sufism: 'Nafs (soul)',
    aristotle: 'Aisthesis (perception)',
  },
  EVALUATE: {
    buddhism: 'Saṅkhāra (mental formations)',
    samkhya: 'Ahaṃkāra (ego)',
    kabbalah: 'Yesod (foundation)',
    stoicism: 'Prohairesis (choice)',
  },
  REPRESENT: {
    buddhism: 'Vijñāna (consciousness)',
    samkhya: 'Buddhi (intellect)',
    kabbalah: 'Binah (understanding)',
    neoplatonism: 'Nous (intellect)',
  },
  NORM: {
    buddhism: 'Dharma',
    samkhya: 'Puruṣa witness',
    kabbalah: 'Keter (crown)',
    aristotle: 'Phronesis (practical wisdom)',
  },
};
