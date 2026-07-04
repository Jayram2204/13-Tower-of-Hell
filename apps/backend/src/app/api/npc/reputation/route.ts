import { NextResponse } from "next/server";
import { requireAgentKey } from "../../../../lib/agentAuth";
import { db } from "../../../../lib/database";

const reputations = new Map<string, number>();

export async function POST(req: Request) {
  const authErr = requireAgentKey(req);
  if (authErr) return authErr;

  try {
    const { playerId, npcId, delta } = await req.json();
    if (!playerId || !npcId || delta === undefined) {
      return NextResponse.json({ error: "playerId, npcId, and delta required" }, { status: 400 });
    }

    const npc = db.getNPC(npcId);
    if (!npc) {
      return NextResponse.json({ error: "NPC not found" }, { status: 404 });
    }

    const key = `${playerId}:${npcId}`;
    const current = reputations.get(key) || 0;
    const updated = Math.max(-10, Math.min(10, current + delta));
    reputations.set(key, updated);

    return NextResponse.json({ success: true, reputation: updated });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
