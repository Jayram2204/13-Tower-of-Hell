export type AgentType = "coordinator" | "worker" | "hero" | "enemy" | "trap" | "admin";

export type AgentStatus = "idle" | "processing" | "error";

export type AgentMessageType =
  | "player_interaction"
  | "player_attack"
  | "floor_transition"
  | "agent_heartbeat"
  | "state_sync"
  | "quest_evaluation"
  | "difficulty_request"
  | "spawn_request"
  | "trap_trigger"
  | "economy_tick"
  | "admin_command";

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: AgentMessageType;
  payload: Record<string, unknown>;
  timestamp: number;
  ttl?: number;
}

export interface AgentConfig {
  agentId: string;
  agentType: AgentType;
  managedNpcIds: string[];
  floorScope: number[];
  personalityPrompt: string;
  tickIntervalMs: number;
}

export interface AgentState {
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  managedNpcIds: string[];
  lastTick: number;
  errorCount: number;
  metadata: Record<string, unknown>;
}

export interface AgentHealth {
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  lastHeartbeat: number;
  uptimeMs: number;
}

export interface MessageHandler {
  (msg: AgentMessage): Promise<void> | void;
}
