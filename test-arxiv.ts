/**
 * Test Atlas with a real arXiv paper
 */

import { ArxivConnector, DocumentChunker } from './src/ingest';
import { Entity } from './src/core/types';
import { Domain, DOMAIN_INFO } from './src/core/domains';
import { strataFromPrimary, getPrimaryStratum, Stratum } from './src/core/strata';
import { createCapabilitySet, getStratumCapabilities } from './src/core/capabilities';

// Simple inline types (avoid circular deps)
interface ExtractedEntity {
  name: string;
  mentions: Array<{ text: string; start: number; end: number }>;
  context: string;
  confidence: number;
}

interface ExtractedRelation {
  source: string;
  target: string;
  type: string;
  evidence: string;
  confidence: number;
}

// Simple entity extractor
function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Pattern for capitalized phrases
  const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1]?.trim();
    if (!name || name.length < 3 || name.length > 40) continue;
    if (seen.has(name.toLowerCase())) continue;

    // Filter common words
    const common = ['The', 'This', 'That', 'These', 'Those', 'However', 'Therefore', 'Furthermore', 'Moreover', 'Abstract', 'Introduction', 'Conclusion', 'Results', 'Methods', 'Figure', 'Table'];
    if (common.includes(name)) continue;

    seen.add(name.toLowerCase());

    entities.push({
      name,
      mentions: [{ text: match[0], start: match.index, end: match.index + match[0].length }],
      context: text.slice(Math.max(0, match.index - 100), match.index + 100),
      confidence: 0.6 + Math.random() * 0.3,
    });
  }

  // Also extract technical terms
  const technicalPatterns = [
    /\b(\w+(?:tion|ment|ity|ness|ism|ology|esis|ance|ence))\b/gi,
  ];

  for (const pattern of technicalPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1]?.trim();
      if (!name || name.length < 5 || name.length > 30) continue;
      if (seen.has(name.toLowerCase())) continue;

      seen.add(name.toLowerCase());

      entities.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        mentions: [{ text: match[0], start: match.index, end: match.index + match[0].length }],
        context: text.slice(Math.max(0, match.index - 100), match.index + 100),
        confidence: 0.5 + Math.random() * 0.3,
      });
    }
  }

  return entities.sort((a, b) => b.confidence - a.confidence).slice(0, 25);
}

// Simple relation extractor
function extractRelations(text: string, entities: ExtractedEntity[]): ExtractedRelation[] {
  const relations: ExtractedRelation[] = [];
  const entityNames = new Set(entities.map(e => e.name.toLowerCase()));

  // Relation patterns
  const patterns = [
    { regex: /(\w+)\s+(?:is|are)\s+(?:a\s+)?part\s+of\s+(\w+)/gi, type: 'part_of' },
    { regex: /(\w+)\s+contains?\s+(\w+)/gi, type: 'contains' },
    { regex: /(\w+)\s+produces?\s+(\w+)/gi, type: 'produces' },
    { regex: /(\w+)\s+(?:depends?|relies?)\s+on\s+(\w+)/gi, type: 'depends_on' },
    { regex: /(\w+)\s+(?:regulates?|controls?)\s+(\w+)/gi, type: 'regulates' },
    { regex: /(\w+)\s+(?:is|are)\s+(?:a\s+)?(?:type|kind|form)\s+of\s+(\w+)/gi, type: 'is_a' },
  ];

  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const source = match[1];
      const target = match[2];

      if (entityNames.has(source.toLowerCase()) || entityNames.has(target.toLowerCase())) {
        relations.push({
          source,
          target,
          type,
          evidence: match[0],
          confidence: 0.7,
        });
      }
    }
  }

  return relations;
}

// Simple characterizer
function characterize(entity: ExtractedEntity, relations: ExtractedRelation[]): Entity {
  const context = entity.context.toLowerCase();

  // Determine domain
  let domain: Domain = 'INERT';
  if (context.includes('cell') || context.includes('organism') || context.includes('biological') || context.includes('living')) {
    domain = 'LIVING';
  } else if (context.includes('conscious') || context.includes('brain') || context.includes('cognitive') || context.includes('neural')) {
    domain = 'SENTIENT';
  } else if (context.includes('system') || context.includes('model') || context.includes('theory') || context.includes('concept')) {
    domain = 'SYMBOLIC';
  } else if (context.includes('organization') || context.includes('social') || context.includes('collective')) {
    domain = 'COLLECTIVE';
  } else if (context.includes('algorithm') || context.includes('mathematical') || context.includes('abstract')) {
    domain = 'IDEAL';
  } else if (context.includes('process') || context.includes('event') || context.includes('dynamic')) {
    domain = 'EPHEMERAL';
  } else if (context.includes('machine') || context.includes('software') || context.includes('artificial') || context.includes('computational')) {
    domain = 'ARTIFICIAL';
  }

  // Determine stratum
  let primaryStratum: Stratum = 'MATTER';
  if (domain === 'LIVING') primaryStratum = 'LIFE';
  else if (domain === 'SENTIENT') primaryStratum = 'SENTIENCE';
  else if (['SYMBOLIC', 'COLLECTIVE', 'IDEAL', 'ARTIFICIAL'].includes(domain)) primaryStratum = 'LOGOS';

  // Estimate closure
  let closure = 0.5;
  if (context.includes('self-') || context.includes('autonomous') || context.includes('autopoietic')) {
    closure += 0.2;
  }
  if (context.includes('depends') || context.includes('requires') || context.includes('needs')) {
    closure -= 0.1;
  }
  closure = Math.max(0.1, Math.min(0.9, closure));

  // Estimate scope
  let scope = 0.5;
  if (context.includes('universal') || context.includes('global') || context.includes('fundamental')) {
    scope += 0.2;
  }
  if (context.includes('local') || context.includes('specific') || context.includes('particular')) {
    scope -= 0.2;
  }
  scope = Math.max(0.1, Math.min(0.9, scope));

  return {
    id: entity.name.toLowerCase().replace(/\s+/g, '_'),
    name: entity.name,
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
      strata: strataFromPrimary(primaryStratum),
      capabilities: createCapabilitySet(getStratumCapabilities(primaryStratum)),
      relations: [],
      uncertainty: 1 - entity.confidence,
    },
  };
}

