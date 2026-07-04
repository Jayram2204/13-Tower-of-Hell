import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function main() {
  const { serve } = await import("@hono/node-server");
  const { default: app } = await import("./index");

  const PORT = parseInt(process.env.HONO_PORT || "3001", 10);

  console.log(`[Hono] Starting agent API server on port ${PORT}...`);
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[Hono] Agent API running at http://localhost:${info.port}`);
    console.log(`[Hono] Endpoints:`);
    console.log(`  GET  /api/npc`);
    console.log(`  GET  /api/npc/:id`);
    console.log(`  POST /api/npc/interact`);
    console.log(`  POST /api/npc/economy-tick`);
    console.log(`  GET  /api/dungeon/floors`);
    console.log(`  GET  /api/dungeon/floor/:num`);
    console.log(`  POST /api/dungeon/verify`);
    console.log(`  POST /api/dungeon/sync`);
    console.log(`  POST /api/dungeon/difficulty`);
    console.log(`  POST /api/player/register`);
    console.log(`  GET  /api/player/:id`);
  });
}
main();
