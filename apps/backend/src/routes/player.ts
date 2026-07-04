import { Hono } from "hono";
import { AuthError, requireAuth } from "../lib/auth";
import { chain } from "../lib/blockchain";
import { agentChain } from "../lib/agentChain";

export const playerRoutes = new Hono();

playerRoutes.post("/register", async (c) => {
  const { name, walletAddress, signature, timestamp } = await c.req.json();

  if (!name || typeof name !== "string") {
    return c.json({ error: "Name required" }, 400);
  }

  const trimmed = name.trim().substring(0, 16);

  if (walletAddress && signature) {
    try {
      const message = `13towers:player:register:${trimmed}:${timestamp || Math.floor(Date.now() / 60000)}`;
      await requireAuth(walletAddress, message, signature);
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json({ error: "Invalid signature" }, 403);
      }
      throw err;
    }

    const onChain = await chain.registerPlayer(walletAddress, trimmed);
    if (onChain) {
      await agentChain.registerHero(walletAddress as `0x${string}`, trimmed);
    } else {
      console.warn("[Player] On-chain registration failed");
    }
  }

  return c.json({
    success: true,
    playerId: walletAddress || `anon_${Date.now()}`,
    name: trimmed,
    walletAddress: walletAddress || null,
  });
});

playerRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (id.startsWith("0x")) {
    const hero = await agentChain.getHero(id as `0x${string}`);
    if (hero) {
      const h = hero as any;
      return c.json({
        id: h.playerAddress,
        name: h.playerName,
        currentFloor: Number(h.currentFloor),
        renown: Number(h.renown),
        clearedFloors: Number(h.totalFloorsCleared),
        deaths: Number(h.totalDeaths),
        enemiesKilled: Number(h.totalEnemiesKilled),
        lastActive: Number(h.lastActive) * 1000,
      });
    }
  }
  return c.json({ error: "Player not found" }, 404);
});
