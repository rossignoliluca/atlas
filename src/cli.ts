#!/usr/bin/env node

/**
 * Atlas CLI
 *
 * Command-line interface for the Atlas Autopoietic Engine.
 *
 * Usage:
 *   atlas init                    Initialize new Atlas database
 *   atlas ingest <query>          Ingest documents matching query
 *   atlas ingest-url <url>        Ingest from URL
 *   atlas get <entity-id>         Get entity by ID
 *   atlas search <query>          Search entities
 *   atlas find --domain <domain>  Find entities by domain
 *   atlas stats                   Show graph statistics
 *   atlas gaps                    Show knowledge gaps
 *   atlas hypotheses              Show generated hypotheses
 *   atlas review list             List items needing review
 *   atlas review approve <id>     Approve review item
 *   atlas review reject <id>      Reject review item
 *   atlas run-cycle               Run full autopoietic cycle
 *   atlas export                  Export graph to JSON
 *   atlas import <file>           Import graph from JSON
 */

import { AtlasEngine, createEngine, EngineConfig, DEFAULT_CONFIG } from './engine';
import { KnowledgeGraph } from './knowledge';
import { PatternDetector, HypothesisGenerator } from './production';
import { CATALOG } from './catalog';

// Minimal argument parsing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'init':
      await initCommand();
      break;

    case 'ingest':
      await ingestCommand(args[1]);
      break;

    case 'ingest-url':
      await ingestUrlCommand(args[1]);
      break;

    case 'get':
      await getCommand(args[1]);
      break;

    case 'search':
      await searchCommand(args[1]);
      break;

    case 'find':
      await findCommand(args);
      break;

    case 'stats':
      await statsCommand();
      break;

    case 'gaps':
      await gapsCommand();
      break;

    case 'hypotheses':
      await hypothesesCommand();
      break;

    case 'review':
      await reviewCommand(args.slice(1));
      break;

    case 'run-cycle':
      await runCycleCommand(args[1]);
      break;

    case 'export':
      await exportCommand();
      break;

    case 'import':
      await importCommand(args[1]);
      break;

    case 'catalog':
      await catalogCommand();
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

/**
 * Initialize Atlas
 */
async function initCommand() {
  console.log('Initializing Atlas...');

  const engine = await createEngine();
  console.log('Engine initialized.');

  // Load catalog into graph
  console.log(`Loading ${CATALOG.length} entities from catalog...`);

  // Note: In production, this would persist
  console.log('Atlas initialized successfully.');
  console.log('\nRun "atlas stats" to see current state.');
}

/**
 * Ingest documents
 */
