import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InventoryItem {
  itemId: string;
  name: string;
  quantity: number;
}

export interface FloorState {
  isPortalUnlocked: boolean;
  clearedObstacles: string[];
  npcDispositions: Record<string, number>;
}

export interface GameStore {
  playerId: string;
  playerName: string;
  walletAddress: string;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  towerRenown: number;
  currentFloor: number;
  inventory: InventoryItem[];
  worldState: Record<number, FloorState>;

  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setWalletAddress: (addr: string) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  spendStamina: (amount: number) => void;
  restoreStamina: (amount: number) => void;
  addRenown: (amount: number) => void;
  addItem: (itemId: string, name: string, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => boolean;
  hasItem: (itemId: string, quantity: number) => boolean;
  unlockPortal: (floor: number) => void;
  clearObstacle: (floor: number, obstacleId: string) => void;
  setNpcDisposition: (floor: number, npcId: string, value: number) => void;
  syncFromServer: (data: Partial<GameStore>) => void;
  reset: () => void;
}

const initialState = {
  playerId: "",
  playerName: "---",
  walletAddress: "",
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  towerRenown: 0,
  currentFloor: 1,
  inventory: [] as InventoryItem[],
  worldState: {} as Record<number, FloorState>,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlayerId: (id) => set({ playerId: id }),
      setPlayerName: (name) => set({ playerName: name }),
      setWalletAddress: (addr) =>
        set((s) => ({
          walletAddress: addr,
          ...(addr ? { playerId: addr } : {}),
        })),

      damagePlayer: (amount) => set((s) => ({ hp: Math.max(0, s.hp - amount) })),

      healPlayer: (amount) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),

      spendStamina: (amount) => set((s) => ({ stamina: Math.max(0, s.stamina - amount) })),

      restoreStamina: (amount) =>
        set((s) => ({ stamina: Math.min(s.maxStamina, s.stamina + amount) })),

      addRenown: (amount) => set((s) => ({ towerRenown: s.towerRenown + amount })),

      addItem: (itemId, name, quantity) =>
        set((s) => {
          const existing = s.inventory.find((i) => i.itemId === itemId);
          if (existing) {
            existing.quantity += quantity;
            return { inventory: [...s.inventory] };
          }
          return { inventory: [...s.inventory, { itemId, name, quantity }] };
        }),

      removeItem: (itemId, quantity) => {
        const item = get().inventory.find((i) => i.itemId === itemId);
        if (!item || item.quantity < quantity) return false;
        item.quantity -= quantity;
        if (item.quantity <= 0) {
          set((s) => ({ inventory: s.inventory.filter((i) => i.itemId !== itemId) }));
        } else {
          set((s) => ({ inventory: [...s.inventory] }));
        }
        return true;
      },

      hasItem: (itemId, quantity) => {
        const item = get().inventory.find((i) => i.itemId === itemId);
        return !!item && item.quantity >= quantity;
      },

      unlockPortal: (floor) =>
        set((s) => ({
          worldState: {
            ...s.worldState,
            [floor]: {
              ...(s.worldState[floor] || {
                isPortalUnlocked: false,
                clearedObstacles: [],
                npcDispositions: {},
              }),
              isPortalUnlocked: true,
            },
          },
        })),

      clearObstacle: (floor, obstacleId) =>
        set((s) => {
          const floorState = s.worldState[floor] || {
            isPortalUnlocked: false,
            clearedObstacles: [],
            npcDispositions: {},
          };
          return {
            worldState: {
              ...s.worldState,
              [floor]: {
                ...floorState,
                clearedObstacles: [...new Set([...floorState.clearedObstacles, obstacleId])],
              },
            },
          };
        }),

      setNpcDisposition: (floor, npcId, value) =>
        set((s) => {
          const floorState = s.worldState[floor] || {
            isPortalUnlocked: false,
            clearedObstacles: [],
            npcDispositions: {},
          };
          return {
            worldState: {
              ...s.worldState,
              [floor]: {
                ...floorState,
                npcDispositions: { ...floorState.npcDispositions, [npcId]: value },
              },
            },
          };
        }),

      syncFromServer: (data) => set(data),

      reset: () => set(initialState),
    }),
    { name: "13towers-save" },
  ),
);