async function testWithArxiv() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          ATLAS AUTOPOIETIC ENGINE - ARXIV TEST                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // 1. INGEST - Fetch from arXiv
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 1: INGEST                                                 │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  const arxiv = new ArxivConnector();

  console.log('Fetching papers from arXiv for query: "autopoiesis"...\n');

  let documents = await arxiv.fetch('autopoiesis', { limit: 3 });

  if (documents.length === 0) {
    console.log('No documents for "autopoiesis". Trying "self-organizing systems"...\n');
    documents = await arxiv.fetch('self-organizing systems', { limit: 3 });
  }

  if (documents.length === 0) {
    console.log('No documents for "self-organizing systems". Trying "complex systems biology"...\n');
    documents = await arxiv.fetch('complex systems biology', { limit: 3 });
  }

  console.log(`Fetched ${documents.length} documents:\n`);

  for (const doc of documents) {
    console.log(`  📄 ${doc.title.slice(0, 65)}${doc.title.length > 65 ? '...' : ''}`);
    console.log(`     ID: ${doc.id}`);
    console.log(`     URL: ${doc.url}`);
    console.log(`     Text: ${doc.text.length} chars\n`);
  }

  if (documents.length === 0) {
    console.log('No documents to process. Check network connection.');
    return;
  }

  // Pick first document
  const doc = documents[0];

  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 2: EXTRACT                                                │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log(`Processing: "${doc.title.slice(0, 60)}..."\n`);

  // Extract entities from abstract
  const entities = extractEntities(doc.text);
  const relations = extractRelations(doc.text, entities);

  console.log(`Extracted ${entities.length} entities:\n`);

  for (const entity of entities.slice(0, 12)) {
    console.log(`  • ${entity.name.padEnd(25)} (conf: ${entity.confidence.toFixed(2)})`);
  }

  if (entities.length > 12) {
    console.log(`  ... and ${entities.length - 12} more\n`);
  }

  console.log(`\nExtracted ${relations.length} relations:\n`);

  for (const rel of relations.slice(0, 8)) {
    console.log(`  ${rel.source} ──[${rel.type}]──> ${rel.target}`);
  }

  if (relations.length > 8) {
    console.log(`  ... and ${relations.length - 8} more`);
  }

  // 3. CHARACTERIZE
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 3: CHARACTERIZE (ECF)                                     │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  const characterized: Entity[] = [];

  for (const entity of entities.slice(0, 10)) {
    const result = characterize(entity, relations);
    characterized.push(result);

    const primaryStratum = getPrimaryStratum(result.config.strata);

    console.log(`  ┌─ ${result.name} ${'─'.repeat(Math.max(0, 40 - result.name.length))}`);
    console.log(`  │ Domain:      ${result.domain}`);
    console.log(`  │ Closure:     ${result.config.closure.toFixed(3)}`);
    console.log(`  │ Scope:       ${result.config.scope.toFixed(3)}`);
    console.log(`  │ Stratum:     ${primaryStratum}`);
    console.log(`  │ Uncertainty: ${result.config.uncertainty.toFixed(3)}`);
    console.log(`  └${'─'.repeat(45)}\n`);
  }

  // 4. SUMMARY
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ SUMMARY                                                         │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log('  Autopoietic Cycle Results:');
  console.log('  ══════════════════════════\n');
  console.log(`  Documents ingested:     ${documents.length}`);
  console.log(`  Entities extracted:     ${entities.length}`);
  console.log(`  Relations found:        ${relations.length}`);
  console.log(`  Entities characterized: ${characterized.length}`);

  // Stats
  const avgClosure = characterized.reduce((s, e) => s + e.config.closure, 0) / characterized.length;
  const avgScope = characterized.reduce((s, e) => s + e.config.scope, 0) / characterized.length;
  const avgUncertainty = characterized.reduce((s, e) => s + e.config.uncertainty, 0) / characterized.length;

  console.log(`\n  Averages:`);
  console.log(`    Closure:     ${avgClosure.toFixed(3)}`);
  console.log(`    Scope:       ${avgScope.toFixed(3)}`);
  console.log(`    Uncertainty: ${avgUncertainty.toFixed(3)}`);

  // Domain distribution
  const domains: Record<string, number> = {};
  for (const e of characterized) {
    domains[e.domain] = (domains[e.domain] || 0) + 1;
  }

  console.log(`\n  Domain Distribution:`);
  for (const [domain, count] of Object.entries(domains).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(count * 2);
    console.log(`    ${domain.padEnd(12)} ${bar} ${count}`);
  }

  // Stratum distribution
  const strata: Record<string, number> = {};
  for (const e of characterized) {
    const primary = getPrimaryStratum(e.config.strata);
    strata[primary] = (strata[primary] || 0) + 1;
  }

  console.log(`\n  Stratum Distribution:`);
  for (const s of ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS']) {
    const count = strata[s] || 0;
    const bar = '█'.repeat(count * 2);
    console.log(`    ${s.padEnd(12)} ${bar} ${count}`);
  }

  console.log('\n  ✓ Atlas successfully processed scientific knowledge from arXiv!\n');
  console.log(`  Source: ${doc.url}\n`);
}

// Run
testWithArxiv().catch(console.error);
