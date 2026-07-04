export interface MemoryRecord {
  playerId: string;
  npcId: string;
  role: "player" | "npc";
  content: string;
  timestamp: number;
  embedding?: number[];
}

export interface SearchResult {
  record: MemoryRecord;
  similarity: number;
}

export class MemoryStore {
  private records: MemoryRecord[] = [];
  private readonly MAX_RECORDS = 1000;

  async insert(record: MemoryRecord): Promise<void> {
    if (this.records.length >= this.MAX_RECORDS) {
      this.records.shift();
    }
    this.records.push({ ...record, embedding: undefined });
  }

  async search(
    query: string,
    options: { limit?: number; playerId?: string; npcId?: string } = {},
  ): Promise<SearchResult[]> {
    let results = this.records;

    if (options.playerId) {
      results = results.filter((r) => r.playerId === options.playerId);
    }
    if (options.npcId) {
      results = results.filter((r) => r.npcId === options.npcId);
    }

    const queryTerms = query.toLowerCase().split(/\s+/);

    const scored = results.map((record) => {
      const text = `${record.content} ${record.role}`.toLowerCase();
      const matches = queryTerms.filter((t) => text.includes(t)).length;
      const similarity = queryTerms.length > 0 ? matches / queryTerms.length : 0;
      return { record, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, options.limit || 5);
  }

  async recall(playerId: string, npcId: string): Promise<MemoryRecord[]> {
    return this.records
      .filter((r) => r.playerId === playerId && r.npcId === npcId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  }

  async clear(playerId?: string, npcId?: string): Promise<void> {
    if (!playerId && !npcId) {
      this.records = [];
      return;
    }
    this.records = this.records.filter(
      (r) => !(playerId && r.playerId === playerId) && !(npcId && r.npcId === npcId),
    );
  }

  size(): number {
    return this.records.length;
  }
}

export class ChromaAdapter {
  private store: MemoryStore;
  private collectionName: string;

  constructor(collectionName: string = "agent_memory", store?: MemoryStore) {
    this.store = store || new MemoryStore();
    this.collectionName = collectionName;
  }

  async connect(): Promise<void> {
    if (process.env.CHROMA_URL) {
      console.log(`[ChromaAdapter] Would connect to ${process.env.CHROMA_URL}/${this.collectionName}`);
    }
  }

  async insert(record: MemoryRecord): Promise<void> {
    await this.store.insert(record);
  }

  async query(
    queryText: string,
    nResults: number = 5,
    filter?: { playerId?: string; npcId?: string },
  ): Promise<SearchResult[]> {
    return this.store.search(queryText, { limit: nResults, ...filter });
  }

  async recallHistory(playerId: string, npcId: string): Promise<MemoryRecord[]> {
    return this.store.recall(playerId, npcId);
  }
}
