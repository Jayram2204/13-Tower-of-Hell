import { agentChain, publicClient } from "./agentChain";

type AgentEventHandler = (event: {
  agentId: string;
  eventType: string;
  data: Record<string, unknown>;
  blockNumber: bigint;
}) => void;

export interface EventListenerConfig {
  onAgentEvent?: AgentEventHandler;
  pollIntervalMs?: number;
}

const AGENT_ADDRESSES = [
  { key: "npc", env: "NPC_REGISTRY_ADDRESS" as const },
  { key: "coordinator", env: "COORDINATOR_ADDRESS" as const },
  { key: "worker", env: "WORKER_AGENT_ADDRESS" as const },
  { key: "hero", env: "HERO_AGENT_ADDRESS" as const },
  { key: "enemy", env: "ENEMY_AGENT_ADDRESS" as const },
  { key: "trap", env: "TRAP_AGENT_ADDRESS" as const },
  { key: "admin", env: "ADMIN_AGENT_ADDRESS" as const },
] as const;

export class EventListener {
  private running = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastCheckedBlock: bigint;
  private config: EventListenerConfig;

  constructor(config: EventListenerConfig) {
    this.config = config;
    this.lastCheckedBlock = BigInt(process.env.EVENT_LISTENER_START_BLOCK || "0");
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (!agentChain.isConfigured()) {
      console.warn("[EventListener] Agent contracts not configured — skipping");
      return;
    }

    this.running = true;
    console.log("[EventListener] Starting multi-agent event poller...");

    const poll = async () => {
      try {
        await this.poll();
      } catch (err) {
        console.error("[EventListener] Poll error:", err);
      }
    };

    await poll();
    this.intervalId = setInterval(poll, this.config.pollIntervalMs ?? 15_000);
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    const currentBlock = await publicClient.getBlockNumber();
    if (currentBlock <= this.lastCheckedBlock) return;

    const MAX_RANGE = 100n;
    let fromBlock = this.lastCheckedBlock + 1n;
    let toBlock = currentBlock;
    if (toBlock - fromBlock > MAX_RANGE) {
      fromBlock = toBlock - MAX_RANGE;
    }

    for (const agent of AGENT_ADDRESSES) {
      const addr = process.env[agent.env];
      if (!addr) continue;
      await this.pollAgent(addr, agent.key, fromBlock, toBlock);
    }

    this.lastCheckedBlock = currentBlock;
  }

  private async pollAgent(
    address: string,
    name: string,
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<void> {
    try {
      const logs = await publicClient.getLogs({
        address: address as `0x${string}`,
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        console.log(`[EventListener] ${name} event: topic0=${log.topics[0]} block=${log.blockNumber}`);
        this.config.onAgentEvent?.({
          agentId: name,
          eventType: log.topics[0] ?? "",
          data: { address: log.address, topics: log.topics, data: log.data } as Record<string, unknown>,
          blockNumber: log.blockNumber,
        });
      }
    } catch (err) {
      console.warn(`[EventListener] Poll ${name} failed:`, err);
    }
  }

  getLastCheckedBlock(): bigint {
    return this.lastCheckedBlock;
  }
}
