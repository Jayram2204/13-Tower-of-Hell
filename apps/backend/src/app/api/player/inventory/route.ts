import { NextResponse } from "next/server";
import { requireAgentKey } from "../../../../lib/agentAuth";
import { db } from "../../../../lib/database";

export async function POST(req: Request) {
  const authErr = requireAgentKey(req);
  if (authErr) return authErr;

  try {
    const { playerId, itemId, quantity, action } = await req.json();
    if (!playerId || !itemId || !quantity || !action) {
      return NextResponse.json({ error: "playerId, itemId, quantity, and action required" }, { status: 400 });
    }

    const player = db.getPlayer(playerId);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (action === "add") {
      const existing = player.inventory.find((i) => i.id === itemId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        player.inventory.push({ id: itemId, name: itemId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), type: "misc", quantity });
      }
      db.setPlayer(playerId, player);
    } else if (action === "remove") {
      const existing = player.inventory.find((i) => i.id === itemId);
      if (!existing || existing.quantity < quantity) {
        return NextResponse.json({ error: "Insufficient items" }, { status: 400 });
      }
      existing.quantity -= quantity;
      if (existing.quantity <= 0) {
        player.inventory = player.inventory.filter((i) => i.id !== itemId);
      }
      db.setPlayer(playerId, player);
    } else {
      return NextResponse.json({ error: "Action must be 'add' or 'remove'" }, { status: 400 });
    }

    return NextResponse.json({ success: true, inventory: player.inventory });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
