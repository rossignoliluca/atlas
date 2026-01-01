# Atlas Autopoietic Architecture

## Overview

Atlas is not just a static framework - it is a **self-producing system** that:

1. **Ingests** scientific knowledge from external sources
2. **Processes** it through ECF characterization
3. **Stores** entities in a knowledge graph
4. **Produces** new knowledge through pattern recognition
5. **Extends** itself based on discovered gaps
6. **Validates** extensions against axioms

This document describes the complete architecture.

---

## The Autopoietic Cycle

```
                    ┌─────────────────────────────────────────┐
                    │           EXTERNAL WORLD                │
                    │  (Papers, Databases, Observations)      │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              INGEST LAYER                                │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   arXiv     │  │   PubMed    │  │  Wikipedia  │  │  Wikidata   │     │
│  │  Connector  │  │  Connector  │  │  Connector  │  │  Connector  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         └────────────────┴────────────────┴────────────────┘            │
│                                    │                                     │
│                                    ▼                                     │
│                          ┌─────────────────┐                            │
│                          │  Source Parser  │                            │
│                          │  (Extract text, │                            │
│                          │   metadata)     │                            │
│                          └────────┬────────┘                            │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           EXTRACTION LAYER                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Entity Extractor (LLM)                        │    │
│  │                                                                  │    │
│  │  Input: Scientific text                                         │    │
│  │  Output: List of entities mentioned                             │    │
│  │                                                                  │    │
│  │  "The mitochondria produces ATP through oxidative..."           │    │
│  │  → [mitochondria, ATP, oxidative_phosphorylation, cell]         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   Relation Extractor (LLM)                       │    │
│  │                                                                  │    │
│  │  Input: Text + Entities                                         │    │
│  │  Output: Relations between entities                             │    │
│  │                                                                  │    │
│  │  → [mitochondria --produces--> ATP]                             │    │
│  │  → [mitochondria --part_of--> cell]                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        CHARACTERIZATION LAYER                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    ECF Characterizer                             │    │
│  │                                                                  │    │
│  │  For each entity, determine:                                    │    │
│  │                                                                  │    │
│  │  ┌────────────────────────────────────────────────────────┐     │    │
│  │  │ Config(E) = {                                          │     │    │
│  │  │   C: closure estimate [0,1]                            │     │    │
│  │  │   S: scope estimate [0,∞)                              │     │    │
│  │  │   Σ: strata set                                        │     │    │
│  │  │   K: capabilities                                      │     │    │
│  │  │   R: relations (from extraction)                       │     │    │
│  │  │   U: uncertainty [0,1]                                 │     │    │
│  │  │ }                                                      │     │    │
│  │  └────────────────────────────────────────────────────────┘     │    │
│  │                                                                  │    │
│  │  Uses: Protocol A (New Entity) executed programmatically        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Axiom Validator                               │    │
│  │                                                                  │    │
│  │  Check characterization against AXIS invariants:                │    │
│  │  - Stratal nesting (LOGOS ⊃ SENTIENCE ⊃ LIFE ⊃ MATTER)         │    │
│  │  - Capability consistency (prereqs satisfied)                   │    │
│  │  - C-S tension within bounds                                    │    │
│  │  - Mode coherence                                               │    │
│  │                                                                  │    │
│  │  If invalid → flag for human review                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          KNOWLEDGE GRAPH                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Entity Store                                 │    │
│  │                                                                  │    │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │    │
│  │  │  cell   │───▶│  mito   │───▶│   ATP   │    │ enzyme  │      │    │
│  │  │ C=0.8   │    │ C=0.6   │    │ C=0.1   │    │ C=0.2   │      │    │
│  │  │ S=0.05  │    │ S=0.02  │    │ S=0.15  │    │ S=0.1   │      │    │
│  │  │ Σ=LIFE  │    │ Σ=LIFE  │    │ Σ=MATT  │    │ Σ=MATT  │      │    │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │    │
│  │       │              │              │              │            │    │
│  │       └──────────────┴──────────────┴──────────────┘            │    │
│  │                           │                                      │    │
│  │                    RELATIONS GRAPH                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Storage: Neo4j / SQLite+JSON / In-memory for small scale              │
│  Indexes: By domain, stratum, closure range, scope range               │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION LAYER                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   Pattern Detector                               │    │
│  │                                                                  │    │
│  │  Find:                                                          │    │
│  │  - Clusters of similar entities                                 │    │
│  │  - Missing relations (A→B, B→C, but no A→C?)                   │    │
│  │  - Stratal anomalies (high C but low stratum?)                  │    │
│  │  - Scope-closure correlations per domain                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   Gap Identifier                                 │    │
│  │                                                                  │    │
│  │  Detect:                                                        │    │
│  │  - Uncharacterized entities referenced in relations             │    │
│  │  - Domains with sparse coverage                                 │    │
│  │  - Boundary disputes (entities with U > 0.7)                    │    │
│  │  - Framework limitations (recurring characterization failures)   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  Hypothesis Generator                            │    │
│  │                                                                  │    │
│  │  Produce:                                                       │    │
│  │  - New entity characterizations                                 │    │
│  │  - Predicted relations                                          │    │
│  │  - Framework extension proposals                                │    │
│  │  - Research questions                                           │    │
│  │                                                                  │    │
│  │  Output format: Structured proposals for human review           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          EXTENSION LAYER                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   Self-Extension Engine                          │    │
│  │                                                                  │    │
│  │  When patterns suggest framework limitation:                    │    │
│  │                                                                  │    │
│  │  1. Propose extension (new capability, domain, mode)            │    │
│  │  2. Check against AXIS axioms (must not violate)                │    │
│  │  3. Generate test cases                                         │    │
│  │  4. Submit for human approval                                   │    │
│  │  5. If approved, update framework                               │    │
│  │                                                                  │    │
│  │  INVARIANT: AXIS/ is frozen. Extensions go to EXTENSIONS/       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   Human Review Queue                             │    │
│  │                                                                  │    │
│  │  All changes requiring approval:                                │    │
│  │  - High-uncertainty characterizations (U > 0.6)                 │    │
│  │  - Framework extensions                                         │    │
│  │  - Axiom edge cases                                             │    │
│  │  - Novel entity types                                           │    │
│  │                                                                  │    │
│  │  Interface: CLI / Web UI / API                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      FEEDBACK TO INGEST       │
                    │                               │
                    │  - Request specific papers    │
                    │  - Fill identified gaps       │
                    │  - Verify hypotheses          │
                    └───────────────────────────────┘
```

