/**
 * Run Atlas Autopoietic Cycle
 *
 * This script runs the full autopoietic flow:
 * 1. Load existing entities from catalog
 * 2. Fetch new entities from arXiv
 * 3. Analyze for gaps
 * 4. Generate code to extend Atlas
 * 5. Show what would be added
 */

import { SelfProductionEngine } from './src/self-production';
import { Entity } from './src/core/types';
import { ArxivConnector } from './src/ingest';
import { createCapabilitySet } from './src/core/capabilities';
import { strataFromPrimary } from './src/core/strata';

// Load catalog entities
import { CATALOG } from './src/catalog';

/**
 * Simple entity extractor from arXiv abstracts
 */
function extractEntitiesFromText(text: string, docId: string): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();

  // Extract capitalized phrases as potential entities
  const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;

  // Common words to skip
  const skip = new Set([
    'The', 'This', 'That', 'These', 'Those', 'However', 'Therefore',
    'Furthermore', 'Moreover', 'Abstract', 'Introduction', 'Conclusion',
    'Results', 'Methods', 'Figure', 'Table', 'Section', 'We', 'Our',
    'In', 'For', 'With', 'From', 'About', 'Through', 'Between',
  ]);

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1]?.trim();
    if (!name || name.length < 3 || name.length > 40) continue;
    if (skip.has(name)) continue;
    if (seen.has(name.toLowerCase())) continue;

    seen.add(name.toLowerCase());

    // Determine domain and stratum from context
    const context = text.slice(
      Math.max(0, match.index - 200),
      Math.min(text.length, match.index + 200)
    ).toLowerCase();

    const { domain, stratum, closure, scope } = inferFromContext(context);

    entities.push({
      id: `${docId}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name,
      domain,
      modes: {
        composition: 'EMERGENT',
        origin: 'NATURAL',
        temporality: 'PERSISTENT',
        localization: 'DISTRIBUTED',
      },
      config: {
        closure,
        scope,
        strata: strataFromPrimary(stratum),
        capabilities: createCapabilitySet(
          stratum === 'MATTER' ? ['PERSIST'] :
          stratum === 'LIFE' ? ['PERSIST', 'SELF_PRODUCE'] :
          stratum === 'SENTIENCE' ? ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE'] :
          ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE', 'REPRESENT', 'NORM']
        ),
        relations: [],
        uncertainty: 0.4 + Math.random() * 0.3,
      },
    });
  }

  return entities.slice(0, 15); // Limit per document
}

/**
 * Infer domain/stratum from context
 */
function inferFromContext(context: string): {
  domain: Entity['domain'];
  stratum: 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS';
  closure: number;
  scope: number;
} {
  // Living indicators
  if (context.includes('cell') || context.includes('organism') ||
      context.includes('biological') || context.includes('living') ||
      context.includes('metabol') || context.includes('autopoie')) {
    return {
      domain: 'LIVING',
      stratum: 'LIFE',
      closure: 0.6 + Math.random() * 0.2,
      scope: 0.4 + Math.random() * 0.2,
    };
  }

  // Sentient indicators
  if (context.includes('conscious') || context.includes('brain') ||
      context.includes('cognitive') || context.includes('neural') ||
      context.includes('mind') || context.includes('aware')) {
    return {
      domain: 'SENTIENT',
      stratum: 'SENTIENCE',
      closure: 0.7 + Math.random() * 0.2,
      scope: 0.5 + Math.random() * 0.2,
    };
  }

  // Symbolic/Logos indicators
  if (context.includes('language') || context.includes('symbol') ||
      context.includes('meaning') || context.includes('concept') ||
      context.includes('theory') || context.includes('model')) {
    return {
      domain: 'SYMBOLIC',
      stratum: 'LOGOS',
      closure: 0.5 + Math.random() * 0.2,
      scope: 0.6 + Math.random() * 0.2,
    };
  }

  // Collective indicators
  if (context.includes('social') || context.includes('society') ||
      context.includes('collective') || context.includes('organization') ||
      context.includes('institution')) {
    return {
      domain: 'COLLECTIVE',
      stratum: 'LOGOS',
      closure: 0.5 + Math.random() * 0.2,
      scope: 0.7 + Math.random() * 0.2,
    };
  }

  // Artificial indicators
  if (context.includes('machine') || context.includes('computer') ||
      context.includes('algorithm') || context.includes('artificial') ||
      context.includes('software') || context.includes('robot')) {
    return {
      domain: 'ARTIFICIAL',
      stratum: 'MATTER',
      closure: 0.5 + Math.random() * 0.2,
      scope: 0.5 + Math.random() * 0.2,
    };
  }

  // Default: inert matter
  return {
    domain: 'INERT',
    stratum: 'MATTER',
    closure: 0.3 + Math.random() * 0.2,
    scope: 0.3 + Math.random() * 0.2,
  };
}

/**
 * Main autopoietic cycle
 */
async function runAutopoiesis() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           ATLAS AUTOPOIETIC CYCLE                              ║');
  console.log('║           "Il sistema che produce se stesso"                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Phase 1: Load existing catalog
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ FASE 1: Caricamento Catalogo Esistente                          │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  const catalogEntities = CATALOG;
  console.log(`  Entità nel catalogo: ${catalogEntities.length}\n`);

  // Show domain distribution
  const domainCounts: Record<string, number> = {};
  for (const e of catalogEntities) {
    domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
  }
  console.log('  Distribuzione Domini:');
  for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(`    ${domain.padEnd(12)} ${bar} ${count}`);
  }

  // Phase 2: Fetch from arXiv
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ FASE 2: Ingestione da arXiv                                     │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  const arxiv = new ArxivConnector();
  const queries = ['autopoiesis', 'complex systems', 'emergence'];

  const allNewEntities: Entity[] = [];

  for (const query of queries) {
    console.log(`  Fetching: "${query}"...`);
    const docs = await arxiv.fetch(query, { limit: 2 });

    for (const doc of docs) {
      console.log(`    📄 ${doc.title.slice(0, 50)}...`);
      const entities = extractEntitiesFromText(doc.text, doc.id);
      allNewEntities.push(...entities);
    }
  }

  console.log(`\n  Nuove entità estratte: ${allNewEntities.length}`);

  // Combine all entities
  const allEntities = [...catalogEntities, ...allNewEntities];
  console.log(`  Totale entità per analisi: ${allEntities.length}`);

  // Phase 3: Run Self-Production Engine
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ FASE 3: Self-Production Engine                                  │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  const engine = new SelfProductionEngine({
    dryRun: true,  // Don't actually write files
    enableGeneration: true,
    requireApproval: true,
    minValidationScore: 0.6,
  });

  const result = await engine.runCycle(allEntities);

  // Phase 4: Show Results
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ FASE 4: Risultati Ciclo Autopoietico                            │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log('  Statistiche:');
  console.log(`    Entità analizzate:     ${result.entitiesAnalyzed}`);
  console.log(`    Gap rilevati:          ${result.gapsDetected}`);
  console.log(`    Codice generato:       ${result.codeGenerated}`);
  console.log(`    Validazioni passate:   ${result.validationsPassed}`);
  console.log(`    Validazioni fallite:   ${result.validationsFailed}`);
  console.log(`    Review pendenti:       ${result.pendingReviews}`);

  // Show pending reviews
  const pending = engine.getPendingReviews();

  if (pending.length > 0) {
    console.log('\n  Review Pendenti:');
    console.log('  ─────────────────────────────────────────────────────────────');

    for (const item of pending) {
      const priorityIcon =
        item.priority === 'critical' ? '🔴' :
        item.priority === 'high' ? '🟠' :
        item.priority === 'medium' ? '🟡' : '🟢';

      console.log(`\n  ${priorityIcon} [${item.priority.toUpperCase()}] ${item.id}`);
      console.log(`     Tipo: ${item.type}`);
      console.log(`     Gap: ${item.sourceGap.type}`);
      console.log(`     ${item.sourceGap.description.slice(0, 70)}...`);

      if (item.generatedCode) {
        console.log(`\n     📝 Codice Generato:`);
        console.log(`        Tipo: ${item.generatedCode.type}`);
        console.log(`        Nome: ${item.generatedCode.name}`);
        console.log(`        File: ${item.generatedCode.targetFile}`);
        console.log(`\n        Preview:`);
        const codePreview = item.generatedCode.code.split('\n').slice(0, 8).map(l => `        ${l}`).join('\n');
        console.log(codePreview);
        console.log('        ...');
      }

      if (item.validation) {
        const status = item.validation.valid ? '✓ VALIDO' : '✗ INVALIDO';
        console.log(`\n     Validazione: ${status} (score: ${item.validation.score.toFixed(2)})`);
        console.log(`     Passed: ${item.validation.passed.join(', ') || 'none'}`);

        if (item.validation.violations.length > 0) {
          console.log('     Violazioni:');
          for (const v of item.validation.violations) {
            console.log(`       - ${v.axiomId}: ${v.description}`);
            if (v.suggestedFix) console.log(`         Fix: ${v.suggestedFix}`);
          }
        }

        if (item.validation.warnings.length > 0) {
          console.log('     Warning:');
          for (const w of item.validation.warnings.slice(0, 3)) {
            console.log(`       - ${w.axiomId}: ${w.description.slice(0, 60)}...`);
          }
        }
      }
    }
  }

  // Phase 5: Suggestions
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ FASE 5: Suggerimenti per Estensione                             │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  // Analyze what could be improved
  const axiomTensions = pending.filter(p => p.sourceGap.type === 'axiom_tension');
  const domainMisfits = pending.filter(p => p.sourceGap.type === 'domain_misfit');
  const clusterAnomalies = pending.filter(p => p.sourceGap.type === 'clustering_anomaly');
  const stratumBoundaries = pending.filter(p => p.sourceGap.type === 'stratum_boundary');

  if (axiomTensions.length > 0) {
    console.log(`  🔴 ${axiomTensions.length} Tensioni Assiomatiche:`);
    console.log('     Alcune entità violano gli assiomi fondamentali.');
    console.log('     Azione: Rivedere le caratterizzazioni o accettare');
    console.log('             casi eccezionali (es. AI = LOGOS senza LIFE)\n');
  }

  if (domainMisfits.length > 0) {
    console.log(`  🟠 ${domainMisfits.length} Domini Mancanti:`);
    console.log('     Cluster di entità non fittano bene nei domini esistenti.');
    console.log('     Azione: Considerare nuovi domini (es. HYBRID, CYBORG)\n');
  }

  if (clusterAnomalies.length > 0) {
    console.log(`  🟡 ${clusterAnomalies.length} Anomalie di Clustering:`);
    console.log('     Gruppi di entità simili attraversano più domini.');
    console.log('     Azione: Possibile categoria trasversale mancante\n');
  }

  if (stratumBoundaries.length > 0) {
    console.log(`  🟢 ${stratumBoundaries.length} Casi Limite di Strato:`);
    console.log('     Entità ai confini tra strati.');
    console.log('     Azione: Utili per raffinare le soglie stratali\n');
  }

  // Final summary
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ SOMMARIO                                                        │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log('  Il ciclo autopoietico ha identificato:');
  console.log(`    - ${result.gapsDetected} gap nel framework attuale`);
  console.log(`    - ${result.pendingReviews} proposte di estensione\n`);

  console.log('  Per applicare le modifiche:');
  console.log('    1. Rivedere ogni proposta in review queue');
  console.log('    2. Approvare/modificare/rifiutare');
  console.log('    3. Le approvate vengono integrate nel codice');
  console.log('    4. Atlas si estende rispettando gli Assiomi!\n');

  console.log('  ✓ Ciclo autopoietico completato!\n');
}

// Run
runAutopoiesis().catch(console.error);
