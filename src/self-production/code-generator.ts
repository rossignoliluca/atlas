/**
 * Code Generator
 *
 * Uses LLM to generate TypeScript code for framework extensions.
 * Generated code must pass AXIS validation before being accepted.
 */

import { Gap, SuggestedAction } from './gap-analyzer';
import { Stratum } from '../core/strata';

/**
 * Types of code that can be generated
 */
export type GenerationType =
  | 'domain'       // New domain type
  | 'capability'   // New capability
  | 'relation'     // New relation type
  | 'connector'    // New data source connector
  | 'extractor'    // New entity extractor
  | 'protocol';    // New characterization protocol

/**
 * Generated code artifact
 */
export interface GeneratedCode {
  id: string;
  type: GenerationType;
  name: string;
  description: string;
  code: string;
  targetFile: string;
  insertionPoint: InsertionPoint;
  dependencies: string[];
  axiomJustification: AxiomJustification;
  generatedAt: Date;
  sourceGap: Gap;
}

/**
 * Where to insert the generated code
 */
export interface InsertionPoint {
  file: string;
  after?: string;   // Insert after this pattern
  before?: string;  // Insert before this pattern
  replace?: string; // Replace this pattern
  append?: boolean; // Append to file
}

/**
 * Justification that code respects axioms
 */
export interface AxiomJustification {
  axioms: Array<{
    id: string;      // A1-A10
    status: 'respected' | 'not_applicable' | 'needs_review';
    explanation: string;
  }>;
  overallCompliance: number; // 0-1
}

/**
 * LLM configuration for code generation
 */
export interface CodeGeneratorConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: CodeGeneratorConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  temperature: 0.3,  // Low for code generation
  maxTokens: 4000,
};

/**
 * Code Generator
 */
export class CodeGenerator {
  private config: CodeGeneratorConfig;
  private generationCounter = 0;

