/**
 * Test Atlas Self-Production Engine
 *
 * Demonstrates how Atlas can detect gaps and generate code to extend itself.
 */

import { SelfProductionEngine } from './src/self-production';
import { Entity } from './src/core/types';
import { StrataSet, strataFromPrimary } from './src/core/strata';
import { createCapabilitySet } from './src/core/capabilities';

// Sample entities that will trigger various gaps
const testEntities: Entity[] = [
  // Entity 1: Quantum Computer - has stratal nesting issue (MATTER + LOGOS, gap in middle)
  {
    id: 'quantum_computer',
    name: 'Quantum Computer',
    domain: 'ARTIFICIAL',
    modes: {
      composition: 'EMERGENT',
      origin: 'DESIGNED',
      temporality: 'PERSISTENT',
      localization: 'LOCATED',
    },
    config: {
      closure: 0.85,
      scope: 0.75,  // High closure + high scope = A3 tension
      strata: {
        MATTER: true,
        LIFE: false,
        SENTIENCE: false,
        LOGOS: true,  // Unusual: has LOGOS without LIFE/SENTIENCE
      },
      capabilities: createCapabilitySet(['PERSIST', 'REPRESENT']),
      relations: [],
      uncertainty: 0.4,
    },
  },

  // Entity 2: Cyborg - doesn't fit well in any domain
  {
    id: 'cyborg',
    name: 'Cyborg',
    domain: 'ARTIFICIAL',  // But it's also LIVING...
    modes: {
      composition: 'HYBRID',
      origin: 'DESIGNED',
      temporality: 'PERSISTENT',
      localization: 'LOCATED',
    },
    config: {
      closure: 0.65,
      scope: 0.55,
      strata: {
        MATTER: true,
        LIFE: true,
        SENTIENCE: true,
        LOGOS: false,
      },
      capabilities: createCapabilitySet(['PERSIST', 'SELF_PRODUCE', 'FEEL']),
      relations: [
        { type: 'part_of', targetId: 'human', strength: 0.5 },
        { type: 'contains', targetId: 'machine', strength: 0.5 },
      ],
      uncertainty: 0.35,
    },
  },

  // Entity 3: AI Assistant - also domain edge case
  {
    id: 'ai_assistant',
    name: 'AI Assistant',
    domain: 'ARTIFICIAL',
    modes: {
      composition: 'EMERGENT',
      origin: 'DESIGNED',
      temporality: 'PERSISTENT',
      localization: 'DISTRIBUTED',
    },
    config: {
      closure: 0.7,
      scope: 0.8,
      strata: {
        MATTER: true,
        LIFE: false,
        SENTIENCE: false,  // Debatable...
        LOGOS: true,
      },
      capabilities: createCapabilitySet(['PERSIST', 'REPRESENT']),
      relations: [
        { type: 'depends_on', targetId: 'human', strength: 0.3 },
        { type: 'depends_on', targetId: 'quantum_computer', strength: 0.8 },
      ],
      uncertainty: 0.5,
    },
  },

  // Entity 4: Bionic Implant - hybrid bio-tech
  {
    id: 'bionic_implant',
    name: 'Bionic Implant',
    domain: 'ARTIFICIAL',
    modes: {
      composition: 'HYBRID',
      origin: 'DESIGNED',
      temporality: 'PERSISTENT',
      localization: 'LOCATED',
    },
    config: {
      closure: 0.4,
      scope: 0.3,
      strata: {
        MATTER: true,
        LIFE: true,  // Integrates with living tissue
        SENTIENCE: false,
        LOGOS: false,
      },
      capabilities: createCapabilitySet(['PERSIST']),
      relations: [
        { type: 'part_of', targetId: 'human', strength: 0.9 },
      ],
      uncertainty: 0.25,
    },
  },

  // Entity 5: Neural Interface - boundary entity
  {
    id: 'neural_interface',
    name: 'Neural Interface',
    domain: 'ARTIFICIAL',
    modes: {
      composition: 'HYBRID',
      origin: 'DESIGNED',
      temporality: 'PERSISTENT',
      localization: 'LOCATED',
    },
    config: {
      closure: 0.5,
      scope: 0.4,
      strata: {
        MATTER: true,
        LIFE: true,
        SENTIENCE: true,  // Interfaces with sentience
        LOGOS: false,
      },
      capabilities: createCapabilitySet(['PERSIST', 'FEEL']),
      relations: [
        { type: 'connects_to', targetId: 'brain', strength: 0.95 },
        { type: 'connects_to', targetId: 'computer', strength: 0.85 },
      ],
      uncertainty: 0.4,
    },
  },

  // Add more entities to trigger clustering anomalies
  ...generateSimilarEntities(),
];

