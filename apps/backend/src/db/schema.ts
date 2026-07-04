import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  walletAddress: text("wallet_address"),
  credits: integer("credits").notNull().default(100),
  currentFloor: text("current_floor").notNull().default("town"),
  createdAt: integer("created_at").notNull(),
  lastActive: integer("last_active").notNull(),
  clearedFloors: text("cleared_floors").notNull().default("[]"),
  inventory: text("inventory").notNull().default("[]"),
});

export const npcs = sqliteTable("npcs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  credits: integer("credits").notNull().default(0),
  priceModifier: real("price_modifier").notNull().default(1.0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastAction: integer("last_action").notNull(),
  inventory: text("inventory").notNull().default("[]"),
});

export const dungeons = sqliteTable("dungeons", {
  floorId: text("floor_id").primaryKey(),
  name: text("name").notNull(),
  theme: text("theme").notNull().default("dungeon_1"),
  bounty: integer("bounty").notNull().default(0),
  requiredLevel: integer("required_level").notNull().default(1),
  clearedBy: text("cleared_by").notNull().default("[]"),
});