async function ingestCommand(query: string) {
  if (!query) {
    console.error('Usage: atlas ingest <query>');
    process.exit(1);
  }

  console.log(`Ingesting documents for query: "${query}"...`);

  const engine = await createEngine();
  const result = await engine.runCycle({ query, maxDocuments: 10 });

  console.log('\nIngestion complete:');
  console.log(`  Documents processed: ${result.documentsProcessed}`);
  console.log(`  Entities extracted: ${result.entitiesExtracted}`);
  console.log(`  Entities characterized: ${result.entitiesCharacterized}`);
  console.log(`  Entities stored: ${result.entitiesStored}`);
  console.log(`  Hypotheses generated: ${result.hypothesesGenerated}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.log(`  [${err.phase}] ${err.message}`);
    }
  }
}

/**
 * Ingest from URL
 */
async function ingestUrlCommand(url: string) {
  if (!url) {
    console.error('Usage: atlas ingest-url <url>');
    process.exit(1);
  }

  console.log(`Ingesting from URL: ${url}...`);

  // Implementation would use IngestPipeline.fetchUrl
  console.log('URL ingestion not yet implemented in CLI.');
}

/**
 * Get entity
 */
async function getCommand(id: string) {
  if (!id) {
    console.error('Usage: atlas get <entity-id>');
    process.exit(1);
  }

  // Check catalog first
  const catalogEntity = CATALOG.find(e => e.id === id);

  if (catalogEntity) {
    printEntity(catalogEntity);
  } else {
    console.log(`Entity "${id}" not found.`);
  }
}

/**
 * Search entities
 */
async function searchCommand(query: string) {
  if (!query) {
    console.error('Usage: atlas search <query>');
    process.exit(1);
  }

  const normalized = query.toLowerCase();
  const results = CATALOG.filter(e =>
    e.name.toLowerCase().includes(normalized) ||
    e.description?.toLowerCase().includes(normalized) ||
    e.domain.toLowerCase().includes(normalized)
  );

  console.log(`Found ${results.length} entities matching "${query}":\n`);

  for (const entity of results.slice(0, 20)) {
    console.log(`  ${entity.id.padEnd(20)} ${entity.name.padEnd(25)} [${entity.domain}] C=${entity.config.closure.toFixed(2)} S=${entity.config.scope.toFixed(2)}`);
  }

  if (results.length > 20) {
    console.log(`\n  ... and ${results.length - 20} more`);
  }
}

/**
 * Find entities by criteria
 */
async function findCommand(args: string[]) {
  const domainIdx = args.indexOf('--domain');
  const stratumIdx = args.indexOf('--stratum');
  const closureIdx = args.indexOf('--closure');

  let results = [...CATALOG];

  if (domainIdx !== -1 && args[domainIdx + 1]) {
    const domain = args[domainIdx + 1].toUpperCase();
    results = results.filter(e => e.domain === domain);
  }

  if (stratumIdx !== -1 && args[stratumIdx + 1]) {
    const stratum = args[stratumIdx + 1].toUpperCase() as 'MATTER' | 'LIFE' | 'SENTIENCE' | 'LOGOS';
    results = results.filter(e => e.config.strata[stratum]);
  }

  if (closureIdx !== -1 && args[closureIdx + 1]) {
    const [min, max] = args[closureIdx + 1].split('-').map(Number);
    results = results.filter(e =>
      e.config.closure >= (min || 0) && e.config.closure <= (max || 1)
    );
  }

  console.log(`Found ${results.length} entities:\n`);

  for (const entity of results) {
    console.log(`  ${entity.id.padEnd(20)} ${entity.name.padEnd(25)} [${entity.domain}] C=${entity.config.closure.toFixed(2)} S=${entity.config.scope.toFixed(2)}`);
  }
}

/**
 * Show statistics
 */
async function statsCommand() {
  console.log('Atlas Statistics\n');
  console.log('================\n');

  console.log(`Total entities: ${CATALOG.length}\n`);

  // Domain distribution
  console.log('By Domain:');
  const domains: Record<string, number> = {};
  for (const entity of CATALOG) {
    domains[entity.domain] = (domains[entity.domain] || 0) + 1;
  }
  for (const [domain, count] of Object.entries(domains).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${domain.padEnd(12)} ${count}`);
  }

  // Stratum distribution
  console.log('\nBy Stratum:');
  const strata = { MATTER: 0, LIFE: 0, SENTIENCE: 0, LOGOS: 0 };
  for (const entity of CATALOG) {
    if (entity.config.strata.MATTER) strata.MATTER++;
    if (entity.config.strata.LIFE) strata.LIFE++;
    if (entity.config.strata.SENTIENCE) strata.SENTIENCE++;
    if (entity.config.strata.LOGOS) strata.LOGOS++;
  }
  for (const [stratum, count] of Object.entries(strata)) {
    console.log(`  ${stratum.padEnd(12)} ${count}`);
  }

  // Averages
  const avgClosure = CATALOG.reduce((sum, e) => sum + e.config.closure, 0) / CATALOG.length;
  const avgScope = CATALOG.reduce((sum, e) => sum + e.config.scope, 0) / CATALOG.length;
  const avgUncertainty = CATALOG.reduce((sum, e) => sum + e.config.uncertainty, 0) / CATALOG.length;

  console.log('\nAverages:');
  console.log(`  Closure:     ${avgClosure.toFixed(3)}`);
  console.log(`  Scope:       ${avgScope.toFixed(3)}`);
  console.log(`  Uncertainty: ${avgUncertainty.toFixed(3)}`);
}

