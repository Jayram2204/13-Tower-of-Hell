export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
}

export interface PlayerRecord {
  id: string;
  name: string;
  credits: number;
  currentFloor: string;
  createdAt: number;
  lastActive: number;
  clearedFloors: string[];
  inventory: InventoryItem[];
  walletAddress?: string;
}

export interface NPCState {
  id: string;
  name: string;
  type: string;
  credits: number;
  inventory: InventoryItem[];
  priceModifier: number;
  isActive: boolean;
  lastAction: number;
}

export interface DungeonState {
  floorId: string;
  name: string;
  bounty: number;
  requiredLevel: number;
  clearedBy: string[];
}
