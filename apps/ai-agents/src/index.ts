import { startAgents, stopAgents, publishEvent } from "./agents/agent-lifecycle";
import { startAgentServer } from "./server";

console.log(`
  ╔═══════════════════════════════════════════╗
  ║  13 Towers of Hell — AI Agent Cluster     ║
  ║  6 Agent Types | Message Bus | Autonomous ║
  ╚═══════════════════════════════════════════╝
`);

startAgents();
startAgentServer();

process.on("SIGINT", () => {
  console.log("\n[AI Agents] Shutting down...");
  stopAgents();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[AI Agents] Shutting down...");
  stopAgents();
  process.exit(0);
});

export { publishEvent, getAgentBus, getCoordinator, getAdmin } from "./agents/agent-lifecycle";
export { AgentBus } from "./core/AgentBus";
export { CoordinatorAgent } from "./agents/CoordinatorAgent";
export { WorkerAgent } from "./agents/WorkerAgent";
export { HeroAgent } from "./agents/HeroAgent";
export { EnemyAgent } from "./agents/EnemyAgent";
export { TrapAgent } from "./agents/TrapAgent";
export { AdminAgent } from "./agents/AdminAgent";
