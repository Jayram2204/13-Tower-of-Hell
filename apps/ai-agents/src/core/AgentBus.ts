import { type AgentMessage, type AgentMessageType, type MessageHandler } from "./types";

let messageIdCounter = 0;

export class AgentBus {
  private handlers = new Map<AgentMessageType, MessageHandler[]>();
  private history: AgentMessage[] = [];
  private readonly MAX_HISTORY = 500;

  subscribe(type: AgentMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
    return () => {
      const list = this.handlers.get(type);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }

  async publish(msg: Omit<AgentMessage, "id" | "timestamp">): Promise<void> {
    const full: AgentMessage = {
      ...msg,
      id: `msg_${++messageIdCounter}_${Date.now()}`,
      timestamp: Date.now(),
    };

    this.history.push(full);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }

    const handlers = this.handlers.get(msg.type);
    if (!handlers) return;

    const errors: Error[] = [];
    await Promise.all(
      handlers.map((h) =>
        (async () => {
          try {
            await h(full);
          } catch (err) {
            errors.push(err instanceof Error ? err : new Error(String(err)));
          }
        })(),
      ),
    );

    if (errors.length > 0) {
      console.error(`[AgentBus] ${errors.length} handler(s) failed for ${msg.type}:`, errors);
    }
  }

  getHistory(type?: AgentMessageType): AgentMessage[] {
    if (type) return this.history.filter((m) => m.type === type);
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}
