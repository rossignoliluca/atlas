/**
 * Approve and Integrate SEMI_AUTONOMOUS Domain
 */

import { SelfProductionEngine } from './src/self-production';
import { Entity } from './src/core/types';
import { CATALOG } from './src/catalog';

async function approveSemiAutonomous() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     APPROVING SEMI_AUTONOMOUS DOMAIN                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Create engine (NOT dry run - we want to actually write files)
  const engine = new SelfProductionEngine({
    dryRun: false,  // Actually write files!
    enableGeneration: true,
    requireApproval: true,
    minValidationScore: 0.6,
  });

  // First, run a cycle to populate the review queue
  console.log('Running cycle to detect gaps and generate code...\n');
  await engine.runCycle(CATALOG);

  // Get pending reviews
  const pending = engine.getPendingReviews();
  console.log(`\nFound ${pending.length} pending reviews\n`);

  // Find SEMI_AUTONOMOUS domain
  const semiAutonomous = pending.find(p =>
    p.generatedCode?.name === 'SEMI_AUTONOMOUS' ||
    p.generatedCode?.name?.includes('SEMI_AUTONOMOUS')
  );

  if (!semiAutonomous) {
    console.log('❌ SEMI_AUTONOMOUS not found in pending reviews');
    console.log('\nAvailable reviews:');
    for (const p of pending) {
      if (p.generatedCode) {
        console.log(`  - ${p.id}: ${p.generatedCode.name} (${p.generatedCode.type})`);
      } else {
        console.log(`  - ${p.id}: ${p.type} - ${p.sourceGap.type}`);
      }
    }
    return;
  }

  console.log('✓ Found SEMI_AUTONOMOUS domain');
  console.log(`  Review ID: ${semiAutonomous.id}`);
  console.log(`  Type: ${semiAutonomous.generatedCode?.type}`);
  console.log(`  Target: ${semiAutonomous.generatedCode?.targetFile}`);
  console.log(`  Score: ${semiAutonomous.validation?.score.toFixed(2)}`);

  // Show the code that will be integrated
  console.log('\n📝 Code to integrate:\n');
  console.log('─'.repeat(60));
  console.log(semiAutonomous.generatedCode?.code);
  console.log('─'.repeat(60));

  // Approve it
  console.log('\n🔐 Approving...');
  await engine.approve(semiAutonomous.id, 'luca', 'Approved via CLI - new cross-cutting domain');

  // Integrate it
  console.log('🔧 Integrating...');
  const result = await engine.integrateApproved(semiAutonomous.id);

  if (result.success) {
    console.log('\n✅ INTEGRATION SUCCESSFUL!');
    console.log(`   File: ${result.targetFile}`);
    console.log(`   Action: ${result.action}`);
    if (result.backup) {
      console.log(`   Backup: ${result.backup}`);
    }
  } else {
    console.log('\n❌ INTEGRATION FAILED');
    console.log(`   Error: ${result.error}`);
  }

  // Print final status
  engine.printStatus();
}

approveSemiAutonomous().catch(console.error);
