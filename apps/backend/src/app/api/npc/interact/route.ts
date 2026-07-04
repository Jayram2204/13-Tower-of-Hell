import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "../../../../lib/auth";
import { db } from "../../../../lib/database";
import { rateLimit } from "../../../../middleware/rateLimit";

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || "http://localhost:4000";

export async function POST(req: Request) {
  try {
    const { npcId, playerId, signature, playerInput } = await req.json();
    if (!npcId || !playerId) {
      return NextResponse.json(
        { error: "npcId and playerId required" },
        { status: 400 },
      );
    }

    if (!rateLimit(`npc:${playerId}`)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (signature) {
      try {
        await requireAuth(playerId, `13towers:npc:interact:${npcId}`, signature);
      } catch {
        // Allow unsigned requests for demo mode
      }
    }

    const npc = db.getNPC(npcId);
    if (!npc) {
      return NextResponse.json({ error: "NPC not found" }, { status: 404 });
    }

    try {
      const agentRes = await fetch(`${AGENT_SERVER_URL}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npcId, playerId, playerInput: playerInput || "Greetings." }),
      });

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        return NextResponse.json({
          success: true,
          source: "agent",
          npc: { id: npc.id, name: npc.name, type: npc.type },
          dialogue: agentData.dialogue || ["..."],
          actions: agentData.actions || [],
        });
      }
    } catch {
      // Agent server unavailable — fall through to static fallback
    }

    return NextResponse.json({
      success: true,
      source: "fallback",
      npc: { id: npc.id, name: npc.name, type: npc.type },
      dialogue: getFallbackDialog(npc.type),
      actions: [],
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function getFallbackDialog(type: string): string[] {
  const dialogs: Record<string, string[]> = {
    gatekeeper: [
      "Halt, stranger. I sense you are new here.",
      "Take this stipend — 100 credits. Spend wisely.",
    ],
    registrar: [
      "Your name will be etched in the ledger permanently.",
      "Choose carefully. Identity cannot be undone.",
    ],
    blacksmith: [
      "I am Durin. My prices shift with supply.",
      "Buy now before the cost rises.",
    ],
    mage: [
      "I am Lyra. The arcane flows through all things.",
      "My potions are the finest in the realm.",
    ],
    manager: [
      "I am Aldric. I oversee the town economy.",
      "The agents never sleep. Balance is maintained.",
    ],
    bounty: [
      "Bounties are posted. Rewards are real.",
      "Clear floors. Return with proof. Get paid.",
    ],
    merchant: [
      "Welcome! I have rare goods from across the realm.",
      "Looking for something special?",
    ],
  };
  return dialogs[type] || ["Greetings, traveler."];
}
