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

    if (!rateLimit(`claim:${playerId}`)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await requireAuth(playerId, `13towers:dungeon:claim:${floorId}`, signature);

    const player = db.getPlayer(playerId);
    const dungeon = db.getDungeon(floorId);

    if (!player || !dungeon) {
      return NextResponse.json({ error: "Player or floor not found" }, { status: 404 });
    }

    if (!player.clearedFloors.includes(floorId)) {
      return NextResponse.json({ error: "Floor not cleared yet" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bounty: dungeon.bounty,
      totalCredits: player.credits,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
