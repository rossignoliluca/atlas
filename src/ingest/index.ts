/**
 * Ingest Layer
 *
 * Fetches and parses documents from external scientific sources.
 * Sources: arXiv, PubMed, Wikipedia, Wikidata, Semantic Scholar
 */

/**
 * Raw document from source
 */
export interface RawDocument {
  id: string;
  source: SourceType;
  title: string;
  text: string;
  abstract?: string;
  authors?: string[];
  date?: Date;
  url: string;
  metadata: Record<string, any>;
}

/**
 * Supported sources
 */
export type SourceType = 'arxiv' | 'pubmed' | 'wikipedia' | 'wikidata' | 'semantic_scholar' | 'url';

/**
 * Source configuration
 */
export interface SourceConfig {
  arxiv?: boolean;
  pubmed?: boolean;
  wikipedia?: boolean;
  wikidata?: boolean;
  semanticScholar?: boolean;
}

/**
 * Fetch options
 */
export interface FetchOptions {
  source?: string;
  limit?: number;
  since?: Date;
  categories?: string[];
}

/**
 * Source connector interface
 */
export interface SourceConnector {
  name: SourceType;
  fetch(query: string, options?: FetchOptions): Promise<RawDocument[]>;
  isAvailable(): Promise<boolean>;
}

/**
 * arXiv Connector
 */
export class ArxivConnector implements SourceConnector {
  name: SourceType = 'arxiv';

  async fetch(query: string, options?: FetchOptions): Promise<RawDocument[]> {
    const limit = options?.limit || 10;

    // arXiv API URL
    const baseUrl = 'http://export.arxiv.org/api/query';
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: String(limit),
      sortBy: 'relevance',
      sortOrder: 'descending',
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      const xml = await response.text();

      // Parse XML (simplified - would use proper XML parser)
      return this.parseArxivXml(xml);
    } catch (error) {
      console.error('arXiv fetch error:', error);
      return [];
    }
  }

  private parseArxivXml(xml: string): RawDocument[] {
    // Simplified parsing - in production use xml2js or similar
    const entries: RawDocument[] = [];

    // Extract entries using regex (simplified)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];

      const id = this.extractTag(entry, 'id') || '';
      const title = this.extractTag(entry, 'title') || '';
      const summary = this.extractTag(entry, 'summary') || '';
      const published = this.extractTag(entry, 'published');

      entries.push({
        id: id.split('/abs/').pop() || id,
        source: 'arxiv',
        title: title.replace(/\s+/g, ' ').trim(),
        text: summary.replace(/\s+/g, ' ').trim(),
        abstract: summary.replace(/\s+/g, ' ').trim(),
        date: published ? new Date(published) : undefined,
        url: id,
        metadata: { raw: entry },
      });
    }

    return entries;
  }

  private extractTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://export.arxiv.org/api/query?search_query=test&max_results=1');
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Wikipedia Connector
 */
export class WikipediaConnector implements SourceConnector {
  name: SourceType = 'wikipedia';

