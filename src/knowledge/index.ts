/**
 * Knowledge Graph
 *
 * Stores and queries characterized entities.
 * Supports multiple backends: memory, SQLite, Neo4j.
 */

import { Entity, EntityConfiguration, EntityRelation } from '../core/types';
import { Domain } from '../core/domains';
import { Stratum, StrataSet } from '../core/strata';

/**
 * Storage configuration
 */
export interface StorageConfig {
  type: 'memory' | 'sqlite' | 'neo4j';
  connection?: string;
}

/**
 * Graph statistics
 */
export interface GraphStats {
  entityCount: number;
  relationCount: number;
  domainDistribution: Record<Domain, number>;
  stratumDistribution: Record<Stratum, number>;
  avgClosure: number;
  avgScope: number;
  avgUncertainty: number;
}

/**
 * Query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'closure' | 'scope' | 'uncertainty' | 'created';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Entity cluster
 */
export interface EntityCluster {
  id: string;
  entities: Entity[];
  centroid: {
    closure: number;
    scope: number;
  };
  cohesion: number;
}

/**
 * Knowledge gap
 */
export interface KnowledgeGap {
  type: 'missing_entity' | 'sparse_domain' | 'high_uncertainty' | 'missing_relation';
  description: string;
  severity: number;
  suggestedQuery: string;
}

/**
 * Knowledge Graph interface
 */
export class KnowledgeGraph {
  private storage: GraphStorage;

  constructor(config: StorageConfig) {
    switch (config.type) {
      case 'memory':
        this.storage = new MemoryStorage();
        break;
      case 'sqlite':
        this.storage = new SQLiteStorage(config.connection || './atlas.db');
        break;
      case 'neo4j':
        this.storage = new Neo4jStorage(config.connection || 'bolt://localhost:7687');
        break;
      default:
        this.storage = new MemoryStorage();
    }
  }

  /**
   * Add entity to graph
   */
  async add(entity: Entity): Promise<string> {
    return this.storage.add(entity);
  }

  /**
   * Get entity by ID
   */
  async get(id: string): Promise<Entity | null> {
    return this.storage.get(id);
  }

  /**
   * Update entity
   */
  async update(id: string, updates: Partial<Entity>): Promise<void> {
    return this.storage.update(id, updates);
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    return this.storage.delete(id);
  }

  /**
   * Find similar entity by name
   */
  async findSimilar(name: string): Promise<Entity | null> {
    return this.storage.findSimilar(name);
  }

  /**
   * Merge new entity with existing
   */
  async merge(existingId: string, newEntity: Entity): Promise<void> {
    const existing = await this.get(existingId);
    if (!existing) return;

    // Merge strategy: keep higher confidence values
    const merged: Entity = {
      ...existing,
      config: {
        ...existing.config,
        // If new has lower uncertainty, prefer new values
        closure: newEntity.config.uncertainty < existing.config.uncertainty
          ? newEntity.config.closure
          : existing.config.closure,
        scope: newEntity.config.uncertainty < existing.config.uncertainty
          ? newEntity.config.scope
          : existing.config.scope,
        // Merge relations
        relations: this.mergeRelations(
          existing.config.relations,
          newEntity.config.relations
        ),
        // Take lower uncertainty
        uncertainty: Math.min(
          existing.config.uncertainty,
          newEntity.config.uncertainty
        ),
      },
    };

    await this.update(existingId, merged);
  }

  /**
   * Merge relation arrays
   */
  private mergeRelations(
    existing: EntityRelation[],
    incoming: EntityRelation[]
  ): EntityRelation[] {
    const merged = [...existing];

    for (const rel of incoming) {
      const exists = merged.some(
        r => r.targetId === rel.targetId && r.type === rel.type
      );

      if (!exists) {
        merged.push(rel);
      }
    }

    return merged;
  }

  /**
   * Find entities by domain
   */
  async findByDomain(domain: Domain, options?: QueryOptions): Promise<Entity[]> {
    return this.storage.findByDomain(domain, options);
  }

  /**
   * Find entities by stratum
   */
  async findByStratum(stratum: Stratum, options?: QueryOptions): Promise<Entity[]> {
    return this.storage.findByStratum(stratum, options);
  }

  /**
   * Find entities by closure range
   */
  async findByClosureRange(
    min: number,
    max: number,
    options?: QueryOptions
  ): Promise<Entity[]> {
    return this.storage.findByClosureRange(min, max, options);
  }