/**
 * Show knowledge gaps
 */
async function gapsCommand() {
  console.log('Knowledge Gaps\n');
  console.log('==============\n');

  // Check for sparse domains
  const domains: Record<string, number> = {};
  for (const entity of CATALOG) {
    domains[entity.domain] = (domains[entity.domain] || 0) + 1;
  }

  console.log('Sparse Domains (< 5 entities):');
  for (const [domain, count] of Object.entries(domains)) {
    if (count < 5) {
      console.log(`  ${domain}: only ${count} entities`);
    }
  }

  // High uncertainty entities
  const uncertain = CATALOG.filter(e => e.config.uncertainty > 0.5);
  console.log(`\nHigh Uncertainty Entities (> 0.5): ${uncertain.length}`);
  for (const entity of uncertain.slice(0, 5)) {
    console.log(`  ${entity.name}: U=${entity.config.uncertainty.toFixed(2)}`);
  }

  console.log('\nSuggested Actions:');
  console.log('  - Ingest more entities for sparse domains');
  console.log('  - Review high-uncertainty characterizations');
}

/**
 * Show hypotheses
 */
async function hypothesesCommand() {
  console.log('Generated Hypotheses\n');
  console.log('====================\n');

  // Would get from production layer
  console.log('No hypotheses generated yet.');
  console.log('\nRun "atlas run-cycle" to generate hypotheses from patterns.');
}

/**
 * Review commands
 */
async function reviewCommand(args: string[]) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'list':
      console.log('Review Queue\n');
      console.log('============\n');
      console.log('No items pending review.');
      break;

    case 'approve':
      if (!args[1]) {
        console.error('Usage: atlas review approve <id>');
        process.exit(1);
      }
      console.log(`Approving item ${args[1]}...`);
      break;

    case 'reject':
      if (!args[1]) {
        console.error('Usage: atlas review reject <id> [reason]');
        process.exit(1);
      }
      console.log(`Rejecting item ${args[1]}...`);
      break;

    default:
      console.log('Usage: atlas review <list|approve|reject>');
  }
}

/**
 * Run full cycle
 */
async function runCycleCommand(query?: string) {
  console.log('Running autopoietic cycle...\n');

  const engine = await createEngine();
  const result = await engine.runCycle({
    query: query || 'entity ontology',
    maxDocuments: 5,
  });

  console.log('Cycle complete:');
  console.log(`  Duration: ${(result.endTime.getTime() - result.startTime.getTime()) / 1000}s`);
  console.log(`  Documents: ${result.documentsProcessed}`);
  console.log(`  Entities extracted: ${result.entitiesExtracted}`);
  console.log(`  Entities characterized: ${result.entitiesCharacterized}`);
  console.log(`  Entities stored: ${result.entitiesStored}`);
  console.log(`  Hypotheses: ${result.hypothesesGenerated}`);
  console.log(`  Extensions proposed: ${result.extensionsProposed}`);
}

/**
 * Export graph
 */