---

## Component Details

### 1. Ingest Layer (`src/ingest/`)

**Purpose**: Bring external knowledge into Atlas.

**Connectors**:
| Source | Type | Data |
|--------|------|------|
| arXiv | Papers | Physics, CS, Biology, Math |
| PubMed | Papers | Biomedical |
| Wikipedia | Encyclopedia | General knowledge |
| Wikidata | Knowledge graph | Structured entities |
| Semantic Scholar | Papers | Cross-domain |
| OpenAlex | Papers | Open access |

**Processing Pipeline**:
```typescript
interface IngestPipeline {
  fetch(query: string): Promise<RawDocument[]>;
  parse(doc: RawDocument): ParsedDocument;
  chunk(doc: ParsedDocument): TextChunk[];
  embed(chunk: TextChunk): Vector;
  store(chunk: TextChunk, vector: Vector): void;
}
```

### 2. Extraction Layer (`src/extraction/`)

**Purpose**: Extract entities and relations from text.

**Entity Extraction**:
```typescript
interface EntityExtractor {
  extract(text: string): Promise<ExtractedEntity[]>;
}

interface ExtractedEntity {
  name: string;
  mentions: TextSpan[];
  context: string;
  confidence: number;
}
```

**Relation Extraction**:
```typescript
interface RelationExtractor {
  extract(text: string, entities: ExtractedEntity[]): Promise<ExtractedRelation[]>;
}

interface ExtractedRelation {
  source: string;
  target: string;
  type: RelationType;
  evidence: string;
  confidence: number;
}
```

### 3. Characterization Layer (`src/characterization/`)

**Purpose**: Apply ECF framework to extracted entities.

**ECF Characterizer**:
```typescript
interface ECFCharacterizer {
  characterize(
    entity: ExtractedEntity,
    relations: ExtractedRelation[],
    context: TextChunk[]
  ): Promise<EntityCharacterization>;
}

interface EntityCharacterization {
  entity: Entity;
  evidence: Evidence[];
  uncertainty: UncertaintyBreakdown;
  validation: ValidationResult;
}
```

**Axiom Validator**:
```typescript
interface AxiomValidator {
  validate(entity: Entity): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  violations: AxiomViolation[];
  warnings: string[];
}
```

### 4. Knowledge Graph (`src/knowledge/`)

**Purpose**: Store and query characterized entities.