  /**
   * Find entities by scope range
   */
  async findByScopeRange(
    min: number,
    max: number,
    options?: QueryOptions
  ): Promise<Entity[]> {
    return this.storage.findByScopeRange(min, max, options);
  }

  /**
   * Find related entities
   */
  async findRelated(id: string, depth: number = 1): Promise<Entity[]> {
    return this.storage.findRelated(id, depth);
  }

  /**
   * Find shortest path between entities
   */
  async shortestPath(fromId: string, toId: string): Promise<Entity[]> {
    return this.storage.shortestPath(fromId, toId);
  }

  /**
   * Find entity clusters
   */
  async findClusters(k: number = 5): Promise<EntityCluster[]> {
    return this.storage.findClusters(k);
  }

  /**
   * Get graph statistics
   */
  async getStats(): Promise<GraphStats> {
    return this.storage.getStats();
  }

  /**
   * Search entities by text
   */
  async search(query: string, options?: QueryOptions): Promise<Entity[]> {
    return this.storage.search(query, options);
  }

  /**
   * Find knowledge gaps
   */
  async findGaps(): Promise<KnowledgeGap[]> {
    const stats = await this.getStats();
    const gaps: KnowledgeGap[] = [];

    // Check for sparse domains
    const domains: Domain[] = ['INERT', 'LIVING', 'SENTIENT', 'SYMBOLIC', 'COLLECTIVE', 'IDEAL', 'EPHEMERAL', 'ARTIFICIAL'];
    for (const domain of domains) {
      const count = stats.domainDistribution[domain] || 0;
      if (count < 5) {
        gaps.push({
          type: 'sparse_domain',
          description: `Domain ${domain} has only ${count} entities`,
          severity: 1 - (count / 10),
          suggestedQuery: `${domain.toLowerCase()} entities examples`,
        });
      }
    }

    // Check for high-uncertainty entities
    const uncertainEntities = await this.storage.findByUncertaintyRange(0.6, 1.0);
    if (uncertainEntities.length > 0) {
      gaps.push({
        type: 'high_uncertainty',
        description: `${uncertainEntities.length} entities have uncertainty > 0.6`,
        severity: uncertainEntities.length / stats.entityCount,
        suggestedQuery: uncertainEntities[0]?.name || 'entity ontology',
      });
    }

    // Check for missing relations (referenced but not characterized)
    const missingRelations = await this.storage.findOrphanRelations();
    for (const missing of missingRelations.slice(0, 5)) {
      gaps.push({
        type: 'missing_entity',
        description: `Entity "${missing}" is referenced but not characterized`,
        severity: 0.5,
        suggestedQuery: missing,
      });
    }

    return gaps.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Export graph to JSON
   */
  async export(): Promise<{ entities: Entity[]; relations: EntityRelation[] }> {
    return this.storage.export();
  }

  /**
   * Import graph from JSON
   */
  async import(data: { entities: Entity[]; relations?: EntityRelation[] }): Promise<void> {
    for (const entity of data.entities) {
      await this.add(entity);
    }
  }
}

/**
 * Storage interface
 */
interface GraphStorage {
  add(entity: Entity): Promise<string>;
  get(id: string): Promise<Entity | null>;
  update(id: string, updates: Partial<Entity>): Promise<void>;
  delete(id: string): Promise<void>;
  findSimilar(name: string): Promise<Entity | null>;
  findByDomain(domain: Domain, options?: QueryOptions): Promise<Entity[]>;
  findByStratum(stratum: Stratum, options?: QueryOptions): Promise<Entity[]>;
  findByClosureRange(min: number, max: number, options?: QueryOptions): Promise<Entity[]>;
  findByScopeRange(min: number, max: number, options?: QueryOptions): Promise<Entity[]>;
  findByUncertaintyRange(min: number, max: number): Promise<Entity[]>;
  findRelated(id: string, depth: number): Promise<Entity[]>;
  shortestPath(fromId: string, toId: string): Promise<Entity[]>;
  findClusters(k: number): Promise<EntityCluster[]>;
  findOrphanRelations(): Promise<string[]>;
  getStats(): Promise<GraphStats>;
  search(query: string, options?: QueryOptions): Promise<Entity[]>;
  export(): Promise<{ entities: Entity[]; relations: EntityRelation[] }>;
}

/**
 * In-memory storage (for development/testing)
 */
class MemoryStorage implements GraphStorage {
  private entities: Map<string, Entity> = new Map();

