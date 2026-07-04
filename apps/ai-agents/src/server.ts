import http from "node:http";
import { getCoordinator } from "./agents/agent-lifecycle";
import { LLMAgent } from "./agents/LLMAgent";

const PORT = parseInt(process.env.AGENT_PORT || "4000", 10);
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-placeholder";

const llmAgents = new Map<string, LLMAgent>();

function getLLMAgent(npcId: string): LLMAgent {
  let agent = llmAgents.get(npcId);
  if (!agent) {
    agent = new LLMAgent({
      npcId,
      npcName: npcId,
      backendUrl: BACKEND_URL,
      llmApiKey: OPENAI_API_KEY,
    });
    llmAgents.set(npcId, agent);
  }
  return agent;
}

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Agent-Key");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/interact") {
    try {
      const body = await parseBody(req);
      const { npcId, playerId, playerInput } = body as {
        npcId: string;
        playerId: string;
        playerInput: string;
      };

      if (!npcId || !playerId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "npcId and playerId required" }));
        return;
      }

      const agent = getLLMAgent(npcId);
      const result = await agent.processInteraction(
        playerId,
        playerInput || "Greetings.",
        {
          playerId,
          playerRenown: 0,
          playerFloor: 0,
          inventory: [],
          floorState: {},
        },
      );

      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error("[AgentServer] interact error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Agent processing failed" }));
    }
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    const coordinator = getCoordinator();
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", agents: coordinator ? "running" : "starting" }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

export function startAgentServer(): Promise<void> {
  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[AgentServer] Listening on http://localhost:${PORT}`);
      resolve();
    });
  });
}
