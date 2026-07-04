import { NextResponse } from "next/server";
import { requireAgentKey } from "../../../../lib/agentAuth";
import { db } from "../../../../lib/database";

export async function POST(req: Request) {
  const authErr = requireAgentKey(req);
  if (authErr) return authErr;

  try {
    const { playerId, floorId } = await req.json();
    if (!playerId || !floorId) {
      return NextResponse.json({ error: "playerId and floorId required" }, { status: 400 });
    }

    const player = db.getPlayer(playerId);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (player.clearedFloors.includes(floorId)) {
      return NextResponse.json({ success: true, alreadyUnlocked: true });
    }

    db.markFloorCleared(playerId, floorId);

    return NextResponse.json({
      success: true,
      floorId,
      credits: player.credits,
      clearedFloors: player.clearedFloors,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
