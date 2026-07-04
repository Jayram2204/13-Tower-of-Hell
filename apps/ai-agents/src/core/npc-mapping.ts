export interface AgentSlot {
  agentId: string;
  agentType: "worker" | "enemy" | "trap" | "hero" | "admin" | "coordinator";
  npcIds: string[];
  tickIntervalMs: number;
  personalityPrompt: string;
}

export const AGENT_SLOTS: AgentSlot[] = [
  {
    agentId: "worker_01",
    agentType: "worker",
    npcIds: ["teo_merchant", "durin_blacksmith", "lyra_mage"],
    tickIntervalMs: 30000,
    personalityPrompt:
      "You are a town worker NPC. Manage inventory, set prices based on supply/demand, and respond to player inquiries. You can trade items, adjust prices, and generate new stock each cycle.",
  },
  {
    agentId: "worker_02",
    agentType: "worker",
    npcIds: ["aldric_manager", "reaver_bounty", "gatekeeper", "registrar"],
    tickIntervalMs: 30000,
    personalityPrompt:
      "You are an administrative town NPC. Manage town finances, issue bounties, control gate access, and register new players. You track the overall economic health of the town.",
  },
  {
    agentId: "enemy_01",
    agentType: "enemy",
    npcIds: ["skeleton", "wraith", "golem", "bat"],
    tickIntervalMs: 10000,
    personalityPrompt:
      "You are a dungeon enemy controller. Manage enemy spawn rates, difficulty scaling per floor, and group tactics. Coordinate aggro behavior and adjust enemy stats based on player progression.",
  },
  {
    agentId: "trap_01",
    agentType: "trap",
    npcIds: ["gateway_brambles", "flame_barrier", "crystal_wall", "shadow_gate", "inferno_gate", "doom_barrier"],
    tickIntervalMs: 15000,
    personalityPrompt:
      "You are a trap controller. Manage trap activation patterns, reset timers, and difficulty. Coordinate trap sequences and adjust trigger conditions based on floor depth and player skill.",
  },
  {
    agentId: "hero_01",
    agentType: "hero",
    npcIds: [],
    tickIntervalMs: 30000,
    personalityPrompt:
      "You are a hero agent tracking a player's progression. Monitor quest completion, evaluate conditions, grant rewards, and manage leveling. You are the player's personal progression system.",
  },
];

export const ADMIN_AGENT_SLOT: AgentSlot = {
  agentId: "admin_01",
  agentType: "admin",
  npcIds: [],
  tickIntervalMs: 20000,
  personalityPrompt:
    "You are the Tower Admin. Govern all 13 floors. You control difficulty curves, floor unlock conditions, and cross-floor state. You coordinate between other agents and escalate issues. You are the final authority on tower state.",
};

export const COORDINATOR_AGENT_SLOT: AgentSlot = {
  agentId: "coordinator_01",
  agentType: "coordinator",
  npcIds: [],
  tickIntervalMs: 5000,
  personalityPrompt:
    "You are the Agent Coordinator. Route messages between agents, monitor health, and dispatch events. You ensure agents are responsive and escalate failures to Admin.",
};