  async add(entity: Entity): Promise<string> {
    this.entities.set(entity.id, { ...entity });
    return entity.id;
  }

  async get(id: string): Promise<Entity | null> {
    return this.entities.get(id) || null;
  }

  async update(id: string, updates: Partial<Entity>): Promise<void> {
    const existing = this.entities.get(id);
    if (existing) {
      this.entities.set(id, { ...existing, ...updates });
    }
  }

  async delete(id: string): Promise<void> {
    this.entities.delete(id);
  }

  async findSimilar(name: string): Promise<Entity | null> {
    const normalized = name.toLowerCase();
    for (const entity of this.entities.values()) {
      if (entity.name.toLowerCase() === normalized) {
        return entity;
      }
    }
    return null;
  }

  async findByDomain(domain: Domain, options?: QueryOptions): Promise<Entity[]> {
    const results = Array.from(this.entities.values())
      .filter(e => e.domain === domain);
    return this.applyOptions(results, options);
  }

  async findByStratum(stratum: Stratum, options?: QueryOptions): Promise<Entity[]> {
    const results = Array.from(this.entities.values())
      .filter(e => e.config.strata[stratum]);
    return this.applyOptions(results, options);
  }

  async findByClosureRange(min: number, max: number, options?: QueryOptions): Promise<Entity[]> {
    const results = Array.from(this.entities.values())
      .filter(e => e.config.closure >= min && e.config.closure <= max);
    return this.applyOptions(results, options);
  }

  async findByScopeRange(min: number, max: number, options?: QueryOptions): Promise<Entity[]> {
    const results = Array.from(this.entities.values())
      .filter(e => e.config.scope >= min && e.config.scope <= max);
    return this.applyOptions(results, options);
  }

  async findByUncertaintyRange(min: number, max: number): Promise<Entity[]> {
    return Array.from(this.entities.values())
      .filter(e => e.config.uncertainty >= min && e.config.uncertainty <= max);
  }

  async findRelated(id: string, depth: number): Promise<Entity[]> {
    const entity = this.entities.get(id);
    if (!entity) return [];

    const related: Set<string> = new Set();
    const queue: Array<{ id: string; d: number }> = [{ id, d: 0 }];

    while (queue.length > 0) {
      const { id: currentId, d } = queue.shift()!;
      if (d >= depth) continue;

      const current = this.entities.get(currentId);
      if (!current) continue;

      for (const rel of current.config.relations) {
        if (!related.has(rel.targetId)) {
          related.add(rel.targetId);
          queue.push({ id: rel.targetId, d: d + 1 });
        }
      }
    }

    return Array.from(related)
      .map(id => this.entities.get(id))
      .filter((e): e is Entity => e !== undefined);
  }

  async shortestPath(fromId: string, toId: string): Promise<Entity[]> {
    // Simple BFS
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === toId) {
        return path.map(id => this.entities.get(id)!).filter(e => e);
      }

      if (visited.has(id)) continue;
      visited.add(id);

      const entity = this.entities.get(id);
      if (!entity) continue;

      for (const rel of entity.config.relations) {
        if (!visited.has(rel.targetId)) {
          queue.push({ id: rel.targetId, path: [...path, rel.targetId] });
        }
      }
    }

