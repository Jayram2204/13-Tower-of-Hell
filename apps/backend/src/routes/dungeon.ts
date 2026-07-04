import { Hono } from "hono";
import { AuthError, requireAuth } from "../lib/auth";
import { chain } from "../lib/blockchain";
import { agentChain } from "../lib/agentChain";

export const dungeonRoutes = new Hono();

dungeonRoutes.post("/verify", async (c) => {
  const { playerId, floorId, signature } = await c.req.json();
  if (!playerId || !floorId) {
    return c.json({ error: "playerId and floorId required" }, 400);
  }

  if (signature) {
    try {
      const message = `13towers:dungeon:verify:${playerId}:${floorId}:${Math.floor(Date.now() / 3600000)}`;
      await requireAuth(playerId, message, signature);
    } catch (err) {
      if (err instanceof AuthError) return c.json({ error: "Invalid signature" }, 403);
      throw err;
    }
  }

  const floorNum = parseInt(floorId.replace("floor_", "").replace("dungeon_", ""), 10);
  if (isNaN(floorNum)) return c.json({ error: "Invalid floor ID" }, 400);

  if (playerId.startsWith("0x")) {
    const hero = await agentChain.getHero(playerId as `0x${string}`);
    if (!hero) return c.json({ error: "Player not registered on-chain" }, 404);

    const success = await agentChain.recordFloorClear(playerId as `0x${string}`, BigInt(floorNum));
    if (success) {
      await agentChain.transitionFloor(BigInt(floorNum), playerId as `0x${string}`);
    }

    if (chain.isConfigured()) {
      try {
        const proofSignature = await chain.signFloorClear(playerId, floorId);
        await chain.submitClearFloor(playerId, floorId, proofSignature);
      } catch (err) {
        console.error("On-chain floor submission error:", err);
      }
    }

    const heroAfter = await agentChain.getHero(playerId as `0x${string}`);
    const ha = heroAfter as any | null;
    return c.json({
      success: true,
      floorId,
      floorNum,
      currentFloor: ha ? Number(ha.currentFloor) : floorNum,
      renown: ha ? Number(ha.renown) : 0,
    });
  }

  return c.json({ error: "Wallet address required" }, 400);
});

dungeonRoutes.post("/sync", async (c) => {
  const { walletAddress, floorId, signature } = await c.req.json();
  if (!walletAddress || !floorId || !signature) {
    return c.json({ error: "walletAddress, floorId, and signature required" }, 400);
  }

  try {
    await requireAuth(
      walletAddress,
      `13towers:sync:${walletAddress}:${floorId}:${Math.floor(Date.now() / 3600000)}`,
      signature,
    );
  } catch (err) {
    if (err instanceof AuthError) return c.json({ error: "Invalid signature" }, 403);
    throw err;
  }

  if (!chain.isConfigured()) {
    return c.json({ error: "Blockchain not configured" }, 503);
  }

  try {
    const proofSignature = await chain.signFloorClear(walletAddress, floorId);
    const success = await chain.submitClearFloor(walletAddress, floorId, proofSignature);
    return c.json({ success, synced: success });
  } catch (err) {
    console.error("Sync error:", err);
    return c.json({ error: "Sync failed" }, 500);
  }
});

dungeonRoutes.get("/floors", async (c) => {
  const floors = await agentChain.getAllFloors();
  if (!floors) return c.json({ error: "No floor data available" }, 503);
  return c.json(floors);
});

dungeonRoutes.get("/floor/:num", async (c) => {
  const num = parseInt(c.req.param("num"), 10);
  if (isNaN(num)) return c.json({ error: "Invalid floor number" }, 400);
  const floor = await agentChain.getFloorGovernance(BigInt(num));
  if (!floor) return c.json({ error: "Floor not found" }, 404);
  return c.json(floor);
});

dungeonRoutes.post("/difficulty", async (c) => {
  const { floor } = await c.req.json();
  if (floor === undefined) return c.json({ error: "floor required" }, 400);
  const spawn = await agentChain.getSpawnRecommendation(BigInt(floor));
  const aggro = await agentChain.shouldGroupAggro();
  if (!spawn) return c.json({ error: "Floor config not found" }, 404);
  const s = spawn as [bigint, bigint, bigint];
  return c.json({
    floor,
    enemyCount: Number(s[0]),
    hpMultiplier: Number(s[1]) / 100,
    damageMultiplier: Number(s[2]) / 100,
    groupAggro: aggro,
  });
});
