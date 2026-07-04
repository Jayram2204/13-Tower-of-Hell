import { useGameStore } from "../../state/gameStore";

interface QuestCondition {
  type: "inventory_check" | "stamina_check" | "obstacle_cleared" | "npc_interacted" | "floor_reached";
  target: string;
  threshold: number;
}

interface QuestReward {
  type: "item" | "renown" | "portal_unlock" | "credits";
  target: string;
  quantity: number;
  itemName?: string;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  status: "inactive" | "active" | "completed";
  conditions: QuestCondition[];
  rewards: QuestReward[];
}

export class QuestManager {
  private quests: Map<string, Quest> = new Map();
  private onQuestUpdate?: (id: string, status: string) => void;

  constructor(onQuestUpdate?: (id: string, status: string) => void) {
    this.onQuestUpdate = onQuestUpdate;
    this.registerQuests();
  }

  private registerQuests(): void {
    this.quests.set("floor_1_entry", {
      id: "floor_1_entry",
      name: "The Bramble Gate",
      description: "Speak with Teo, gather 5 glow berries, and clear the gateway brambles to unlock Dungeon Floor 1.",
      status: "inactive",
      conditions: [
        { type: "npc_interacted", target: "teo_merchant", threshold: 1 },
        { type: "inventory_check", target: "glow_berry", threshold: 5 },
        { type: "obstacle_cleared", target: "gateway_brambles", threshold: 1 },
      ],
      rewards: [
        { type: "portal_unlock", target: "1", quantity: 0 },
        { type: "renown", target: "tower_renown", quantity: 50 },
        { type: "credits", target: "credit_pouch", quantity: 100 },
      ],
    });

    for (let i = 1; i <= 13; i++) {
      this.quests.set(`clear_floor_${i}`, {
        id: `clear_floor_${i}`,
        name: `Conquer Floor ${i}`,
        description: `Defeat all enemies on Dungeon Floor ${i} and reach the portal to advance.`,
        status: "inactive",
        conditions: [
          { type: "floor_reached", target: `${i + 1}`, threshold: 1 },
        ],
        rewards: [
          { type: "portal_unlock", target: `${i + 1}`, quantity: 0 },
          { type: "renown", target: "tower_renown", quantity: i * 25 },
          { type: "credits", target: "credit_pouch", quantity: i * 50 },
        ],
      });
    }

    this.quests.set("clear_floor_13", {
      id: "clear_floor_13",
      name: "The Summit",
      description: "Ascend through all 13 floors and conquer the final tower. Your journey ends here.",
      status: "inactive",
      conditions: [
        { type: "floor_reached", target: "14", threshold: 1 },
      ],
      rewards: [
        { type: "renown", target: "tower_renown", quantity: 1000 },
        { type: "credits", target: "credit_pouch", quantity: 5000 },
      ],
    });
  }

  activate(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== "inactive") return;
    quest.status = "active";
    this.onQuestUpdate?.(questId, "active");
  }

  evaluate(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status === "completed") return false;

    if (quest.status === "inactive") {
      quest.status = "active";
    }

    const store = useGameStore.getState();
    const allMet = quest.conditions.every((c) => {
      switch (c.type) {
        case "inventory_check": {
          const item = store.inventory.find((i) => i.itemId === c.target);
          return item && item.quantity >= c.threshold;
        }
        case "stamina_check":
          return store.stamina >= c.threshold;
        case "obstacle_cleared": {
          const floor = store.worldState[store.currentFloor];
          return floor?.clearedObstacles.includes(c.target) ?? false;
        }
        case "npc_interacted": {
          const floor = store.worldState[store.currentFloor];
          const disp = floor?.npcDispositions[c.target] ?? 0;
          return disp >= c.threshold;
        }
        case "floor_reached": {
          return store.currentFloor >= Number.parseInt(c.target);
        }
        default:
          return false;
      }
    });

    if (allMet) {
      quest.status = "completed";
      this.applyRewards(quest.rewards);
      this.onQuestUpdate?.(questId, "completed");
      return true;
    }
    return false;
  }

  private applyRewards(rewards: QuestReward[]): void {
    const store = useGameStore.getState();
    for (const reward of rewards) {
      switch (reward.type) {
        case "item":
          store.addItem(reward.target, reward.itemName || reward.target, reward.quantity);
          break;
        case "renown":
          store.towerRenown += reward.quantity;
          break;
        case "credits":
          store.addItem(reward.target, "Credit Pouch", reward.quantity);
          break;
        case "portal_unlock":
          store.unlockPortal(Number.parseInt(reward.target));
          break;
      }
    }
  }

  private activeQuestId: string | null = null;

  activateNext(): void {
    const allQuests = Array.from(this.quests.values());
    const active = allQuests.find((q) => q.status === "active");
    if (active) {
      this.activeQuestId = active.id;
      return;
    }
    const next = allQuests.find((q) => q.status === "inactive");
    if (next) {
      this.activate(next.id);
      this.activeQuestId = next.id;
    }
  }

  getActiveQuest(): { id: string; name: string; description: string; status: string } | null {
    for (const q of this.quests.values()) {
      if (q.status === "active") {
        return { id: q.id, name: q.name, description: q.description, status: q.status };
      }
    }
    return null;
  }

  getStatus(questId: string): string {
    return this.quests.get(questId)?.status || "unknown";
  }

  getActiveQuests(): { id: string; name: string; description: string; status: string }[] {
    const result: { id: string; name: string; description: string; status: string }[] = [];
    for (const q of this.quests.values()) {
      result.push({ id: q.id, name: q.name, description: q.description, status: q.status });
    }
    return result;
  }
}
