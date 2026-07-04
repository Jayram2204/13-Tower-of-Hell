import { AgentBase } from "../core/AgentBase";
import { AgentBus } from "../core/AgentBus";
import type { AgentMessage } from "../core/types";
import { LLMAgent } from "./LLMAgent";
import { publicClient, getWalletClient, ADDRESSES } from "../core/chainClient";
import { npcRegistryABI } from "@towers/backend/abis/NPCRegistry";
import { workerAgentABI } from "@towers/backend/abis/WorkerAgent";

interface NpcEconomicState {
  npcId: string;
  credits: bigint;
  priceModifier: bigint;
  supply: number;
  demand: number;
}

export class WorkerAgent extends AgentBase {
  private npcIds: string[];
  private llmAgents = new Map<string, LLMAgent>();

  constructor(bus: AgentBus, agentId: string, npcIds: string[], tickIntervalMs: number, prompt: string) {
    super({ agentId, agentType: "worker", managedNpcIds: npcIds, floorScope: [0], personalityPrompt: prompt, tickIntervalMs }, bus);
    this.npcIds = npcIds;
    for (const id of npcIds) {
      this.llmAgents.set(id, new LLMAgent({
        npcId: id,
        npcName: id,
        backendUrl: process.env.BACKEND_URL || "http://localhost:3000",
        llmApiKey: process.env.OPENAI_API_KEY || "",
      }));
    }
  }

  private async getNpcCredits(npcId: string): Promise<bigint> {
    if (!ADDRESSES.npcRegistry) return 0n;
    try {
      const npc = await publicClient.readContract({
        address: ADDRESSES.npcRegistry,
        abi: npcRegistryABI,
        functionName: "getNPC",
        args: [npcId],
      }) as [string, string, number, bigint, bigint, bigint, boolean, bigint, bigint, bigint];
      return npc[3];
    } catch { return 0n; }
  }

  protected setupSubscriptions(): void {
    this.subscribe("player_interaction");
    this.subscribe("economy_tick");
    this.subscribe("admin_command");
  }

  async handleMessage(msg: AgentMessage): Promise<void> {
    switch (msg.type) {
      case "player_interaction": {
        const npcId = msg.payload.npcId as string;
        const playerId = msg.payload.playerId as string;
        const playerInput = (msg.payload.message as string) || "Hello";

        const llmAgent = this.llmAgents.get(npcId);
        if (llmAgent) {
          const { dialogue, actions } = await llmAgent.processInteraction(playerId, playerInput, {
            playerId,
            playerRenown: (msg.payload.playerRenown as number) || 0,
            playerFloor: (msg.payload.currentFloor as number) || 0,
            inventory: (msg.payload.inventory as { itemId: string; quantity: number }[]) || [],
            floorState: (msg.payload.floorState as Record<string, boolean>) || {},
          });
          await this.reply(msg, { npcId, dialogue: [dialogue], actions, source: "onchain" });
        } else {
          await this.reply(msg, { npcId, dialogue: ["The entity regards you."], actions: [], source: "onchain" });
        }
        break;
      }
      case "economy_tick": {
        const npcId = msg.payload.npcId as string;
        if (!npcId) {
          for (const id of this.npcIds) {
            await this.runTick(id);
          }
        } else {
          await this.runTick(npcId);
        }
        break;
      }
    }
  }

  private async runTick(npcId: string): Promise<void> {
    if (!ADDRESSES.worker) return;
    const wc = getWalletClient();
    if (!wc?.account) return;

    const supply = BigInt(Math.floor(Math.random() * 20));
    const demand = BigInt(Math.floor(Math.random() * 20) + 5);

    try {
      const hash = await wc.writeContract({
        address: ADDRESSES.worker,
        abi: workerAgentABI,
        functionName: "runEconomyTick",
        args: [npcId, supply, demand],
        account: wc.account,
      });
      console.log(`[WorkerAgent] Economy tick for ${npcId}: tx=${hash}`);
    } catch (err) {
      console.error(`[WorkerAgent] Tick failed for ${npcId}:`, err);
    }
  }

  async onTick(): Promise<void> {
    for (const id of this.npcIds) {
      const credits = await this.getNpcCredits(id);
      this.state.metadata[id] = { credits: Number(credits) };
    }
  }

  getNpcState(npcId: string): Promise<bigint> {
    return this.getNpcCredits(npcId);
  }
}