/**
 * Generate entities with similar closure/scope to trigger clustering
 */
function generateSimilarEntities(): Entity[] {
  const entities: Entity[] = [];

  // Generate 5 entities with similar C~0.65, S~0.55 but different domains
  const domains = ['LIVING', 'ARTIFICIAL', 'SYMBOLIC', 'COLLECTIVE', 'EPHEMERAL'] as const;

  for (let i = 0; i < 5; i++) {
    entities.push({
      id: `cluster_entity_${i}`,
      name: `Hybrid Entity ${i}`,
      domain: domains[i],
      modes: {
        composition: 'HYBRID',
        origin: 'EMERGED',
        temporality: 'PERSISTENT',
        localization: 'DISTRIBUTED',
      },
      config: {
        closure: 0.63 + Math.random() * 0.04,  // ~0.63-0.67
        scope: 0.53 + Math.random() * 0.04,    // ~0.53-0.57
        strata: {
          MATTER: true,
          LIFE: true,
          SENTIENCE: false,
          LOGOS: false,
        },
        capabilities: createCapabilitySet(['PERSIST', 'SELF_PRODUCE']),
        relations: [],
        uncertainty: 0.3,
      },
    });
  }

  return entities;
}

/**
 * Run the test
 */
async function testSelfProduction() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       ATLAS SELF-PRODUCTION ENGINE - TEST                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Create engine in dry-run mode (won't actually write files)
  const engine = new SelfProductionEngine({
    dryRun: true,
    enableGeneration: true,
    requireApproval: true,
    minValidationScore: 0.6,
  });

  console.log(`Testing with ${testEntities.length} entities...\n`);

  // Run a self-production cycle
  const result = await engine.runCycle(testEntities);

  // Print results
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ CYCLE RESULTS                                                    │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log(`  Entities analyzed:    ${result.entitiesAnalyzed}`);
  console.log(`  Gaps detected:        ${result.gapsDetected}`);
  console.log(`  Code generated:       ${result.codeGenerated}`);
  console.log(`  Validations passed:   ${result.validationsPassed}`);
  console.log(`  Validations failed:   ${result.validationsFailed}`);
  console.log(`  Pending reviews:      ${result.pendingReviews}`);

  if (result.errors.length > 0) {
    console.log(`\n  Errors:`);
    for (const error of result.errors) {
      console.log(`    - ${error}`);
    }
  }

  // Show pending reviews
  const pending = engine.getPendingReviews();
  if (pending.length > 0) {
    console.log('\n┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ PENDING REVIEWS                                                  │');
    console.log('└─────────────────────────────────────────────────────────────────┘\n');

    for (const item of pending) {
      console.log(`  [${item.priority.toUpperCase()}] ${item.id}`);
      console.log(`    Type: ${item.type}`);
      console.log(`    Gap: ${item.sourceGap.type} - ${item.sourceGap.description.slice(0, 60)}...`);

      if (item.generatedCode) {
        console.log(`    Generated: ${item.generatedCode.type} "${item.generatedCode.name}"`);
        console.log(`    Target: ${item.generatedCode.targetFile}`);
      }

      if (item.validation) {
        console.log(`    Validation: ${item.validation.valid ? '✓ VALID' : '✗ INVALID'} (score: ${item.validation.score.toFixed(2)})`);
      }

      console.log('');
    }
  }

  // Show axioms for reference
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ AXIS AXIOMS (FROZEN - Never Violated)                           │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  for (const axiom of engine.getAxioms()) {
    console.log(`  ${axiom.id}: ${axiom.name}`);
    console.log(`      "${axiom.statement.slice(0, 60)}${axiom.statement.length > 60 ? '...' : ''}"`);
  }

  // Print status
  engine.printStatus();

  console.log('\n✓ Test complete!');
  console.log('\nIn production:');
  console.log('  1. Human reviews pending items');
  console.log('  2. Approves/rejects/modifies each');
  console.log('  3. Approved items are integrated into codebase');
  console.log('  4. Atlas grows its own capabilities!\n');
}

// Run test
testSelfProduction().catch(console.error);