  async fetch(query: string, options?: FetchOptions): Promise<RawDocument[]> {
    const limit = options?.limit || 10;

    const baseUrl = 'https://en.wikipedia.org/w/api.php';
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: String(limit),
      format: 'json',
      origin: '*',
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json() as { query?: { search?: Array<{ pageid: number; title: string; snippet: string; wordcount: number }> } };

      const documents: RawDocument[] = [];

      for (const result of data.query?.search || []) {
        // Fetch full page content
        const pageContent = await this.fetchPageContent(result.title);

        documents.push({
          id: `wiki_${result.pageid}`,
          source: 'wikipedia',
          title: result.title,
          text: pageContent || result.snippet.replace(/<[^>]*>/g, ''),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
          metadata: {
            pageid: result.pageid,
            wordcount: result.wordcount,
          },
        });
      }

      return documents;
    } catch (error) {
      console.error('Wikipedia fetch error:', error);
      return [];
    }
  }

  private async fetchPageContent(title: string): Promise<string | null> {
    const baseUrl = 'https://en.wikipedia.org/w/api.php';
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'extracts',
      exintro: 'true',
      explaintext: 'true',
      format: 'json',
      origin: '*',
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json() as { query?: { pages?: Record<string, { extract?: string }> } };

      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      return pages[pageId]?.extract || null;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*');
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Wikidata Connector
 * Fetches structured entity data
 */
export class WikidataConnector implements SourceConnector {
  name: SourceType = 'wikidata';

  async fetch(query: string, options?: FetchOptions): Promise<RawDocument[]> {
    const limit = options?.limit || 10;

    // SPARQL query for entities
    const sparql = `
      SELECT ?item ?itemLabel ?itemDescription WHERE {
        ?item rdfs:label "${query}"@en.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT ${limit}
    `;

    const baseUrl = 'https://query.wikidata.org/sparql';
    const params = new URLSearchParams({
      query: sparql,
      format: 'json',
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`, {
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json() as { results?: { bindings?: Array<{ item?: { value?: string }; itemLabel?: { value?: string }; itemDescription?: { value?: string } }> } };

      const documents: RawDocument[] = [];

      for (const result of data.results?.bindings || []) {
        const id = result.item?.value?.split('/').pop() || '';

        documents.push({
          id: `wikidata_${id}`,
          source: 'wikidata',
          title: result.itemLabel?.value || '',
          text: result.itemDescription?.value || '',
          url: result.item?.value || '',
          metadata: { wikidataId: id },
        });
      }

      return documents;
    } catch (error) {
      console.error('Wikidata fetch error:', error);
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://query.wikidata.org/sparql?query=ASK{}', {
        headers: { 'Accept': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Generic URL Connector
 * Fetches and parses arbitrary web pages
 */
export class UrlConnector implements SourceConnector {
  name: SourceType = 'url';

  async fetch(url: string): Promise<RawDocument[]> {
    try {
      const response = await fetch(url);
      const html = await response.text();

      // Simple HTML to text conversion
      const text = this.htmlToText(html);
      const title = this.extractTitle(html);

      return [{
        id: `url_${Buffer.from(url).toString('base64').slice(0, 20)}`,
        source: 'url',
        title: title || url,
        text,
        url,
        metadata: { originalUrl: url },
      }];
    } catch (error) {
      console.error('URL fetch error:', error);
      return [];
    }
  }

  private htmlToText(html: string): string {
    // Remove scripts and styles
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');

    // Clean whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  private extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : null;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }
}

/**
 * Ingest Pipeline
 * Coordinates fetching from multiple sources
 */
export class IngestPipeline {
  private connectors: Map<SourceType, SourceConnector> = new Map();

  constructor(config: SourceConfig) {
    // Initialize enabled connectors
    if (config.arxiv) {
      this.connectors.set('arxiv', new ArxivConnector());
    }
    if (config.wikipedia) {
      this.connectors.set('wikipedia', new WikipediaConnector());
    }
    if (config.wikidata) {
      this.connectors.set('wikidata', new WikidataConnector());
    }

    // Always have URL connector
    this.connectors.set('url', new UrlConnector());
  }

  /**
   * Fetch documents matching query
   */
  async fetch(query: string, options?: FetchOptions): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];

    // If specific source requested
    if (options?.source) {
      const connector = this.connectors.get(options.source as SourceType);
      if (connector) {
        const docs = await connector.fetch(query, options);
        documents.push(...docs);
      }
      return documents;
    }

    // Fetch from all sources in parallel
    const promises: Promise<RawDocument[]>[] = [];

    for (const connector of this.connectors.values()) {
      if (connector.name !== 'url') { // URL requires specific URL
        promises.push(
          connector.fetch(query, options).catch(err => {
            console.error(`${connector.name} error:`, err);
            return [];
          })
        );
      }
    }

    const results = await Promise.all(promises);
    for (const docs of results) {
      documents.push(...docs);
    }

    // Deduplicate by title
    const seen = new Set<string>();
    return documents.filter(doc => {
      const key = doc.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Fetch from specific URL
   */
  async fetchUrl(url: string): Promise<RawDocument[]> {
    const connector = this.connectors.get('url') as UrlConnector;
    return connector.fetch(url);
  }

  /**
   * Check which sources are available
   */
  async checkAvailability(): Promise<Map<SourceType, boolean>> {
    const status = new Map<SourceType, boolean>();

    for (const [name, connector] of this.connectors) {
      status.set(name, await connector.isAvailable());
    }

    return status;
  }

  /**
   * Get list of enabled sources
   */
  getSources(): SourceType[] {
    return Array.from(this.connectors.keys());
  }
}

/**
 * Document chunker for long texts
 */
export class DocumentChunker {
  private maxChunkSize: number;
  private overlap: number;

  constructor(maxChunkSize = 1000, overlap = 100) {
    this.maxChunkSize = maxChunkSize;
    this.overlap = overlap;
  }

  /**
   * Chunk a document into smaller pieces
   */
  chunk(doc: RawDocument): TextChunk[] {
    const text = doc.text;
    const chunks: TextChunk[] = [];

    if (text.length <= this.maxChunkSize) {
      chunks.push({
        documentId: doc.id,
        index: 0,
        text,
        start: 0,
        end: text.length,
      });
      return chunks;
    }

    // Split into sentences first
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    let chunkStart = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.maxChunkSize) {
        // Save current chunk
        if (currentChunk.length > 0) {
          chunks.push({
            documentId: doc.id,
            index: chunkIndex++,
            text: currentChunk.trim(),
            start: chunkStart,
            end: chunkStart + currentChunk.length,
          });
        }

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-this.overlap);
        chunkStart = chunkStart + currentChunk.length - overlapText.length;
        currentChunk = overlapText + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        documentId: doc.id,
        index: chunkIndex,
        text: currentChunk.trim(),
        start: chunkStart,
        end: chunkStart + currentChunk.length,
      });
    }

    return chunks;
  }
}

/**
 * Text chunk
 */
export interface TextChunk {
  documentId: string;
  index: number;
  text: string;
  start: number;
  end: number;
}