**Schema**:
```typescript
// Nodes
interface EntityNode {
  id: string;
  config: EntityConfiguration;
  sources: Source[];
  created: Date;
  updated: Date;
  version: number;
}

// Edges
interface RelationEdge {
  source: string;
  target: string;
  type: RelationType;
  weight: number;
  evidence: string[];
}

// Indexes
interface KnowledgeGraph {
  // CRUD
  addEntity(entity: Entity): Promise<string>;
  getEntity(id: string): Promise<Entity | null>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<void>;

  // Queries
  findByDomain(domain: Domain): Promise<Entity[]>;
  findByStratum(stratum: Stratum): Promise<Entity[]>;
  findByClosureRange(min: number, max: number): Promise<Entity[]>;
  findRelated(id: string, depth: number): Promise<Entity[]>;

  // Graph operations
  shortestPath(from: string, to: string): Promise<Entity[]>;
  findClusters(): Promise<EntityCluster[]>;
  findBridges(): Promise<Entity[]>;
}
```

### 5. Production Layer (`src/production/`)

**Purpose**: Generate new knowledge from existing graph.

**Pattern Detector**:
```typescript
interface PatternDetector {
  detectClusters(): Promise<Cluster[]>;
  detectAnomalies(): Promise<Anomaly[]>;
  detectMissingLinks(): Promise<PredictedRelation[]>;
  detectTrends(): Promise<Trend[]>;
}
```

**Hypothesis Generator**:
```typescript
interface HypothesisGenerator {
  generateCharacterizations(gaps: Gap[]): Promise<Hypothesis[]>;
  generateRelations(entities: Entity[]): Promise<Hypothesis[]>;
  generateExtensions(patterns: Pattern[]): Promise<ExtensionProposal[]>;
}

interface Hypothesis {
  type: 'characterization' | 'relation' | 'extension';
  content: any;
  confidence: number;
  evidence: string[];
  testable: boolean;
}
```

### 6. Extension Layer (`src/extension/`)

**Purpose**: Extend the framework itself.

**Extension Types**:
```typescript
type ExtensionType =
  | 'new_capability'
  | 'new_domain'
  | 'new_mode'
  | 'new_relation_type'
  | 'threshold_adjustment'
  | 'axiom_refinement';

interface ExtensionProposal {
  type: ExtensionType;
  description: string;
  rationale: string;
  evidence: Evidence[];
  axiomCheck: AxiomCompatibility;
  testCases: TestCase[];
  status: 'proposed' | 'approved' | 'rejected' | 'integrated';
}
```

**Constraints**:
- AXIS/ is **frozen** - never modified automatically
- Extensions stored in EXTENSIONS/
- All extensions require human approval
- Extensions must not violate axioms

---

## Data Flow Example

**Scenario**: Atlas ingests a paper about mitochondrial function.

```
1. INGEST
   Paper: "Mitochondrial ATP Synthesis in Eukaryotic Cells"
   Source: PubMed

2. EXTRACT
   Entities: [mitochondria, ATP, eukaryotic_cell, cristae,
              ATP_synthase, proton_gradient, electron_transport_chain]

   Relations:
   - mitochondria --contains--> cristae
   - mitochondria --produces--> ATP
   - ATP_synthase --catalyzes--> ATP_synthesis
   - mitochondria --part_of--> eukaryotic_cell

3. CHARACTERIZE

   mitochondria:
     C = 0.55 (semi-autonomous, has own DNA, depends on cell)
     S = 0.02 (organelle scale)
     Σ = {MATTER, LIFE}
     K = {PERSIST, SELF_PRODUCE}
     Domain = LIVING
     U = 0.25 (well-understood entity)

   ATP:
     C = 0.08 (molecule, no self-production)
     S = 0.15 (ubiquitous in biology)
     Σ = {MATTER}
     K = {PERSIST}
     Domain = INERT  # Despite biological role
     U = 0.15

4. VALIDATE
   ✓ Stratal nesting correct
   ✓ Capabilities match strata
   ✓ Relations consistent

5. STORE
   Add to knowledge graph
   Link to existing entities (cell, organism, metabolism)

6. PRODUCE
   Pattern detected: All energy-producing organelles have C ∈ [0.5, 0.7]
   Gap identified: chloroplast not yet characterized (mentioned in relation)
   Hypothesis: chloroplast likely has similar C to mitochondria

7. EXTEND
   No framework extension needed
   Queue chloroplast for characterization
   Request papers on chloroplast
```

---