    return [];
  }

  async findClusters(k: number): Promise<EntityCluster[]> {
    // Simple k-means on closure/scope
    const entities = Array.from(this.entities.values());
    if (entities.length < k) return [];

    // Initialize centroids
    const centroids = entities.slice(0, k).map(e => ({
      closure: e.config.closure,
      scope: e.config.scope,
    }));

    // Assign entities to clusters
    const clusters: EntityCluster[] = centroids.map((c, i) => ({
      id: `cluster_${i}`,
      entities: [],
      centroid: c,
      cohesion: 0,
    }));

    for (const entity of entities) {
      let minDist = Infinity;
      let closestIdx = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist = Math.sqrt(
          Math.pow(entity.config.closure - centroids[i].closure, 2) +
          Math.pow(entity.config.scope - centroids[i].scope, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      clusters[closestIdx].entities.push(entity);
    }

    // Calculate cohesion
    for (const cluster of clusters) {
      if (cluster.entities.length === 0) continue;

      const avgDist = cluster.entities.reduce((sum, e) => {
        const dist = Math.sqrt(
          Math.pow(e.config.closure - cluster.centroid.closure, 2) +
          Math.pow(e.config.scope - cluster.centroid.scope, 2)
        );
        return sum + dist;
      }, 0) / cluster.entities.length;

      cluster.cohesion = 1 / (1 + avgDist);
    }

    return clusters.filter(c => c.entities.length > 0);
  }

  async findOrphanRelations(): Promise<string[]> {
    const referenced = new Set<string>();
    const characterized = new Set(this.entities.keys());

    for (const entity of this.entities.values()) {
      for (const rel of entity.config.relations) {
        referenced.add(rel.targetId);
      }
    }

    return Array.from(referenced).filter(id => !characterized.has(id));
  }

  async getStats(): Promise<GraphStats> {
    const entities = Array.from(this.entities.values());

    const domainDist: Record<Domain, number> = {
      INERT: 0, LIVING: 0, SENTIENT: 0, SYMBOLIC: 0,
      COLLECTIVE: 0, IDEAL: 0, EPHEMERAL: 0, ARTIFICIAL: 0,
    };

    const stratumDist: Record<Stratum, number> = {
      MATTER: 0, LIFE: 0, SENTIENCE: 0, LOGOS: 0,
    };

    let totalClosure = 0;
    let totalScope = 0;
    let totalUncertainty = 0;
    let totalRelations = 0;

    for (const entity of entities) {
      domainDist[entity.domain]++;

      if (entity.config.strata.MATTER) stratumDist.MATTER++;
      if (entity.config.strata.LIFE) stratumDist.LIFE++;
      if (entity.config.strata.SENTIENCE) stratumDist.SENTIENCE++;
      if (entity.config.strata.LOGOS) stratumDist.LOGOS++;

      totalClosure += entity.config.closure;
      totalScope += entity.config.scope;
      totalUncertainty += entity.config.uncertainty;
      totalRelations += entity.config.relations.length;
    }

    const count = entities.length || 1;

    return {
      entityCount: entities.length,
      relationCount: totalRelations,
      domainDistribution: domainDist,
      stratumDistribution: stratumDist,
      avgClosure: totalClosure / count,
      avgScope: totalScope / count,
      avgUncertainty: totalUncertainty / count,
    };
  }

  async search(query: string, options?: QueryOptions): Promise<Entity[]> {
    const normalized = query.toLowerCase();
    const results = Array.from(this.entities.values())
      .filter(e =>
        e.name.toLowerCase().includes(normalized) ||
        e.description?.toLowerCase().includes(normalized)
      );
    return this.applyOptions(results, options);
  }

  async export(): Promise<{ entities: Entity[]; relations: EntityRelation[] }> {
    const entities = Array.from(this.entities.values());
    const relations: EntityRelation[] = [];

    for (const entity of entities) {
      for (const rel of entity.config.relations) {
        relations.push({ ...rel });
      }
    }

    return { entities, relations };
  }

  private applyOptions(entities: Entity[], options?: QueryOptions): Entity[] {
    let result = [...entities];

    if (options?.sortBy) {
      result.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (options.sortBy) {
          case 'name': aVal = a.name; bVal = b.name; break;
          case 'closure': aVal = a.config.closure; bVal = b.config.closure; break;
          case 'scope': aVal = a.config.scope; bVal = b.config.scope; break;
          case 'uncertainty': aVal = a.config.uncertainty; bVal = b.config.uncertainty; break;
          default: return 0;
        }
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    if (options?.offset) {
      result = result.slice(options.offset);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }
}

/**
 * SQLite storage (placeholder - would use better-sqlite3 or similar)
 */
class SQLiteStorage extends MemoryStorage {
  constructor(private connection: string) {
    super();
    console.log(`SQLite storage initialized with: ${connection}`);
    // In production: initialize database, create tables
  }
}

/**
 * Neo4j storage (placeholder - would use neo4j-driver)
 */
class Neo4jStorage extends MemoryStorage {
  constructor(private connection: string) {
    super();
    console.log(`Neo4j storage initialized with: ${connection}`);
    // In production: initialize driver, verify connection
  }
}
