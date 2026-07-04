import { NextResponse } from "next/server";
import { requireAgentKey } from "../../../../lib/agentAuth";
import { db } from "../../../../lib/database";

const questTemplates: Record<string, { title: string; description: string; reward: number; condition: string }> = {
  first_floor: {
    title: "First Steps",
    description: "Clear the first dungeon floor and prove your worth.",
    reward: 100,
    condition: "clear_dungeon_1",
  },
  gather_berries: {
    title: "Gather Glow Berries",
    description: "Collect glow berries from the eastern platforms.",
    reward: 50,
    condition: "has_item_glow_berry_3",
  },
  rusty_axe: {
    title: "The Rusty Axe",
    description: "Find the rusty axe to clear the gateway brambles.",
    reward: 75,
    condition: "has_item_rusty_axe_1",
  },
  speak_with_smith: {
    title: "Speak with Durin",
    description: "Visit the blacksmith and see what wares he offers.",
    reward: 30,
    condition: "interact_blacksmith",
  },
};

export async function POST(req: Request) {
  const authErr = requireAgentKey(req);
  if (authErr) return authErr;

  try {
    const { playerId, template } = await req.json();
    if (!playerId || !template) {
      return NextResponse.json({ error: "playerId and template required" }, { status: 400 });
    }

    const player = db.getPlayer(playerId);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const quest = questTemplates[template] || {
      title: "Custom Quest",
      description: template,
      reward: 50,
      condition: "custom",
    };

    return NextResponse.json({
      success: true,
      quest: {
        id: `quest_${Date.now()}`,
        title: quest.title,
        description: quest.description,
        reward: quest.reward,
        condition: quest.condition,
        playerId,
        issuedAt: Date.now(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
