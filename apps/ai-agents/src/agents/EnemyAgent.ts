import { AgentBase } from "../core/AgentBase";
import { AgentBus } from "../core/AgentBus";
import type { AgentMessage } from "../core/types";
import { publicClient, getWalletClient, ADDRESSES } from "../core/chainClient";
import { enemyAgentABI } from "@towers/backend/abis/EnemyAgent";

export class EnemyAgent extends AgentBase {
  private currentFloor = 1;
  private playerHighestFloor = 1;

  constructor(bus: AgentBus, agentId: string, tickIntervalMs: number, prompt: string) {
    super({ agentId, agentType: "enemy", managedNpcIds: [], floorScope: Array.from({ length: 13 }, (_, i) => i + 1), personalityPrompt: prompt, tickIntervalMs }, bus);
  }

  private async getOnChainFloor(): Promise<number> {
    if (!ADDRESSES.enemy) return this.currentFloor;
    try {
      const data = await publicClient.readContract({
        address: ADDRESSES.enemy,
        abi: enemyAgentABI,
        functionName: "getDifficultyForFloor",
        args: [BigInt(this.currentFloor)],
      });
      return Number((data as [bigint, bigint, bigint, bigint, bigint, bigint, bigint])[0]);
    } catch { return this.currentFloor; }
  }

  protected setupSubscriptions(): void {
    this.subscribe("floor_transition");
    this.subscribe("player_attack");
    this.subscribe("difficulty_request");
    this.subscribe("admin_command");
  }

  async handleMessage(msg: AgentMessage): Promise<void> {
    switch (msg.type) {
      case "floor_transition": {
        this.currentFloor = msg.payload.floor as number;
        if ((msg.payload.floor as number) > this.playerHighestFloor) {
          this.playerHighestFloor = msg.payload.floor as number;
        }
        const wc = getWalletClient();
        if (wc?.account && ADDRESSES.enemy) {
          try {
            await wc.writeContract({
              address: ADDRESSES.enemy,
              abi: enemyAgentABI,
              functionName: "updatePlayerFloor",
              args: [BigInt(this.currentFloor)],
              account: wc.account,
            });
          } catch (err) {
            console.error("[EnemyAgent] Failed to sync floor on-chain:", err);
          }
        }
        break;
      }
      case "player_attack": {
        if (msg.payload.aggroOthers as boolean) {
          const wc = getWalletClient();
          if (wc?.account && ADDRESSES.enemy) {
            try {
              await wc.writeContract({
                address: ADDRESSES.enemy,
                abi: enemyAgentABI,
                functionName: "triggerGroupAggro",
                args: [],
                account: wc.account,
              });
            } catch { /* best effort */ }
          }
        }
        break;
      }
      case "difficulty_request": {
        const floor = (msg.payload.floor as number) || this.currentFloor;
        if (ADDRESSES.enemy) {
          try {
            const data = await publicClient.readContract({
              address: ADDRESSES.enemy,
              abi: enemyAgentABI,
              functionName: "getSpawnRecommendation",
              args: [BigInt(floor)],
            }) as [bigint, bigint, bigint];
            await this.reply(msg, { floor, enemyCount: Number(data[0]), hpMult: Number(data[1]), dmgMult: Number(data[2]) });
            return;
          } catch { /* fall through */ }
        }
        await this.reply(msg, { floor, enemyCount: 3, hpMult: 100, dmgMult: 100 });
        break;
      }
    }
  }

  async onTick(): Promise<void> {
    this.state.metadata = { currentFloor: this.currentFloor, highestFloor: this.playerHighestFloor };
  }

  getSpawnRecommendation(floor: number): Promise<{ types: string[]; count: number; hpMult: number; dmgMult: number }> {
    const types = ["skeleton", "bat", "wraith", "golem"];
    return Promise.resolve({ types, count: Math.min(floor + 2, 10), hpMult: 1 + (floor - 1) * 0.2, dmgMult: 1 + (floor - 1) * 0.15 });
  }
}
