import type { DungeonState, NPCState, PlayerRecord } from "@towers/shared-types";

export interface IPlayerRepository {
  get(id: string): PlayerRecord | undefined;
  set(id: string, data: PlayerRecord): void;
  create(id: string, name: string): PlayerRecord;
}

export interface INPCRepository {
  get(id: string): NPCState | undefined;
  getAll(): NPCState[];
  update(id: string, update: Partial<NPCState>): void;
}

export interface IDungeonRepository {
  get(id: string): DungeonState | undefined;
  getAll(): DungeonState[];
  markCleared(playerId: string, floorId: string): void;
}
