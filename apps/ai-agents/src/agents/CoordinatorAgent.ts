import { AgentBase } from "../core/AgentBase";
import { AgentBus } from "../core/AgentBus";
import type { AgentHealth, AgentMessage } from "../core/types";
import type { AgentSlot } from "../core/npc-mapping";
import { keccak256, toHex } from "viem";
import { getWalletClient, ADDRESSES } from "../core/chainClient";
import { agentRegistryABI } from "@towers/backend/abis/AgentRegistry";
import { coordinatorAgentABI } from "@towers/backend/abis/CoordinatorAgent";

export class CoordinatorAgent extends AgentBase {
  private agentSlots: AgentSlot[] = [];
  private heartbeats = new Map<string, AgentHealth>();
  private lastOnChainSync = 0;

  constructor(bus: AgentBus) {
    super({
      agentId: "coordinator_01",
      agentType: "coordinator",
      managedNpcIds: [],
      floorScope: [-1],
      personalityPrompt: "Route messages between agents, monitor health, dispatch events.",
      tickIntervalMs: 5000,
    }, bus);
  }

  registerAgents(slots: AgentSlot[]): void {
    this.agentSlots = slots;
  }

  recordHeartbeat(health: AgentHealth): void {
    this.heartbeats.set(health.agentId, health);
  }

  getAgentHealth(): AgentHealth[] {
    return Array.from(this.heartbeats.values());
  }

  protected setupSubscriptions(): void {
    this.subscribe("player_interaction");
    this.subscribe("player_attack");
    this.subscribe("floor_transition");
    this.subscribe("agent_heartbeat");
    this.subscribe("state_sync");
    this.subscribe("admin_command");
    this.subscribe("quest_evaluation");
  }

  async handleMessage(msg: AgentMessage): Promise<void> {
    switch (msg.type) {
      case "agent_heartbeat":
        this.recordHeartbeat(msg.payload as unknown as AgentHealth);
        break;

      case "player_interaction": {
        const npcId = msg.payload.npcId as string;
        const target = this.resolveAgentForNpc(npcId);
        if (target) await this.send(target, "player_interaction", msg.payload);
        break;
      }
      case "player_attack": {
        const enemyType = msg.payload.enemyType as string;
        const target = this.resolveAgentForNpc(enemyType);
        if (target) await this.send(target, "player_attack", msg.payload);
        break;
      }
      case "floor_transition": {
        const floor = msg.payload.floor as number;
        await this.send("admin_01", "floor_transition", msg.payload);
        await this.send("hero_01", "floor_transition", msg.payload);
        for (const slot of this.agentSlots) {
          if (slot.agentType === "enemy" || slot.agentType === "trap") {
            await this.send(slot.agentId, "floor_transition", { ...msg.payload, floor });
          }
        }
        break;
      }
      case "quest_evaluation":
        await this.send("hero_01", "quest_evaluation", msg.payload);
        break;
      case "admin_command":
        for (const slot of this.agentSlots) {
          await this.send(slot.agentId, "admin_command", msg.payload);
        }
        break;
      case "state_sync":
        await this.send("admin_01", "state_sync", msg.payload);
        break;
    }
  }

  async onTick(): Promise<void> {
    const now = Date.now();
    for (const [id, health] of this.heartbeats) {
      if (now - health.lastHeartbeat > 60000) {
        console.warn(`[Coordinator] Agent ${id} stale`);
        await this.send("admin_01", "admin_command", { command: "agent_down", agentId: id });
      }
    }

    if (now - this.lastOnChainSync > 30000 && ADDRESSES.coordinator) {
      this.lastOnChainSync = now;
      const wc = getWalletClient();
      if (wc?.account) {
        try {
          const hash = keccak256(toHex("coordinator_01"));
          await wc.writeContract({
            address: ADDRESSES.coordinator,
            abi: coordinatorAgentABI,
            functionName: "recordHeartbeat",
            args: [hash],
            account: wc.account,
          });
        } catch { /* best effort */ }
      }
    }
  }

  private resolveAgentForNpc(npcId: string): string | null {
    for (const slot of this.agentSlots) {
      if (slot.npcIds.includes(npcId)) return slot.agentId;
    }
    return null;
  }
}
