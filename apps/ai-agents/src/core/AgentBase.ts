import { AgentBus } from "./AgentBus";
import {
  type AgentConfig,
  type AgentMessage,
  type AgentMessageType,
  type AgentState,
  type AgentStatus,
} from "./types";

export abstract class AgentBase {
  readonly config: AgentConfig;
  protected bus: AgentBus;
  protected state: AgentState;
  protected tickTimer: ReturnType<typeof setInterval> | null = null;
  protected startTime = 0;
  private unsubscribers: (() => void)[] = [];

  constructor(config: AgentConfig, bus: AgentBus) {
    this.config = config;
    this.bus = bus;
    this.state = {
      agentId: config.agentId,
      agentType: config.agentType,
      status: "idle",
      managedNpcIds: config.managedNpcIds,
      lastTick: 0,
      errorCount: 0,
      metadata: {},
    };
  }

  abstract handleMessage(msg: AgentMessage): Promise<void>;
  abstract onTick(): Promise<void>;

  get agentId(): string {
    return this.config.agentId;
  }

  get status(): AgentStatus {
    return this.state.status;
  }

  protected subscribe(type: AgentMessageType): void {
    const unsub = this.bus.subscribe(type, (msg) => {
      if (msg.to !== this.agentId && msg.to !== "*") return;
      this.handleIncoming(msg);
    });
    this.unsubscribers.push(unsub);
  }

  private async handleIncoming(msg: AgentMessage): Promise<void> {
    this.state.status = "processing";
    try {
      await this.handleMessage(msg);
      this.state.status = "idle";
    } catch (err) {
      this.state.status = "error";
      this.state.errorCount++;
      console.error(`[${this.agentId}] Error handling ${msg.type}:`, err);
    }
  }

  protected async send(
    to: string,
    type: AgentMessageType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.bus.publish({ from: this.agentId, to, type, payload });
  }

  protected async reply(original: AgentMessage, payload: Record<string, unknown>): Promise<void> {
    await this.send(original.from, original.type, payload);
  }

  start(): void {
    this.startTime = Date.now();
    this.state.status = "idle";
    this.setupSubscriptions();

    this.tickTimer = setInterval(() => {
      this.state.lastTick = Date.now();
      this.onTick().catch((err) => {
        this.state.status = "error";
        this.state.errorCount++;
        console.error(`[${this.agentId}] Tick error:`, err);
      });
    }, this.config.tickIntervalMs);

    console.log(`[${this.agentId}] Started (type=${this.config.agentType}, interval=${this.config.tickIntervalMs}ms)`);
  }

  stop(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.state.status = "idle";
    console.log(`[${this.agentId}] Stopped`);
  }

  get uptimeMs(): number {
    return this.startTime > 0 ? Date.now() - this.startTime : 0;
  }

  getAgentState(): AgentState {
    return { ...this.state };
  }

  protected abstract setupSubscriptions(): void;
}
