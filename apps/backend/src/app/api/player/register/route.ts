import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { AuthError, requireAuth } from "../../../../lib/auth";
import { db } from "../../../../lib/database";
import { rateLimit } from "../../../../middleware/rateLimit";

export async function POST(req: Request) {
  try {
    const { name, playerId, signature } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    if (!playerId || !signature) {
      return NextResponse.json({ error: "playerId and signature required" }, { status: 400 });
    }

    if (!rateLimit(`register:${playerId}`)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await requireAuth(playerId, `13towers:player:register:${name}`, signature);

    const trimmed = name.trim().substring(0, 16);
    const player = db.createPlayer(playerId, trimmed);

    return NextResponse.json({
      success: true,
      playerId: player.id,
      name: player.name,
      credits: player.credits,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
