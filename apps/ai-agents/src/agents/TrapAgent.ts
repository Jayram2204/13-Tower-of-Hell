import { AgentBase } from "../core/AgentBase";
import { AgentBus } from "../core/AgentBus";
import type { AgentMessage } from "../core/types";
import { publicClient, getWalletClient, ADDRESSES } from "../core/chainClient";
import { trapAgentABI } from "@towers/backend/abis/TrapAgent";

export class TrapAgent extends AgentBase {
  constructor(bus: AgentBus, agentId: string, tickIntervalMs: number, prompt: string) {
    super({ agentId, agentType: "trap", managedNpcIds: [], floorScope: Array.from({ length: 13 }, (_, i) => i + 1), personalityPrompt: prompt, tickIntervalMs }, bus);
  }

  protected setupSubscriptions(): void {
    this.subscribe("trap_trigger");
    this.subscribe("floor_transition");
    this.subscribe("admin_command");
  }

  async handleMessage(msg: AgentMessage): Promise<void> {
    const wc = getWalletClient();
    switch (msg.type) {
      case "trap_trigger": {
        const trapId = msg.payload.trapId as string;
        if (!trapId || !wc?.account || !ADDRESSES.trap) return;

        try {
          const hash = await wc.writeContract({
            address: ADDRESSES.trap,
            abi: trapAgentABI,
            functionName: "triggerTrap",
            args: [trapId],
            account: wc.account,
          });
          const damage = await publicClient.readContract({
            address: ADDRESSES.trap,
            abi: trapAgentABI,
            functionName: "getTrap",
            args: [trapId],
          }) as [string, string, bigint, boolean, bigint, bigint, bigint, bigint, number, bigint, bigint];
          await this.reply(msg, { trapId, damage: Number(damage[7]), triggered: true });
        } catch (err) {
          console.error(`[TrapAgent] Trigger failed for ${trapId}:`, err);
          await this.reply(msg, { trapId, damage: 0, triggered: false });
        }
        break;
      }
      case "floor_transition": {
        const floor = msg.payload.floor as number;
        if (wc?.account && ADDRESSES.trap) {
          try {
            await wc.writeContract({
              address: ADDRESSES.trap,
              abi: trapAgentABI,
              functionName: "activateFloorTraps",
              args: [BigInt(floor)],
              account: wc.account,
            });
          } catch { /* best effort */ }
        }
        break;
      }
    }
  }

  async onTick(): Promise<void> {
    if (!ADDRESSES.trap) return;
    const wc = getWalletClient();
    if (!wc?.account) return;
    try {
      await wc.writeContract({
        address: ADDRESSES.trap,
        abi: trapAgentABI,
        functionName: "tickCooldowns",
        args: [BigInt(this.config.tickIntervalMs)],
        account: wc.account,
      });
    } catch { /* best effort */ }
  }

  async isTrapActive(trapId: string): Promise<boolean> {
    if (!ADDRESSES.trap) return false;
    try {
      return await publicClient.readContract({
        address: ADDRESSES.trap,
        abi: trapAgentABI,
        functionName: "isTrapActive",
        args: [trapId],
      }) as boolean;
    } catch { return false; }
  }
}
