/**
 * Approve and Integrate Domains via CLI
 *
 * Usage: npx ts-node approve-domain.ts [DOMAIN_NAME]
 * Example: npx ts-node approve-domain.ts SOCIOTECHNICAL
 */

import { SelfProductionEngine } from './src/self-production';
import { CATALOG } from './src/catalog';

const targetDomain = process.argv[2] || 'SOCIOTECHNICAL';

async function approveDomain() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║     APPROVING ${targetDomain.padEnd(43)}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Create engine (NOT dry run - we want to actually write files)
  const engine = new SelfProductionEngine({
    dryRun: false,
    enableGeneration: true,
    requireApproval: true,
    minValidationScore: 0.6,
  });

  // Run a cycle to populate the review queue
  console.log('Running cycle to detect gaps and generate code...\n');
  await engine.runCycle(CATALOG);

  // Get pending reviews
  const pending = engine.getPendingReviews();
  console.log(`\nFound ${pending.length} pending reviews\n`);

  // Find the target domain
  const targetReview = pending.find(p =>
    p.generatedCode?.name === targetDomain ||
    p.generatedCode?.name?.includes(targetDomain)
  );

  if (!targetReview) {
    console.log(`❌ ${targetDomain} not found in pending reviews`);
    console.log('\nAvailable reviews:');
    for (const p of pending) {
      if (p.generatedCode) {
        console.log(`  - ${p.generatedCode.name} (${p.generatedCode.type})`);
      } else {
        console.log(`  - ${p.type}: ${p.sourceGap.type}`);
      }
    }
    return;
  }

  console.log(`✓ Found ${targetDomain} domain`);
  console.log(`  Review ID: ${targetReview.id}`);
  console.log(`  Type: ${targetReview.generatedCode?.type}`);
  console.log(`  Target: ${targetReview.generatedCode?.targetFile}`);
  console.log(`  Score: ${targetReview.validation?.score.toFixed(2)}`);

  // Show the code that will be integrated
  console.log('\n📝 Code to integrate:\n');
  console.log('─'.repeat(60));
  console.log(targetReview.generatedCode?.code);
  console.log('─'.repeat(60));

  // Approve it
  console.log('\n🔐 Approving...');
  await engine.approve(targetReview.id, 'luca', `Approved via CLI - ${targetDomain} domain`);

  // Integrate it
  console.log('🔧 Integrating...');
  const result = await engine.integrateApproved(targetReview.id);

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

approveDomain().catch(console.error);
