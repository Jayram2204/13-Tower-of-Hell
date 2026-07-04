import { ToolRegistry, type ToolCall } from "../tools/registry";
import { getPrompt, type NPCPrompt } from "../prompts/npc-prompts";
import { MemoryStore } from "../memory/store";

interface AgentConfig {
  npcId: string;
  npcName: string;
  backendUrl: string;
  llmApiKey: string;
  model?: string;
}

interface ConversationTurn {
  role: "npc" | "player";
  text: string;
  timestamp: number;
}

interface InteractionContext {
  playerId: string;
  playerRenown: number;
  playerFloor: number;
  inventory: { itemId: string; quantity: number }[];
  floorState: Record<string, boolean>;
}

const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export class LLMAgent {
  private config: AgentConfig;
  private prompt: NPCPrompt;
  private tools: ToolRegistry;
  private memory: MemoryStore;
  private conversation: ConversationTurn[] = [];
  private readonly MAX_HISTORY = 20;

  constructor(config: AgentConfig, memory?: MemoryStore) {
    this.config = config;
    this.prompt = getPrompt(config.npcId);
    this.tools = new ToolRegistry(config.backendUrl);
    this.memory = memory || new MemoryStore();
  }

  async processInteraction(
    playerId: string,
    playerInput: string,
    context: InteractionContext,
  ): Promise<{ dialogue: string; actions: ToolCall[] }> {
    this.conversation.push({ role: "player", text: playerInput, timestamp: Date.now() });

    const toolDefinitions = this.getToolDefinitions();
    const systemPrompt = this.buildSystemPrompt(context);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...this.conversation.slice(-10).map((t) => ({
        role: (t.role === "npc" ? "assistant" : "user") as "assistant" | "user",
        content: t.text,
      })),
    ];

    let dialogue = "";
    let actions: ToolCall[] = [];

    if (this.config.llmApiKey && this.config.llmApiKey !== "sk-placeholder") {
      try {
        const result = await this.callLLM(messages, toolDefinitions);
        dialogue = result.dialogue;
        actions = result.actions;
      } catch (err) {
        console.error(`[LLMAgent:${this.config.npcId}] LLM call failed:`, err);
        dialogue = this.fallbackResponse();
      }
    } else {
      dialogue = this.fallbackResponse();
    }

    for (const action of actions) {
      await this.tools.execute(action, playerId);
    }

    this.conversation.push({ role: "npc", text: dialogue, timestamp: Date.now() });

    if (this.conversation.length > this.MAX_HISTORY) {
      this.conversation = this.conversation.slice(-this.MAX_HISTORY);
    }

    await this.memory.insert({
      playerId,
      npcId: this.config.npcId,
      role: "player",
      content: playerInput,
      timestamp: Date.now(),
    });

    return { dialogue, actions };
  }

  private async callLLM(
    messages: { role: "system" | "assistant" | "user"; content: string }[],
    tools: unknown[],
  ): Promise<{ dialogue: string; actions: ToolCall[] }> {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o-mini",
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error("No response from LLM");

    const actions: ToolCall[] = (choice.message?.tool_calls || []).map((tc: { function: { name: string; arguments: string } }) => ({
      tool: tc.function.name as ToolCall["tool"],
      args: JSON.parse(tc.function.arguments),
    }));

    const dialogue = choice.message?.content || this.fallbackResponse();
    return { dialogue, actions };
  }

  private buildSystemPrompt(context: InteractionContext): string {
    const contextBlock = [
      `Player: ${context.playerId}`,
      `Renown: ${context.playerRenown}`,
      `Current Floor: ${context.playerFloor}`,
      `Floor State: ${JSON.stringify(context.floorState)}`,
      `Inventory Items: ${context.inventory.length}`,
    ].join("\n");

    const knowledgeBlock = this.prompt.knowledge.map((k) => `• ${k}`).join("\n");

    return [
      this.prompt.systemPrompt,
      "",
      "## Current Context",
      contextBlock,
      "",
      "## What You Know",
      knowledgeBlock,
      "",
      "## Response Rules",
      "• Keep responses to 2-3 sentences maximum",
      `• Your personality: ${this.prompt.personality}`,
      "• Stay in character at all times",
      "• Never break the fourth wall",
      "• If a player asks about game mechanics, respond in-character",
      "",
      "## Available Tools",
      "- grant_item: Give an item to the player (use sparingly, only for quest rewards)",
      "- modify_reputation: Change how you feel about the player (positive for help, negative for rudeness)",
      "- unlock_portal: Open a portal to the next floor (only when quest conditions are met)",
      "- generate_quest: Create a new quest for the player",
    ].join("\n");
  }

  private fallbackResponse(): string {
    const variants = this.prompt.greetingVariants;
    const base = variants[Math.floor(Math.random() * variants.length)];

    const followUps = [
      "What brings you to me today?",
      "Is there something you need?",
      "I trust your journey has been eventful.",
      "The tower calls, as it always does.",
      "Speak your mind, traveler.",
    ];

    return `${base} ${followUps[Math.floor(Math.random() * followUps.length)]}`;
  }

  private getToolDefinitions(): unknown[] {
    return [
      {
        type: "function",
        function: {
          name: "grant_item",
          description: "Grant an item to the player's inventory. Use this for quest rewards, trades, or gifts.",
          parameters: {
            type: "object",
            properties: {
              itemId: { type: "string", description: "Item identifier (e.g., rusty_axe, glow_berry, health_potion)" },
              quantity: { type: "number", description: "How many to grant" },
            },
            required: ["itemId", "quantity"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "modify_reputation",
          description: "Change the player's reputation with this NPC. Positive for helpful behavior, negative for rudeness or hostility.",
          parameters: {
            type: "object",
            properties: {
              npcId: { type: "string", description: "NPC identifier" },
              delta: { type: "number", description: "Reputation change (-10 to +10)" },
            },
            required: ["npcId", "delta"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "unlock_portal",
          description: "Unlock a portal to the next floor. Only call this when the player has completed the required conditions.",
          parameters: {
            type: "object",
            properties: {
              floorId: { type: "string", description: "Floor identifier (e.g., floor_1, floor_2)" },
            },
            required: ["floorId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "generate_quest",
          description: "Generate a new quest for the player. Includes conditions and rewards.",
          parameters: {
            type: "object",
            properties: {
              questTemplate: { type: "string", description: "Template name or custom quest description" },
            },
            required: ["questTemplate"],
          },
        },
      },
    ];
  }

  getConversationHistory(): ConversationTurn[] {
    return [...this.conversation];
  }

  clearConversation(): void {
    this.conversation = [];
  }
}
