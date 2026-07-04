import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "../../../../lib/auth";
import { db } from "../../../../lib/database";
import { rateLimit } from "../../../../middleware/rateLimit";

export async function POST(req: Request) {
  try {
    const { playerId, floorId, signature } = await req.json();
    if (!playerId || !floorId || !signature) {
      return NextResponse.json(
        { error: "playerId, floorId, and signature required" },
        { status: 400 },
      );
    }

    if (!rateLimit(`verify:${playerId}`)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await requireAuth(playerId, `13towers:dungeon:verify:${floorId}`, signature);

    const player = db.getPlayer(playerId);
    const dungeon = db.getDungeon(floorId);

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    if (!dungeon) {
      return NextResponse.json({ error: "Dungeon floor not found" }, { status: 404 });
    }

    if (player.clearedFloors.includes(floorId)) {
      return NextResponse.json({ success: true, alreadyCleared: true, credits: player.credits });
    }

    db.markFloorCleared(playerId, floorId);

    return NextResponse.json({
      success: true,
      floorId,
      bounty: dungeon.bounty,
      credits: player.credits,
      clearedFloors: player.clearedFloors,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
