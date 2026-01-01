/**
 * Extraction Layer
 *
 * Extracts entities and relations from text using LLM.
 */

import { LLMConfig, ExtractedEntity, ExtractedRelation } from '../engine';

/**
 * Entity Extractor
 * Identifies entities mentioned in text
 */
export class EntityExtractor {
  constructor(private llmConfig: LLMConfig) {}

  /**
   * Extract entities from text
   */
  async extract(text: string): Promise<ExtractedEntity[]> {
    // In production, this would call the LLM
    // For now, use a simplified NER-like approach

    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    // Patterns for entity detection
    const patterns = [
      // Capitalized phrases (proper nouns)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,

      // Scientific terms (often followed by definitions)
      /\b(\w+)\s+(?:is|are|refers to|means|denotes)\b/gi,

      // Items in lists
      /(?:such as|including|e\.g\.|for example)[:\s]+([^.]+)/gi,

      // Quoted terms
      /"([^"]+)"/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();

        if (!name || name.length < 2 || name.length > 50) continue;
        if (seen.has(name.toLowerCase())) continue;

        // Filter common words
        if (this.isCommonWord(name)) continue;

        seen.add(name.toLowerCase());

        entities.push({
          name,
          mentions: [{
            text: match[0],
            start: match.index,
            end: match.index + match[0].length,
          }],
          context: this.extractContext(text, match.index, 200),
          confidence: this.estimateConfidence(name, text),
        });
      }
    }

    // Sort by confidence
    entities.sort((a, b) => b.confidence - a.confidence);

    // Limit to top entities
    return entities.slice(0, 20);
  }

  /**
   * Extract context around a position
   */
  private extractContext(text: string, position: number, windowSize: number): string {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    return text.slice(start, end).trim();
  }

  /**
   * Estimate confidence based on text features
   */
  private estimateConfidence(name: string, text: string): number {
    let confidence = 0.5;

    // Frequency boost
    const regex = new RegExp(`\\b${this.escapeRegex(name)}\\b`, 'gi');
    const matches = text.match(regex) || [];
    confidence += Math.min(matches.length * 0.05, 0.2);

    // Capitalization boost
    if (/^[A-Z]/.test(name)) {
      confidence += 0.1;
    }

    // Length penalty for very short names
    if (name.length < 4) {
      confidence -= 0.1;
    }

    // Boost for scientific-looking terms
    if (/(?:tion|ment|ity|ology|ism)$/.test(name)) {
      confidence += 0.1;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Check if word is too common to be an entity
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
      'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'but', 'and', 'or',
      'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for',
      'with', 'about', 'against', 'between', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
      'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
      'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
      'however', 'therefore', 'thus', 'hence', 'also', 'well', 'even',
      'still', 'already', 'yet', 'now', 'today', 'tomorrow', 'yesterday',
    ]);

    return commonWords.has(word.toLowerCase());
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Relation Extractor
 * Identifies relations between entities
 */
export class RelationExtractor {
  constructor(private llmConfig: LLMConfig) {}

  /**
   * Extract relations from text given entities
   */
  async extract(
    text: string,
    entities: ExtractedEntity[]
  ): Promise<ExtractedRelation[]> {
    const relations: ExtractedRelation[] = [];

    // Relation patterns
    const patterns: Array<{
      regex: RegExp;
      type: string;
      sourceGroup: number;
      targetGroup: number;
    }> = [
      // X is part of Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+(?:is|are)\s+(?:a\s+)?part\s+of\s+(\w+(?:\s+\w+)?)/gi,
        type: 'part_of',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X contains Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+contains?\s+(\w+(?:\s+\w+)?)/gi,
        type: 'contains',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X produces Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+produces?\s+(\w+(?:\s+\w+)?)/gi,
        type: 'produces',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X depends on Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+depends?\s+on\s+(\w+(?:\s+\w+)?)/gi,
        type: 'depends_on',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X is a type of Y / X is a Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+(?:is|are)\s+(?:a\s+)?(?:type|kind|form)\s+of\s+(\w+(?:\s+\w+)?)/gi,
        type: 'inherits_from',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X causes Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+causes?\s+(\w+(?:\s+\w+)?)/gi,
        type: 'produces',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X leads to Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+leads?\s+to\s+(\w+(?:\s+\w+)?)/gi,
        type: 'produces',
        sourceGroup: 1,
        targetGroup: 2,
      },
      // X regulates Y
      {
        regex: /(\w+(?:\s+\w+)?)\s+regulates?\s+(\w+(?:\s+\w+)?)/gi,
        type: 'transforms',
        sourceGroup: 1,
        targetGroup: 2,
      },
    ];

