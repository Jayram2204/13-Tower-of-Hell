import { NextResponse } from "next/server";

const AGENT_API_KEY = process.env.AGENT_API_KEY || "agent_secret_key";

export function requireAgentKey(req: Request): NextResponse | null {
  const key = req.headers.get("x-agent-key");
  if (!key || key !== AGENT_API_KEY) {
    return NextResponse.json({ error: "Invalid or missing agent key" }, { status: 403 });
  }
  return null;
}