## API Design

### REST API

```
POST   /ingest              # Ingest new document
GET    /entities            # List entities
GET    /entities/:id        # Get entity
POST   /entities            # Create entity (manual)
PATCH  /entities/:id        # Update entity
DELETE /entities/:id        # Delete entity

GET    /graph/query         # Graph query
GET    /graph/path          # Find path between entities
GET    /graph/clusters      # Get clusters

GET    /production/gaps     # Get knowledge gaps
GET    /production/hypotheses  # Get generated hypotheses
POST   /production/verify   # Verify hypothesis

GET    /extensions          # List proposed extensions
POST   /extensions          # Propose extension
PATCH  /extensions/:id      # Approve/reject extension

GET    /review/queue        # Items needing human review
POST   /review/:id/approve  # Approve item
POST   /review/:id/reject   # Reject item
```

### CLI

```bash
# Ingest
atlas ingest arxiv "quantum biology"
atlas ingest pubmed "mitochondria ATP"
atlas ingest url https://example.com/paper.pdf

# Query
atlas get entity mitochondria
atlas find --domain LIVING --stratum LIFE
atlas path mitochondria cell
atlas clusters

# Production
atlas gaps
atlas hypotheses --confidence 0.8
atlas verify hypothesis-123

# Review
atlas review list
atlas review approve item-456
atlas review reject item-789 --reason "Insufficient evidence"

# Stats
atlas stats
atlas stats --domain LIVING
atlas stats --source arxiv
```

---

## Storage Options

### Development (SQLite + JSON)
- Simple, no dependencies
- Good for < 100k entities
- Single file

### Production (Neo4j)
- Native graph database
- Cypher queries
- Good for > 100k entities
- Distributed

### Hybrid (PostgreSQL + pg_graphql)
- SQL for structured data
- Graph extension for relations
- Good middle ground

---

## LLM Integration

### Models Used

| Task | Model | Reason |
|------|-------|--------|
| Entity extraction | GPT-4o-mini | Fast, cheap, good enough |
| Relation extraction | GPT-4o-mini | Fast, cheap |
| ECF characterization | Claude Sonnet | Nuanced understanding needed |
| Hypothesis generation | Claude Opus | Deep reasoning |
| Axiom checking | Deterministic | No LLM needed |

### Prompt Templates

Stored in `src/prompts/`:
- `entity_extraction.txt`
- `relation_extraction.txt`
- `ecf_characterization.txt`
- `hypothesis_generation.txt`

---

## Metrics & Monitoring

### Key Metrics

| Metric | Description |
|--------|-------------|
| Entities/day | Ingestion rate |
| Validation rate | % passing axiom check |
| Uncertainty distribution | Histogram of U values |
| Coverage by domain | % of domain characterized |
| Hypothesis accuracy | % verified hypotheses |
| Extension rate | Framework extensions/month |

### Health Checks

- Axiom invariants never violated
- No orphan entities (all connected to graph)
- No duplicate entities
- Source provenance complete
- Human review queue not overflowing

---

## Security & Ethics

### Data Handling
- Only ingest public/licensed data
- Track provenance for all entities
- GDPR compliance for EU sources

### Bias Mitigation
- Monitor domain coverage balance
- Detect cultural/language bias in sources
- Flag when characterization differs by source origin

### Human Oversight
- High-stakes entities require human approval
- Framework extensions always human-approved
- Audit log for all changes

---

## Deployment

### Local Development
```bash
docker-compose up -d  # SQLite + API
npm run dev
```

### Production
```bash
# Kubernetes deployment
kubectl apply -f k8s/
```

### Serverless
- Ingest: AWS Lambda / Cloud Functions
- Graph: Neo4j Aura / Amazon Neptune
- API: Vercel / Cloudflare Workers

---

## Roadmap

### Phase 1: Foundation (Current)
- [x] Core types
- [x] Entity catalog
- [x] Protocols
- [ ] Basic knowledge graph
- [ ] CLI

### Phase 2: Ingestion
- [ ] arXiv connector
- [ ] Wikipedia connector
- [ ] Entity extraction
- [ ] Relation extraction

### Phase 3: Production
- [ ] Pattern detection
- [ ] Hypothesis generation
- [ ] Gap identification

### Phase 4: Self-Extension
- [ ] Extension proposals
- [ ] Human review interface
- [ ] Framework versioning

### Phase 5: Scale
- [ ] Distributed processing
- [ ] Multi-language support
- [ ] Real-time ingestion
