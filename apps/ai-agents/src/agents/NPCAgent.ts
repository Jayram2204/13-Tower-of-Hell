import type { NPCState } from "@towers/shared-types";

type DBLike = {
  getNPC: (id: string) => NPCState | undefined;
  getAllNPCs: () => NPCState[];
  updateNPC: (id: string, update: Partial<NPCState>) => void;
  getAllDungeons: () => {
    floorId: string;
    name: string;
    bounty: number;
    requiredLevel: number;
    clearedBy: string[];
  }[];
};

export class NPCAgent {
  private state: NPCState;
  private cycleInterval: NodeJS.Timeout | null = null;
  private readonly CYCLE_MS = 30000;
  private db: DBLike;

  constructor(npcId: string, db: DBLike) {
    const npc = db.getNPC(npcId);
    if (!npc) throw new Error(`NPC ${npcId} not found`);
    this.state = npc;
    this.db = db;
  }

  start(): void {
    console.log(`[Agent] ${this.state.name} online`);
    this.cycleInterval = setInterval(() => this.cycle(), this.CYCLE_MS);
  }

  stop(): void {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
    }
    console.log(`[Agent] ${this.state.name} offline`);
  }

  private cycle(): void {
    switch (this.state.type) {
      case "blacksmith":
        this.blacksmithCycle();
        break;
      case "mage":
        this.mageCycle();
        break;
      case "manager":
        this.managerCycle();
        break;
      case "bounty":
        this.bountyCycle();
        break;
      case "gatekeeper":
        this.gatekeeperCycle();
        break;
      case "registrar":
        this.registrarCycle();
        break;
    }
    this.state.lastAction = Date.now();
    this.db.updateNPC(this.state.id, { lastAction: this.state.lastAction });
  }

  private blacksmithCycle(): void {
    const supply = this.getTotalSupply();
    const demand = this.getEstimatedDemand();
    const delta = demand - supply;

    if (delta > 5) {
      this.state.priceModifier = Math.min(1.5, this.state.priceModifier + 0.05);
      this.state.credits += Math.floor(Math.random() * 50);
    } else if (delta < -5) {
      this.state.priceModifier = Math.max(0.6, this.state.priceModifier - 0.05);
      this.state.credits -= Math.floor(Math.random() * 30);
    }

    if (Math.random() < 0.2) {
      this.state.inventory.push({
        id: `weapon_${Date.now()}`,
        name: `Forged Blade`,
        type: "weapon",
        quantity: 1,
      });
    }

    this.db.updateNPC(this.state.id, {
      priceModifier: this.state.priceModifier,
      credits: this.state.credits,
      inventory: this.state.inventory,
    });
  }

  private mageCycle(): void {
    if (Math.random() < 0.15) {
      this.state.inventory.push({
        id: `potion_${Date.now()}`,
        name: "Brewed Potion",
        type: "potion",
        quantity: Math.floor(Math.random() * 3) + 1,
      });
    }

    this.state.priceModifier = 1.0 + Math.sin(Date.now() * 0.00005) * 0.3;
    this.state.credits += Math.floor(Math.random() * 40);

    this.db.updateNPC(this.state.id, {
      priceModifier: this.state.priceModifier,
      credits: this.state.credits,
      inventory: this.state.inventory,
    });
  }

  private managerCycle(): void {
    const allNPCs = this.db.getAllNPCs();
    let totalCredits = 0;
    let npcCount = 0;
    for (const npc of allNPCs) {
      if (npc.type !== "manager") {
        totalCredits += npc.credits;
        npcCount++;
      }
    }
    const avgCredits = npcCount > 0 ? totalCredits / npcCount : 0;
    this.state.credits = Math.floor(avgCredits * 0.1);
    this.db.updateNPC(this.state.id, { credits: this.state.credits });
  }

  private bountyCycle(): void {
    this.state.credits += Math.floor(Math.random() * 100) + 50;
    this.db.updateNPC(this.state.id, { credits: this.state.credits });
  }

  private gatekeeperCycle(): void {
    this.state.credits += Math.floor(Math.random() * 20);
    this.db.updateNPC(this.state.id, { credits: this.state.credits });
  }

  private registrarCycle(): void {
    this.state.credits += Math.floor(Math.random() * 10);
    this.db.updateNPC(this.state.id, { credits: this.state.credits });
  }

  private getTotalSupply(): number {
    return this.state.inventory.reduce((sum, item) => sum + item.quantity, 0);
  }

  private getEstimatedDemand(): number {
    return Math.floor(Math.random() * 20) + 5;
  }

  getState(): NPCState {
    return this.state;
  }

  canAfford(price: number): boolean {
    return this.state.credits >= price;
  }

  trade(itemId: string, quantity: number, pricePerUnit: number): boolean {
    const item = this.state.inventory.find((i) => i.id === itemId);
    if (!item || item.quantity < quantity) return false;
    const totalCost = pricePerUnit * quantity;
    if (this.state.credits < totalCost) return false;

    item.quantity -= quantity;
    this.state.credits -= totalCost;
    this.db.updateNPC(this.state.id, {
      inventory: this.state.inventory,
      credits: this.state.credits,
    });
    return true;
  }
}

export class NPCManager {
  private agents: NPCAgent[] = [];
  private db: DBLike;

  constructor(db: DBLike) {
    this.db = db;
  }

  startAll(): void {
    const allNPCs = this.db.getAllNPCs();
    for (const npc of allNPCs) {
      try {
        const agent = new NPCAgent(npc.id, this.db);
        agent.start();
        this.agents.push(agent);
      } catch (err) {
        console.error(`Failed to start agent for ${npc.id}:`, err);
      }
    }
    console.log(`[NPCManager] ${this.agents.length} agents online`);
  }

  stopAll(): void {
    for (const agent of this.agents) {
      agent.stop();
    }
    this.agents = [];
    console.log("[NPCManager] All agents offline");
  }
}
