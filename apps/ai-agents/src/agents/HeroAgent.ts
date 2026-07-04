import { AgentBase } from "../core/AgentBase";
import { AgentBus } from "../core/AgentBus";
import type { AgentMessage } from "../core/types";
import { publicClient, getWalletClient, ADDRESSES } from "../core/chainClient";
import { heroAgentABI } from "@towers/backend/abis/HeroAgent";

export class HeroAgent extends AgentBase {
  constructor(bus: AgentBus) {
    super({
      agentId: "hero_01",
      agentType: "hero",
      managedNpcIds: [],
      floorScope: [-1],
      personalityPrompt: "Track player progression, evaluate quest conditions, and grant rewards on-chain.",
      tickIntervalMs: 30000,
    }, bus);
  }

  protected setupSubscriptions(): void {
    this.subscribe("quest_evaluation");
    this.subscribe("player_attack");
    this.subscribe("floor_transition");
  }

  async handleMessage(msg: AgentMessage): Promise<void> {
    const wc = getWalletClient();
    const playerId = msg.payload.playerId as string;

    switch (msg.type) {
      case "quest_evaluation": {
        const questId = msg.payload.questId as string;
        const completed = !!(msg.payload.conditions as Record<string, unknown>);
        const renownReward = (msg.payload.rewards as Record<string, unknown>)?.renown as number || 0;
        if (playerId?.startsWith("0x") && ADDRESSES.hero && wc?.account) {
          try {
            await wc.writeContract({
              address: ADDRESSES.hero,
              abi: heroAgentABI,
              functionName: "evaluateQuest",
              args: [playerId as `0x${string}`, questId, completed, BigInt(renownReward)],
              account: wc.account,
            });
          } catch (err) {
            console.error("[HeroAgent] evaluateQuest failed:", err);
          }
        }
        await this.reply(msg, { playerId, questId, completed });
        break;
      }
      case "player_attack": {
        if (playerId?.startsWith("0x") && msg.payload.killed && ADDRESSES.hero && wc?.account) {
          try {
            await wc.writeContract({
              address: ADDRESSES.hero,
              abi: heroAgentABI,
              functionName: "recordEnemyKill",
              args: [playerId as `0x${string}`],
              account: wc.account,
            });
          } catch { /* best effort */ }
        }
        break;
      }
      case "floor_transition": {
        const floor = msg.payload.floor as number;
        if (playerId?.startsWith("0x") && ADDRESSES.hero && wc?.account) {
          try {
            await wc.writeContract({
              address: ADDRESSES.hero,
              abi: heroAgentABI,
              functionName: "recordFloorClear",
              args: [playerId as `0x${string}`, BigInt(floor)],
              account: wc.account,
            });
          } catch { /* best effort */ }
        }
        break;
      }
    }
  }

  async onTick(): Promise<void> {
    if (ADDRESSES.hero) {
      try {
        const count = await publicClient.readContract({
          address: ADDRESSES.hero,
          abi: heroAgentABI,
          functionName: "getRegisteredHeroCount",
          args: [],
        });
        this.state.metadata = { registeredHeroes: Number(count) };
      } catch { /* ignore */ }
    }
  }

  async getHeroState(player: string) {
    if (!player.startsWith("0x") || !ADDRESSES.hero) return null;
    try {
      return await publicClient.readContract({
        address: ADDRESSES.hero,
        abi: heroAgentABI,
        functionName: "getHero",
        args: [player as `0x${string}`],
      });
    } catch { return null; }
  }
}
