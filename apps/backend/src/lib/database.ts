import type { DungeonState, InventoryItem, NPCState, PlayerRecord } from "@towers/shared-types";

const players = new Map<string, PlayerRecord>();
const npcs = new Map<string, NPCState>();
const dungeons = new Map<string, DungeonState>();

function seed(): void {
  const baseItems: InventoryItem[] = [
    { id: "iron_sword", name: "Iron Blade", type: "weapon", quantity: 3 },
    { id: "steel_sword", name: "Steel Edge", type: "weapon", quantity: 1 },
    { id: "leather_armor", name: "Leather Vest", type: "armor", quantity: 5 },
    { id: "health_potion", name: "Health Draught", type: "potion", quantity: 10 },
    { id: "mana_potion", name: "Mana Vial", type: "potion", quantity: 8 },
    { id: "iron_ore", name: "Iron Ore", type: "material", quantity: 20 },
  ];

  const townNPCs: NPCState[] = [
    {
      id: "teo_merchant",
      name: "TEO",
      type: "merchant",
      credits: 3000,
      inventory: baseItems.filter((i) => i.type === "material"),
      priceModifier: 1.05,
      isActive: true,
      lastAction: Date.now(),
    },
    {
      id: "durin_blacksmith",
      name: "DURIN",
      type: "blacksmith",
      credits: 8000,
      inventory: baseItems.filter((i) => i.type === "weapon" || i.type === "armor"),
      priceModifier: 1.0,
      isActive: true,
      lastAction: Date.now(),
    },
    {
      id: "lyra_mage",
      name: "LYRA",
      type: "mage",
      credits: 12000,
      inventory: baseItems.filter((i) => i.type === "potion"),
      priceModifier: 1.2,
      isActive: true,
      lastAction: Date.now(),
    },
    {
      id: "aldric_manager",
      name: "ALDRIC",
      type: "manager",
      credits: 50000,
      inventory: [],
      priceModifier: 1.0,
      isActive: true,
      lastAction: Date.now(),
    },
    {
      id: "reaver_bounty",
      name: "REAVER",
      type: "bounty",
      credits: 25000,
      inventory: [],
      priceModifier: 1.0,
      isActive: true,
      lastAction: Date.now(),
    },
    {
      id: "gatekeeper",
      name: "GATEKEEPER",
      type: "gatekeeper",
      credits: 10000,
      inventory: [],
      priceModifier: 1.0,
      isActive: true,
      lastAction: Date.now(),
    },
    {
      id: "registrar",
      name: "REGISTRAR",
      type: "registrar",
      credits: 5000,
      inventory: [],
      priceModifier: 1.0,
      isActive: true,
      lastAction: Date.now(),
    },
  ];

  for (const npc of townNPCs) {
    npcs.set(npc.id, npc);
  }

  const floorData: DungeonState[] = [
    { floorId: "dungeon_1", name: "Dungeon Floor 1", bounty: 500, requiredLevel: 1, clearedBy: [] },
    {
      floorId: "dungeon_2",
      name: "Dungeon Floor 2",
      bounty: 1000,
      requiredLevel: 2,
      clearedBy: [],
    },
    {
      floorId: "dungeon_3",
      name: "Dungeon Floor 3",
      bounty: 2000,
      requiredLevel: 3,
      clearedBy: [],
    },
  ];

  for (const d of floorData) {
    dungeons.set(d.floorId, d);
  }
}

seed();

export const db = {
  getPlayer(id: string): PlayerRecord | undefined {
    return players.get(id);
  },
  setPlayer(id: string, data: PlayerRecord): void {
    players.set(id, data);
  },
  createPlayer(id: string, name: string): PlayerRecord {
    const record: PlayerRecord = {
      id,
      name,
      credits: 100,
      currentFloor: "town",
      createdAt: Date.now(),
      lastActive: Date.now(),
      clearedFloors: [],
      inventory: [{ id: "health_potion", name: "Health Draught", type: "potion", quantity: 2 }],
    };
    players.set(id, record);
    return record;
  },
  getNPC(id: string): NPCState | undefined {
    return npcs.get(id);
  },
  getAllNPCs(): NPCState[] {
    return Array.from(npcs.values());
  },
  updateNPC(id: string, update: Partial<NPCState>): void {
    const npc = npcs.get(id);
    if (npc) Object.assign(npc, update);
  },
  getDungeon(id: string): DungeonState | undefined {
    return dungeons.get(id);
  },
  getAllDungeons(): DungeonState[] {
    return Array.from(dungeons.values());
  },
  markFloorCleared(playerId: string, floorId: string): void {
    const player = players.get(playerId);
    const dungeon = dungeons.get(floorId);
    if (player && dungeon && !dungeon.clearedBy.includes(playerId)) {
      dungeon.clearedBy.push(playerId);
      player.clearedFloors.push(floorId);
      player.credits += dungeon.bounty;
      player.lastActive = Date.now();
    }
  },
};
