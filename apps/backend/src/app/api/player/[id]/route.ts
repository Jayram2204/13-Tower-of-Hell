import { NextResponse } from "next/server";
import { db } from "../../../../lib/database";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const player = db.getPlayer(params.id);
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  const { createdAt, lastActive, walletAddress, ...safe } = player;
  return NextResponse.json(safe);
}
