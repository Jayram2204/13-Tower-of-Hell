import { AgentBus } from "../core/AgentBus";
import type { AgentMessageType, AgentHealth } from "../core/types";
import { AGENT_SLOTS, ADMIN_AGENT_SLOT, COORDINATOR_AGENT_SLOT } from "../core/npc-mapping";
import { CoordinatorAgent } from "./CoordinatorAgent";
import { WorkerAgent } from "./WorkerAgent";
import { HeroAgent } from "./HeroAgent";
import { EnemyAgent } from "./EnemyAgent";
import { TrapAgent } from "./TrapAgent";
import { AdminAgent } from "./AdminAgent";
import type { AgentBase } from "../core/AgentBase";

let agentBus: AgentBus | null = null;
let coordinator: CoordinatorAgent | null = null;
let admin: AdminAgent | null = null;
let allAgents: AgentBase[] = [];
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startAgents(): void {
  if (agentBus) return;

  agentBus = new AgentBus();

  admin = new AdminAgent(agentBus);

  const workers = AGENT_SLOTS.filter((s) => s.agentType === "worker").map(
    (slot) => new WorkerAgent(agentBus!, slot.agentId, slot.npcIds, slot.tickIntervalMs, slot.personalityPrompt),
  );

  const enemySlots = AGENT_SLOTS.filter((s) => s.agentType === "enemy");
  const enemies = enemySlots.map(
    (slot) => new EnemyAgent(agentBus!, slot.agentId, slot.tickIntervalMs, slot.personalityPrompt),
  );

  const trapSlots = AGENT_SLOTS.filter((s) => s.agentType === "trap");
  const traps = trapSlots.map(
    (slot) => new TrapAgent(agentBus!, slot.agentId, slot.tickIntervalMs, slot.personalityPrompt),
  );

  coordinator = new CoordinatorAgent(agentBus);
  coordinator.registerAgents(AGENT_SLOTS);

  const hero = new HeroAgent(agentBus);

  allAgents = [coordinator, admin, ...workers, ...enemies, ...traps, hero];

  for (const agent of allAgents) {
    agent.start();
  }

  heartbeatInterval = setInterval(() => {
    broadcastHeartbeat();
  }, 15000);

  console.log(`[AgentLifecycle] ${allAgents.length} agents started`);
}

function broadcastHeartbeat(): void {
  if (!agentBus || !coordinator) return;
  for (const agent of allAgents) {
    const health: AgentHealth = {
      agentId: agent.agentId,
      agentType: agent.config.agentType,
      status: agent.status,
      lastHeartbeat: Date.now(),
      uptimeMs: agent.uptimeMs,
    };
    agentBus.publish({
      from: agent.agentId,
      to: "coordinator_01",
      type: "agent_heartbeat",
      payload: health as unknown as Record<string, unknown>,
    }).catch(() => {});
  }
}

export function stopAgents(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  for (const agent of allAgents) {
    agent.stop();
  }
  allAgents = [];
  coordinator = null;
  admin = null;
  agentBus = null;
  console.log("[AgentLifecycle] All agents stopped");
}

export function getAgentBus(): AgentBus | null {
  return agentBus;
}

export function getCoordinator(): CoordinatorAgent | null {
  return coordinator;
}

export function getAdmin(): AdminAgent | null {
  return admin;
}

export function publishEvent(
  type: AgentMessageType,
  payload: Record<string, unknown>,
): void {
  if (!agentBus) {
    console.warn("[AgentLifecycle] Bus not ready, dropping event");
    return;
  }
  agentBus.publish({ from: "game_engine", to: "coordinator_01", type, payload }).catch((err) => {
    console.error("[AgentLifecycle] Publish failed:", err);
  });
}