  constructor(config: Partial<CodeGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate code for a gap
   */
  async generate(gap: Gap): Promise<GeneratedCode | null> {
    const action = gap.suggestedAction;

    switch (action.type) {
      case 'new_domain':
        return this.generateDomain(gap, action);
      case 'new_capability':
        return this.generateCapability(gap, action);
      case 'new_relation':
        return this.generateRelation(gap, action);
      case 'new_connector':
        return this.generateConnector(gap, action);
      default:
        return null; // Can't auto-generate for manual_review or axiom_review
    }
  }

  /**
   * Generate a new domain type
   */
  private async generateDomain(gap: Gap, action: SuggestedAction): Promise<GeneratedCode> {
    const { suggestedName, characteristics, exampleEntities } = action.parameters;

    const code = this.buildDomainCode(suggestedName, characteristics, exampleEntities);

    return {
      id: this.generateId('domain'),
      type: 'domain',
      name: suggestedName,
      description: `New domain for entities with characteristics: ${characteristics.join(', ')}`,
      code,
      targetFile: 'src/core/domains.ts',
      insertionPoint: {
        file: 'src/core/domains.ts',
        after: "// AUTO-GENERATED DOMAINS BELOW",
      },
      dependencies: [],
      axiomJustification: this.justifyDomain(suggestedName, characteristics),
      generatedAt: new Date(),
      sourceGap: gap,
    };
  }

  /**
   * Generate a new capability
   */
  private async generateCapability(gap: Gap, action: SuggestedAction): Promise<GeneratedCode> {
    const { name, description, emergentFromStratum, exampleEntities } = action.parameters;

    const code = this.buildCapabilityCode(name, description, emergentFromStratum);

    return {
      id: this.generateId('capability'),
      type: 'capability',
      name,
      description: `New capability: ${description}`,
      code,
      targetFile: 'src/core/capabilities.ts',
      insertionPoint: {
        file: 'src/core/capabilities.ts',
        after: "// AUTO-GENERATED CAPABILITIES BELOW",
      },
      dependencies: [],
      axiomJustification: this.justifyCapability(name, emergentFromStratum),
      generatedAt: new Date(),
      sourceGap: gap,
    };
  }

  /**
   * Generate a new relation type
   */
  private async generateRelation(gap: Gap, action: SuggestedAction): Promise<GeneratedCode> {
    const { name, occurrences, examples } = action.parameters;

    const code = this.buildRelationCode(name, examples);

    return {
      id: this.generateId('relation'),
      type: 'relation',
      name,
      description: `New relation type "${name}" observed in ${occurrences} entity pairs`,
      code,
      targetFile: 'src/core/relations.ts',
      insertionPoint: {
        file: 'src/core/relations.ts',
        after: "// AUTO-GENERATED RELATIONS BELOW",
      },
      dependencies: [],
      axiomJustification: this.justifyRelation(name),
      generatedAt: new Date(),
      sourceGap: gap,
    };
  }

  /**
   * Generate a new data source connector
   */
  private async generateConnector(gap: Gap, action: SuggestedAction): Promise<GeneratedCode> {
    const { sourceName, sourceUrl, queryFormat } = action.parameters;

    const code = this.buildConnectorCode(sourceName, sourceUrl, queryFormat);

    return {
      id: this.generateId('connector'),
      type: 'connector',
      name: `${sourceName}Connector`,
      description: `Connector for ${sourceName} scientific database`,
      code,
      targetFile: `src/ingest/${sourceName.toLowerCase()}-connector.ts`,
      insertionPoint: {
        file: `src/ingest/${sourceName.toLowerCase()}-connector.ts`,
        append: true,
      },
      dependencies: [],
      axiomJustification: this.justifyConnector(sourceName),
      generatedAt: new Date(),
      sourceGap: gap,
    };
  }

  // ============ Code Builders ============

  private buildDomainCode(name: string, characteristics: string[], examples: string[]): string {
    const normalizedName = name.toUpperCase().replace(/\s+/g, '_');

    return `
/**
 * ${normalizedName} Domain
 *
 * Auto-generated domain for entities with:
 * ${characteristics.map(c => `- ${c}`).join('\n * ')}
 *
 * Example entities: ${examples.join(', ')}
 *
 * @generated
 */
export const DOMAIN_${normalizedName}: DomainDefinition = {
  name: '${normalizedName}',
  description: 'Entities characterized by: ${characteristics.join(', ')}',
  characteristics: ${JSON.stringify(characteristics, null, 2)},
  typicalClosure: ${this.inferTypicalClosure(characteristics)},
  typicalScope: ${this.inferTypicalScope(characteristics)},
  compatibleStrata: ${JSON.stringify(this.inferCompatibleStrata(characteristics))},
};

// Add to DOMAINS array
// DOMAINS.push(DOMAIN_${normalizedName});
`;
  }

  private buildCapabilityCode(name: string, description: string, emergentFrom: Stratum): string {
    const normalizedName = name.toUpperCase().replace(/\s+/g, '_');

    return `
/**
 * ${normalizedName} Capability
 *
 * ${description}
 *
 * Emergent from: ${emergentFrom} stratum (per A5: Capability Emergence)
 *
 * @generated
 */
export const CAPABILITY_${normalizedName}: CapabilityDefinition = {
  name: '${normalizedName}',
  description: '${description}',
  emergentFrom: '${emergentFrom}',
  requires: ${JSON.stringify(this.inferRequiredCapabilities(emergentFrom))},
  enables: [],  // To be determined through observation
};

// Add to CAPABILITIES array
// CAPABILITIES.push(CAPABILITY_${normalizedName});
`;
  }

  private buildRelationCode(name: string, examples: string[]): string {
    const normalizedName = name.toUpperCase().replace(/\s+/g, '_');

    return `
/**
 * ${normalizedName} Relation
 *
 * Examples:
 * ${examples.slice(0, 5).map(e => `- ${e}`).join('\n * ')}
 *
 * @generated
 */
export const RELATION_${normalizedName}: RelationDefinition = {
  name: '${normalizedName}',
  description: 'Relation type: ${name}',
  symmetric: ${this.inferSymmetry(name)},
  transitive: ${this.inferTransitivity(name)},
  inverseOf: null,  // To be determined
};

// Add to RELATIONS array
// RELATIONS.push(RELATION_${normalizedName});
`;
  }

  private buildConnectorCode(name: string, url: string, queryFormat: string): string {
    const className = `${name}Connector`;

    return `
/**
 * ${name} Connector
 *
 * Fetches documents from ${name} scientific database.
 *
 * @generated
 */
import { SourceConnector, RawDocument, FetchOptions, SourceType } from './index';

export class ${className} implements SourceConnector {
  name: SourceType = '${name.toLowerCase()}' as SourceType;

  private baseUrl = '${url || 'https://api.example.com'}';

  async fetch(query: string, options?: FetchOptions): Promise<RawDocument[]> {
    const limit = options?.limit || 10;

    try {
      // TODO: Implement actual API call
      // const response = await fetch(\`\${this.baseUrl}?q=\${encodeURIComponent(query)}&limit=\${limit}\`);
      // const data = await response.json();

      console.log(\`[${className}] Would fetch: \${query} (limit: \${limit})\`);

      // Placeholder - implement actual fetching
      return [];
    } catch (error) {
      console.error('${name} fetch error:', error);
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // TODO: Implement availability check
      // const response = await fetch(\`\${this.baseUrl}/health\`);
      // return response.ok;
      return false;
    } catch {
      return false;
    }
  }
}
`;
  }

  // ============ Axiom Justification ============

  private justifyDomain(name: string, characteristics: string[]): AxiomJustification {
    return {
      axioms: [
        {
          id: 'A1',
          status: 'respected',
          explanation: `Domain ${name} defines a class of entities that maintain themselves and make differences`,
        },
        {
          id: 'A2',
          status: 'respected',
          explanation: 'Domain provides typical Config values for contained entities',
        },
        {
          id: 'A3',
          status: 'needs_review',
          explanation: 'Closure-Scope trade-off should be verified for domain members',
        },
        {
          id: 'A4',
          status: 'not_applicable',
          explanation: 'Stratal nesting is entity-level, not domain-level',
        },
        {
          id: 'A5',
          status: 'not_applicable',
          explanation: 'Capability emergence is entity-level, not domain-level',
        },
        {
          id: 'A6',
          status: 'respected',
          explanation: 'Domain is characterizable through the six geometries',
        },
        {
          id: 'A7',
          status: 'respected',
          explanation: 'Domain definition acknowledges observer perspective',
        },
        {
          id: 'A8',
          status: 'respected',
          explanation: 'Domain boundaries are pragmatically drawn based on characteristics',
        },
        {
          id: 'A9',
          status: 'not_applicable',
          explanation: 'Temporal identity is entity-level',
        },
        {
          id: 'A10',
          status: 'needs_review',
          explanation: 'Verify domain is minimal necessary categorization',
        },
      ],
      overallCompliance: 0.85,
    };
  }

  private justifyCapability(name: string, emergentFrom: Stratum): AxiomJustification {
    const strataOrder: Stratum[] = ['MATTER', 'LIFE', 'SENTIENCE', 'LOGOS'];
    const stratumIndex = strataOrder.indexOf(emergentFrom);

    return {
      axioms: [
        {
          id: 'A1',
          status: 'not_applicable',
          explanation: 'Capabilities are properties of entities, not entities themselves',
        },
        {
          id: 'A2',
          status: 'respected',
          explanation: 'Capability will be part of K in Config(E)',
        },
        {
          id: 'A3',
          status: 'not_applicable',
          explanation: 'Capabilities do not have closure/scope',
        },
        {
          id: 'A4',
          status: 'not_applicable',
          explanation: 'Capabilities belong to strata, not vice versa',
        },
        {
          id: 'A5',
          status: stratumIndex >= 0 ? 'respected' : 'needs_review',
          explanation: `Capability ${name} emerges from ${emergentFrom} stratum (A5 compliance)`,
        },
        {
          id: 'A6',
          status: 'not_applicable',
          explanation: 'Capabilities are not directly characterized by geometries',
        },
        {
          id: 'A7',
          status: 'respected',
          explanation: 'Capability definition acknowledges observer-dependent detection',
        },
        {
          id: 'A8',
          status: 'not_applicable',
          explanation: 'Capabilities are not boundary-based',
        },
        {
          id: 'A9',
          status: 'not_applicable',
          explanation: 'Capabilities do not have temporal identity',
        },
        {
          id: 'A10',
          status: 'needs_review',
          explanation: 'Verify capability is not reducible to existing capabilities',
        },
      ],
      overallCompliance: stratumIndex >= 0 ? 0.9 : 0.5,
    };
  }

  private justifyRelation(name: string): AxiomJustification {
    return {
      axioms: [
        {
          id: 'A1',
          status: 'not_applicable',
          explanation: 'Relations connect entities, are not entities themselves',
        },
        {
          id: 'A2',
          status: 'respected',
          explanation: 'Relations are part of R in Config(E)',
        },
        {
          id: 'A3',
          status: 'not_applicable',
          explanation: 'Relations do not have closure/scope directly',
        },
        {
          id: 'A4',
          status: 'not_applicable',
          explanation: 'Relations are not stratified',
        },
        {
          id: 'A5',
          status: 'not_applicable',
          explanation: 'Relations are not capabilities',
        },
        {
          id: 'A6',
          status: 'respected',
          explanation: 'Relation maps to Connection geometry',
        },
        {
          id: 'A7',
          status: 'respected',
          explanation: 'Relation detection depends on observer',
        },
        {
          id: 'A8',
          status: 'respected',
          explanation: 'Relation boundaries are pragmatically defined',
        },
        {
          id: 'A9',
          status: 'not_applicable',
          explanation: 'Relations do not have temporal identity',
        },
        {
          id: 'A10',
          status: 'needs_review',
          explanation: 'Verify relation is not reducible to existing relations',
        },
      ],
      overallCompliance: 0.85,
    };
  }

  private justifyConnector(name: string): AxiomJustification {
    return {
      axioms: [
        {
          id: 'A1',
          status: 'not_applicable',
          explanation: 'Connectors are tools, not characterized entities',
        },
        {
          id: 'A2',
          status: 'not_applicable',
          explanation: 'Connectors do not have Config',
        },
        {
          id: 'A3',
          status: 'not_applicable',
          explanation: 'Connectors do not have closure/scope',
        },
        {
          id: 'A4',
          status: 'not_applicable',
          explanation: 'Connectors are infrastructure',
        },
        {
          id: 'A5',
          status: 'not_applicable',
          explanation: 'Connectors do not have capabilities',
        },
        {
          id: 'A6',
          status: 'not_applicable',
          explanation: 'Connectors are not characterized by geometries',
        },
        {
          id: 'A7',
          status: 'not_applicable',
          explanation: 'Connectors are implementation detail',
        },
        {
          id: 'A8',
          status: 'not_applicable',
          explanation: 'Connectors do not have boundaries in ECF sense',
        },
        {
          id: 'A9',
          status: 'not_applicable',
          explanation: 'Connectors do not have entity identity',
        },
        {
          id: 'A10',
          status: 'not_applicable',
          explanation: 'Connectors are not entity characterizations',
        },
      ],
      overallCompliance: 1.0, // Connectors don't touch axioms
    };
  }

  // ============ Inference Helpers ============

  private inferTypicalClosure(characteristics: string[]): number {
    const closureKeywords = ['autonomous', 'independent', 'self-', 'closed'];
    const openKeywords = ['dependent', 'open', 'connected', 'reliant'];

    let score = 0.5;
    for (const char of characteristics) {
      const lower = char.toLowerCase();
      if (closureKeywords.some(k => lower.includes(k))) score += 0.1;
      if (openKeywords.some(k => lower.includes(k))) score -= 0.1;
    }

    return Math.max(0.1, Math.min(0.9, score));
  }

  private inferTypicalScope(characteristics: string[]): number {
    const broadKeywords = ['universal', 'global', 'extensive', 'wide'];
    const narrowKeywords = ['local', 'specific', 'limited', 'narrow'];

    let score = 0.5;
    for (const char of characteristics) {
      const lower = char.toLowerCase();
      if (broadKeywords.some(k => lower.includes(k))) score += 0.1;
      if (narrowKeywords.some(k => lower.includes(k))) score -= 0.1;
    }

    return Math.max(0.1, Math.min(0.9, score));
  }

  private inferCompatibleStrata(characteristics: string[]): Stratum[] {
    const strata: Stratum[] = ['MATTER']; // Always include base

    const charString = characteristics.join(' ').toLowerCase();

    if (charString.includes('living') || charString.includes('biological') || charString.includes('metabol')) {
      strata.push('LIFE');
    }
    if (charString.includes('sentient') || charString.includes('conscious') || charString.includes('feel')) {
      strata.push('LIFE', 'SENTIENCE');
    }
    if (charString.includes('symbolic') || charString.includes('language') || charString.includes('norm')) {
      strata.push('LIFE', 'SENTIENCE', 'LOGOS');
    }

    return [...new Set(strata)];
  }

  private inferRequiredCapabilities(emergentFrom: Stratum): string[] {
    const requirements: Record<Stratum, string[]> = {
      MATTER: [],
      LIFE: ['PERSIST'],
      SENTIENCE: ['PERSIST', 'SELF_PRODUCE'],
      LOGOS: ['PERSIST', 'SELF_PRODUCE', 'FEEL', 'EVALUATE'],
    };

    return requirements[emergentFrom] || [];
  }

  private inferSymmetry(name: string): boolean {
    const symmetricPatterns = ['connected_to', 'related_to', 'similar_to', 'entangled_with'];
    return symmetricPatterns.some(p => name.toLowerCase().includes(p.replace('_', '')));
  }

  private inferTransitivity(name: string): boolean {
    const transitivePatterns = ['part_of', 'contains', 'ancestor_of', 'precedes'];
    return transitivePatterns.some(p => name.toLowerCase().includes(p.replace('_', '')));
  }

  private generateId(type: string): string {
    return `gen_${type}_${Date.now()}_${++this.generationCounter}`;
  }
}
