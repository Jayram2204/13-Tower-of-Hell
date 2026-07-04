import { AgentBase } from "../core/AgentBase";
import { AgentBus } from "../core/AgentBus";
import type { AgentMessage } from "../core/types";
import { publicClient, getWalletClient, ADDRESSES } from "../core/chainClient";
import { adminAgentABI } from "@towers/backend/abis/AdminAgent";

export class AdminAgent extends AgentBase {
  constructor(bus: AgentBus) {
    super({
      agentId: "admin_01",
      agentType: "admin",
      managedNpcIds: [],
      floorScope: Array.from({ length: 14 }, (_, i) => i),
      personalityPrompt: "Govern tower floors. Control difficulty curves, unlock conditions, and cross-floor state.",
      tickIntervalMs: 20000,
    }, bus);
  }

  protected setupSubscriptions(): void {
    this.subscribe("floor_transition");
    this.subscribe("state_sync");
    this.subscribe("admin_command");
  }

  async handleMessage(msg: AgentMessage): Promise<void> {
    switch (msg.type) {
      case "floor_transition": {
        const floor = msg.payload.floor as number;
        const playerId = msg.payload.playerId as string;
        if (playerId?.startsWith("0x") && ADDRESSES.admin) {
          const wc = getWalletClient();
          if (wc?.account) {
            try {
              await wc.writeContract({
                address: ADDRESSES.admin,
                abi: adminAgentABI,
                functionName: "transitionFloor",
                args: [BigInt(floor), playerId as `0x${string}`],
                account: wc.account,
              });
            } catch (err) {
              console.error("[AdminAgent] transitionFloor failed:", err);
            }
          }
        }
        break;
      }
      case "state_sync": {
        if (ADDRESSES.admin) {
          try {
            const floors = await publicClient.readContract({
              address: ADDRESSES.admin,
              abi: adminAgentABI,
              functionName: "getAllFloors",
              args: [],
            });
            const offset = await publicClient.readContract({
              address: ADDRESSES.admin,
              abi: adminAgentABI,
              functionName: "globalDifficultyOffset",
              args: [],
            });
            await this.reply(msg, { floors, globalDifficultyOffset: Number(offset) });
          } catch {
            await this.reply(msg, { floors: [], globalDifficultyOffset: 0 });
          }
        }
        break;
      }
    }
  }

  async onTick(): Promise<void> {
    if (ADDRESSES.admin) {
      try {
        const floor0 = await publicClient.readContract({
          address: ADDRESSES.admin,
          abi: adminAgentABI,
          functionName: "getFloor",
          args: [0n],
        }) as [bigint, string, boolean, bigint, bigint, bigint, bigint, number, bigint];
        this.state.metadata = { floor0State: floor0[7] };
      } catch { /* ignore */ }
    }
  }

  canAccessFloor(floor: number, playerRenown: number): Promise<{ allowed: boolean; reason?: string }> {
    return this.canAccessOnChain(floor, playerRenown);
  }

  private async canAccessOnChain(floor: number, renown: number): Promise<{ allowed: boolean; reason?: string }> {
    if (!ADDRESSES.admin) return { allowed: floor < 2 };
    try {
      const [allowed, reason] = await publicClient.readContract({
        address: ADDRESSES.admin,
        abi: adminAgentABI,
        functionName: "canAccessFloor",
        args: [BigInt(floor), BigInt(renown)],
      }) as [boolean, string];
      return { allowed, reason: reason || undefined };
    } catch {
      return { allowed: false, reason: "Read failed" };
    }
  }
}
