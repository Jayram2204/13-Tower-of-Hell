export type ToolName =
  | "grant_item"
  | "modify_reputation"
  | "unlock_portal"
  | "generate_quest"
  | "get_player"
  | "npc_interact";

export interface ToolCall {
  tool: ToolName;
  args: Record<string, string | number | boolean>;
}

export interface ToolResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const AGENT_API_KEY = process.env.AGENT_API_KEY || "agent_secret_key";

export class ToolRegistry {
  private backendUrl: string;
  private apiKey: string;

  constructor(backendUrl?: string, apiKey?: string) {
    this.backendUrl = backendUrl || BACKEND_URL;
    this.apiKey = apiKey || AGENT_API_KEY;
  }

  async execute(tool: ToolCall, playerId: string): Promise<ToolResult> {
    switch (tool.tool) {
      case "get_player":
        return this.getPlayer(playerId);
      case "grant_item":
        return this.grantItem(playerId, tool.args as { itemId: string; quantity: number });
      case "modify_reputation":
        return this.modifyReputation(playerId, tool.args as { npcId: string; delta: number });
      case "unlock_portal":
        return this.unlockPortal(playerId, tool.args as { floorId: string });
      case "generate_quest":
        return this.generateQuest(playerId, tool.args as { questTemplate: string });
      case "npc_interact":
        return this.npcInteract(playerId, tool.args as { npcId: string; message?: string });
      default:
        return { success: false, error: `Unknown tool: ${tool.tool}` };
    }
  }

  private async request(path: string, body: Record<string, unknown>): Promise<Response> {
    return fetch(`${this.backendUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });
  }

  private async getPlayer(playerId: string): Promise<ToolResult> {
    try {
      const res = await fetch(`${this.backendUrl}/api/player/${playerId}`, {
        headers: { "X-Agent-Key": this.apiKey },
      });
      if (!res.ok) return { success: false, error: `Player not found: ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async grantItem(
    playerId: string,
    { itemId, quantity }: { itemId: string; quantity: number },
  ): Promise<ToolResult> {
    try {
      const res = await this.request("/api/player/inventory", {
        playerId,
        itemId,
        quantity,
        action: "add",
      });
      if (!res.ok) return { success: false, error: `Grant item failed: ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async modifyReputation(
    playerId: string,
    { npcId, delta }: { npcId: string; delta: number },
  ): Promise<ToolResult> {
    try {
      const res = await this.request("/api/npc/reputation", {
        playerId,
        npcId,
        delta,
      });
      if (!res.ok) return { success: false, error: `Reputation modify failed: ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async unlockPortal(
    playerId: string,
    { floorId }: { floorId: string },
  ): Promise<ToolResult> {
    try {
      const res = await this.request("/api/dungeon/unlock", {
        playerId,
        floorId,
      });
      if (!res.ok) return { success: false, error: `Unlock portal failed: ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async generateQuest(
    playerId: string,
    { questTemplate }: { questTemplate: string },
  ): Promise<ToolResult> {
    try {
      const res = await this.request("/api/quests/evaluate", {
        playerId,
        template: questTemplate,
      });
      if (!res.ok) return { success: false, error: `Quest generate failed: ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async npcInteract(
    playerId: string,
    { npcId, message }: { npcId: string; message?: string },
  ): Promise<ToolResult> {
    try {
      const res = await this.request("/api/npc/interact", {
        playerId,
        npcId,
        message: message || "Hello",
      });
      if (!res.ok) return { success: false, error: `NPC interact failed: ${res.status}` };
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
}
