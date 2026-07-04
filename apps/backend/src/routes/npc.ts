import { Hono } from "hono";
import { agentChain } from "../lib/agentChain";

export const npcRoutes = new Hono();

const NPC_IDS = [
  "gatekeeper", "registrar", "teo_merchant",
  "durin_blacksmith", "lyra_mage", "aldric_manager", "reaver_bounty",
];

npcRoutes.get("/", async (c) => {
  const results = [];
  for (const id of NPC_IDS) {
    const npc = await agentChain.getNPC(id);
    if (npc) {
      const n = npc as any;
      results.push({
        npcId: n.npcId,
        name: n.name,
        npcType: n.npcType,
        credits: Number(n.credits),
        priceModifier: Number(n.priceModifier),
        reputation: Number(n.reputation),
        isActive: n.isActive,
      });
    }
  }
  return c.json(results);
});

npcRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const npc = await agentChain.getNPC(id);
  if (!npc) return c.json({ error: "NPC not found" }, 404);
  const inv = await agentChain.getNPCInventory(id);
  return c.json({ ...(npc as object), inventory: inv });
});

npcRoutes.post("/interact", async (c) => {
  const { npcId, playerId, playerInput } = await c.req.json();
  if (!npcId || !playerId) {
    return c.json({ error: "npcId and playerId required" }, 400);
  }

  const npc = await agentChain.getNPC(npcId);
  if (!npc) return c.json({ error: "NPC not found" }, 404);

  const n = npc as any;
  const hero = playerId.startsWith("0x")
    ? await agentChain.getHero(playerId as `0x${string}`)
    : null;
  const h = hero ? (hero as any) : null;

  return c.json({
    success: true,
    npc: {
      id: n.npcId,
      name: n.name,
      type: ["merchant", "blacksmith", "mage", "manager", "bounty", "gatekeeper", "registrar"][n.npcType] || "generic",
      credits: Number(n.credits),
      priceModifier: Number(n.priceModifier) / 100,
      reputation: Number(n.reputation),
    },
    player: h ? { name: h.playerName, renown: Number(h.renown), floor: Number(h.currentFloor) } : null,
  });
});

npcRoutes.post("/economy-tick", async (c) => {
  const { npcId, supply, demand } = await c.req.json();
  if (!npcId) return c.json({ error: "npcId required" }, 400);
  const result = await agentChain.runEconomyTick(npcId, BigInt(supply || 0), BigInt(demand || 0));
  if (!result) return c.json({ error: "Tick failed" }, 500);
  return c.json({ success: true, priceModifier: Number(result.priceModifier), credits: Number(result.credits) });
});
