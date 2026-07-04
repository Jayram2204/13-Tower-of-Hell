import { Hono } from "hono";
import { cors } from "hono/cors";
import { EventListener } from "./lib/eventListener";
import { dungeonRoutes } from "./routes/dungeon";
import { npcRoutes } from "./routes/npc";
import { playerRoutes } from "./routes/player";

const app = new Hono();

app.use("/*", cors({ origin: "*" }));
app.route("/api/player", playerRoutes);
app.route("/api/dungeon", dungeonRoutes);
app.route("/api/npc", npcRoutes);

const listener = new EventListener({
  onAgentEvent: (event) => {
    console.log(`[EventListener] Agent event: ${event.agentId} @ block ${event.blockNumber}`);
  },
  pollIntervalMs: 15_000,
});

listener.start().catch((err) => {
  console.error("Failed to start event listener:", err);
});

export default app;