async function exportCommand() {
  const output = {
    version: '0.1.0',
    exportedAt: new Date().toISOString(),
    entities: CATALOG.map(e => ({
      id: e.id,
      name: e.name,
      domain: e.domain,
      closure: e.config.closure,
      scope: e.config.scope,
      strata: e.config.strata,
      uncertainty: e.config.uncertainty,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

/**
 * Import graph
 */
async function importCommand(file: string) {
  if (!file) {
    console.error('Usage: atlas import <file.json>');
    process.exit(1);
  }

  console.log(`Importing from ${file}...`);
  console.log('Import not yet implemented.');
}

/**
 * Show catalog
 */
async function catalogCommand() {
  console.log(`Entity Catalog (${CATALOG.length} entities)\n`);
  console.log('='.repeat(80) + '\n');

  // Group by domain
  const byDomain = new Map<string, typeof CATALOG>();
  for (const entity of CATALOG) {
    if (!byDomain.has(entity.domain)) {
      byDomain.set(entity.domain, []);
    }
    byDomain.get(entity.domain)!.push(entity);
  }

  for (const [domain, entities] of byDomain) {
    console.log(`\n${domain} (${entities.length})`);
    console.log('-'.repeat(40));
    for (const entity of entities) {
      console.log(`  ${entity.name.padEnd(25)} C=${entity.config.closure.toFixed(2)} S=${entity.config.scope.toFixed(2)}`);
    }
  }
}

/**
 * Print entity details
 */
function printEntity(entity: typeof CATALOG[0]) {
  console.log('\n' + '='.repeat(50));
  console.log(`Entity: ${entity.name}`);
  console.log('='.repeat(50));
  console.log(`ID:          ${entity.id}`);
  console.log(`Domain:      ${entity.domain}`);
  console.log(`Description: ${entity.description || 'N/A'}`);
  console.log();
  console.log('Configuration:');
  console.log(`  Closure (C):    ${entity.config.closure.toFixed(3)}`);
  console.log(`  Scope (S):      ${entity.config.scope.toFixed(3)}`);
  console.log(`  Uncertainty:    ${entity.config.uncertainty.toFixed(3)}`);
  console.log();
  console.log('Strata:');
  console.log(`  MATTER:    ${entity.config.strata.MATTER ? '✓' : '✗'}`);
  console.log(`  LIFE:      ${entity.config.strata.LIFE ? '✓' : '✗'}`);
  console.log(`  SENTIENCE: ${entity.config.strata.SENTIENCE ? '✓' : '✗'}`);
  console.log(`  LOGOS:     ${entity.config.strata.LOGOS ? '✓' : '✗'}`);
  console.log();
  console.log('Modes:');
  console.log(`  Composition:   ${entity.modes.composition}`);
  console.log(`  Origin:        ${entity.modes.origin}`);
  console.log(`  Temporality:   ${entity.modes.temporality}`);
  console.log(`  Localization:  ${entity.modes.localization}`);
  console.log();
  console.log(`Capabilities: ${Array.from(entity.config.capabilities).join(', ')}`);
  console.log(`Relations:    ${entity.config.relations.length}`);
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Atlas - Entity Characterization Framework CLI

Usage:
  atlas <command> [options]

Commands:
  init                        Initialize Atlas database
  ingest <query>              Ingest documents matching query
  ingest-url <url>            Ingest from URL
  get <entity-id>             Get entity by ID
  search <query>              Search entities by name/description
  find --domain <D>           Find entities by domain
  find --stratum <S>          Find entities by stratum
  find --closure <min-max>    Find entities by closure range
  catalog                     Show all catalog entities
  stats                       Show graph statistics
  gaps                        Show knowledge gaps
  hypotheses                  Show generated hypotheses
  review list                 List items needing review
  review approve <id>         Approve review item
  review reject <id>          Reject review item
  run-cycle [query]           Run full autopoietic cycle
  export                      Export graph to JSON
  import <file>               Import graph from JSON
  help                        Show this help

Domains:
  INERT, LIVING, SENTIENT, SYMBOLIC, COLLECTIVE, IDEAL, EPHEMERAL, ARTIFICIAL

Strata:
  MATTER, LIFE, SENTIENCE, LOGOS

Examples:
  atlas init
  atlas catalog
  atlas get human
  atlas search "cell"
  atlas find --domain LIVING
  atlas find --closure 0.4-0.8
  atlas stats
  atlas run-cycle "quantum biology"
`);
}

// Run
main().catch(console.error);