    // Entity name lookup for matching
    const entityNames = new Set(entities.map(e => e.name.toLowerCase()));

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        const source = match[pattern.sourceGroup]?.trim();
        const target = match[pattern.targetGroup]?.trim();

        if (!source || !target) continue;

        // Check if both are known entities
        const sourceMatch = this.findMatchingEntity(source, entityNames);
        const targetMatch = this.findMatchingEntity(target, entityNames);

        if (sourceMatch && targetMatch) {
          relations.push({
            source: sourceMatch,
            target: targetMatch,
            type: pattern.type,
            evidence: match[0],
            confidence: 0.7, // Base confidence for pattern match
          });
        }
      }
    }

    // Also check co-occurrence (entities mentioned close together likely related)
    const cooccurrences = this.findCooccurrences(text, entities);
    for (const cooc of cooccurrences) {
      // Avoid duplicates
      const exists = relations.some(
        r => r.source === cooc.source && r.target === cooc.target
      );

      if (!exists) {
        relations.push({
          source: cooc.source,
          target: cooc.target,
          type: 'connects_to', // Generic relation
          evidence: cooc.context,
          confidence: 0.4, // Lower confidence for co-occurrence
        });
      }
    }

    // Deduplicate and merge
    return this.deduplicateRelations(relations);
  }

  /**
   * Find entity name that matches (case insensitive)
   */
  private findMatchingEntity(text: string, entityNames: Set<string>): string | null {
    const lower = text.toLowerCase();
    if (entityNames.has(lower)) {
      return text;
    }
    return null;
  }

  /**
   * Find entities that co-occur in same sentence
   */
  private findCooccurrences(
    text: string,
    entities: ExtractedEntity[]
  ): Array<{ source: string; target: string; context: string }> {
    const cooccurrences: Array<{ source: string; target: string; context: string }> = [];

    // Split into sentences
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const foundEntities: string[] = [];

      for (const entity of entities) {
        if (sentence.toLowerCase().includes(entity.name.toLowerCase())) {
          foundEntities.push(entity.name);
        }
      }

      // Create pairs from co-occurring entities
      for (let i = 0; i < foundEntities.length; i++) {
        for (let j = i + 1; j < foundEntities.length; j++) {
          cooccurrences.push({
            source: foundEntities[i],
            target: foundEntities[j],
            context: sentence.trim(),
          });
        }
      }
    }

    return cooccurrences;
  }

  /**
   * Deduplicate relations, keeping highest confidence
   */
  private deduplicateRelations(relations: ExtractedRelation[]): ExtractedRelation[] {
    const map = new Map<string, ExtractedRelation>();

    for (const rel of relations) {
      const key = `${rel.source}|${rel.type}|${rel.target}`;

      if (!map.has(key) || map.get(key)!.confidence < rel.confidence) {
        map.set(key, rel);
      }
    }

    return Array.from(map.values());
  }
}

/**
 * LLM-based Entity Extractor (production version)
 */
export class LLMEntityExtractor {
  constructor(private llmConfig: LLMConfig) {}

  /**
   * Extract entities using LLM
   */
  async extract(text: string): Promise<ExtractedEntity[]> {
    const prompt = `Extract all named entities from the following text. For each entity, provide:
- name: The entity name
- type: Type of entity (person, organization, concept, process, object, etc.)
- importance: How central this entity is to the text (high/medium/low)

Text:
${text}

Return JSON array:
[{"name": "...", "type": "...", "importance": "..."}]`;

    // In production, call LLM here
    // const response = await this.callLLM(prompt);

    // For now, fall back to pattern-based extraction
    const patternExtractor = new EntityExtractor(this.llmConfig);
    return patternExtractor.extract(text);
  }
}

/**
 * LLM-based Relation Extractor (production version)
 */
export class LLMRelationExtractor {
  constructor(private llmConfig: LLMConfig) {}

  /**
   * Extract relations using LLM
   */
  async extract(
    text: string,
    entities: ExtractedEntity[]
  ): Promise<ExtractedRelation[]> {
    const entityNames = entities.map(e => e.name).join(', ');

    const prompt = `Given these entities: ${entityNames}

Extract all relations between them from the following text. For each relation, provide:
- source: Source entity name
- target: Target entity name
- type: Relation type (part_of, contains, produces, depends_on, etc.)
- evidence: Quote from text supporting this relation

Text:
${text}

Return JSON array:
[{"source": "...", "target": "...", "type": "...", "evidence": "..."}]`;

    // In production, call LLM here
    // const response = await this.callLLM(prompt);

    // For now, fall back to pattern-based extraction
    const patternExtractor = new RelationExtractor(this.llmConfig);
    return patternExtractor.extract(text, entities);
  }
}
