interface AgentInteractionResult {
  dialogue: string[];
  actions: Array<{ tool: string; args: Record<string, unknown> }>;
  source: string;
}

interface FloorData {
  floor: number;
  name: string;
  isUnlocked: boolean;
  difficultyTier: number;
  minRenown: number;
  state: number;
}

interface DifficultyConfig {
  floor: number;
  enemyCount: number;
  hpMultiplier: number;
  damageMultiplier: number;
  groupAggro: boolean;
}

interface HeroState {
  playerName: string;
  currentFloor: number;
  renown: number;
  clearedFloors: number;
  deaths: number;
  enemiesKilled: number;
}

interface NPCState {
  id: string;
  name: string;
  type: string;
  credits: number;
  priceModifier: number;
  reputation: number;
}

export class NetworkManager {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async registerPlayer(name: string, playerId: string, signature: string): Promise<{ success: boolean; playerId?: string; name?: string; error?: string }> {
    const res = await fetch(`${this.baseUrl}/api/player/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, playerId, signature }),
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || "Registration failed" };
    }
    return res.json();
  }

  async getPlayerState(playerId: string): Promise<HeroState | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/player/${playerId}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async dispatchAgentInteraction(
    playerId: string,
    npcId: string,
    playerInput: string,
  ): Promise<AgentInteractionResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/npc/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npcId, playerId, playerInput }),
      });
      if (!res.ok) {
        return { dialogue: [], actions: [], source: "error" };
      }
      const data = await res.json();
      return {
        dialogue: ["The entity regards you with ancient patience."],
        actions: [],
        source: data.success ? "onchain" : "error",
      };
    } catch {
      return { dialogue: [], actions: [], source: "error" };
    }
  }

  async verifyFloorClear(playerId: string, floorId: string, signature: string): Promise<{ success: boolean; error?: string; renown?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/dungeon/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, floorId, signature }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error };
      }
      return res.json();
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  async syncFloorClear(walletAddress: string, floorId: string, signature: string): Promise<{ success: boolean; synced?: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/dungeon/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, floorId, signature }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error };
      }
      return res.json();
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  async getAllFloors(): Promise<FloorData[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/dungeon/floors`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async getFloor(num: number): Promise<FloorData | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/dungeon/floor/${num}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getDifficulty(floor: number): Promise<DifficultyConfig | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/dungeon/difficulty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getNPC(npcId: string): Promise<NPCState | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/npc/${npcId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: data.npcId || data.id,
        name: data.name,
        type: data.type || "generic",
        credits: Number(data.credits || 0),
        priceModifier: Number(data.priceModifier || 100) / 100,
        reputation: Number(data.reputation || 0),
      };
    } catch {
      return null;
    }
  }
}
