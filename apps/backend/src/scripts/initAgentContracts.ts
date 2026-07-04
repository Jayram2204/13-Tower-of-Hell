import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { npcRegistryABI } from "../abis/NPCRegistry";
import { enemyAgentABI } from "../abis/EnemyAgent";
import { trapAgentABI } from "../abis/TrapAgent";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadvision.com" },
  },
  testnet: true,
});

const pk = process.env.AGENT_ADMIN_PRIVATE_KEY as string;
const npcRegAddr = process.env.NPC_REGISTRY_ADDRESS as `0x${string}`;
const enemyAddr = process.env.ENEMY_AGENT_ADDRESS as `0x${string}`;
const trapAddr = process.env.TRAP_AGENT_ADDRESS as `0x${string}`;

if (!pk || !npcRegAddr || !enemyAddr || !trapAddr) {
  console.error("Missing env vars");
  process.exit(1);
}

const account = privateKeyToAccount(pk as `0x${string}`);
const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

async function write(addr: `0x${string}`, abi: readonly any[], fn: string, args: any[]) {
  const hash = await walletClient.writeContract({ address: addr, abi: abi as any[], functionName: fn, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${fn} failed`);
  console.log(`  OK ${fn}`);
}

const NPC_REGS = [
  { npcId: "teo_merchant", name: "TEO", npcType: 0, credits: 300_000n, priceMod: 105n },
  { npcId: "durin_blacksmith", name: "DURIN", npcType: 1, credits: 800_000n, priceMod: 100n },
  { npcId: "lyra_mage", name: "LYRA", npcType: 2, credits: 1_200_000n, priceMod: 120n },
  { npcId: "aldric_manager", name: "ALDRIC", npcType: 3, credits: 5_000_000n, priceMod: 100n },
  { npcId: "reaver_bounty", name: "REAVER", npcType: 4, credits: 2_500_000n, priceMod: 100n },
  { npcId: "gatekeeper", name: "GATEKEEPER", npcType: 5, credits: 1_000_000n, priceMod: 100n },
  { npcId: "registrar", name: "REGISTRAR", npcType: 6, credits: 500_000n, priceMod: 100n },
];

const DIFFICULTIES = [
  { floor: 1n, hp: 100n, dmg: 100n, spawn: 100n, aggro: 100n, count: 3n },
  { floor: 2n, hp: 120n, dmg: 115n, spawn: 110n, aggro: 110n, count: 4n },
  { floor: 3n, hp: 140n, dmg: 130n, spawn: 120n, aggro: 115n, count: 5n },
  { floor: 4n, hp: 160n, dmg: 145n, spawn: 130n, aggro: 120n, count: 5n },
  { floor: 5n, hp: 180n, dmg: 160n, spawn: 140n, aggro: 125n, count: 6n },
  { floor: 6n, hp: 200n, dmg: 175n, spawn: 150n, aggro: 130n, count: 6n },
  { floor: 7n, hp: 220n, dmg: 190n, spawn: 160n, aggro: 135n, count: 7n },
  { floor: 8n, hp: 250n, dmg: 210n, spawn: 170n, aggro: 140n, count: 7n },
  { floor: 9n, hp: 280n, dmg: 230n, spawn: 180n, aggro: 150n, count: 8n },
  { floor: 10n, hp: 310n, dmg: 250n, spawn: 190n, aggro: 160n, count: 8n },
  { floor: 11n, hp: 350n, dmg: 280n, spawn: 200n, aggro: 170n, count: 9n },
  { floor: 12n, hp: 400n, dmg: 310n, spawn: 220n, aggro: 180n, count: 9n },
  { floor: 13n, hp: 500n, dmg: 350n, spawn: 250n, aggro: 200n, count: 10n },
];

const TRAPS = [
  { trapId: "gateway_brambles", name: "Gateway Brambles", floor: 1n, resetMs: 30_000n, damage: 10n, pattern: 0 },
  { trapId: "flame_barrier", name: "Flame Barrier", floor: 4n, resetMs: 20_000n, damage: 20n, pattern: 1 },
  { trapId: "crystal_wall", name: "Crystal Wall", floor: 6n, resetMs: 25_000n, damage: 25n, pattern: 2 },
  { trapId: "shadow_gate", name: "Shadow Gate", floor: 8n, resetMs: 30_000n, damage: 30n, pattern: 3 },
  { trapId: "inferno_gate", name: "Inferno Gate", floor: 10n, resetMs: 35_000n, damage: 35n, pattern: 1 },
  { trapId: "doom_barrier", name: "Doom Barrier", floor: 12n, resetMs: 40_000n, damage: 40n, pattern: 3 },
];

async function main() {
  console.log("=== Seeding Agent Contracts ===\n");

  console.log("--- NPCs ---");
  for (const n of NPC_REGS) {
    await write(npcRegAddr, npcRegistryABI, "registerNPC", [n.npcId, n.name, n.npcType, n.credits, n.priceMod]);
  }

  console.log("\n--- Difficulty Configs (batch) ---");
  const floors = DIFFICULTIES.map(d => d.floor);
  const hps = DIFFICULTIES.map(d => d.hp);
  const dmgs = DIFFICULTIES.map(d => d.dmg);
  const spawns = DIFFICULTIES.map(d => d.spawn);
  const aggros = DIFFICULTIES.map(d => d.aggro);
  const counts = DIFFICULTIES.map(d => d.count);
  await write(enemyAddr, enemyAgentABI, "setDifficultyConfigsBatch", [floors, hps, dmgs, spawns, aggros, counts]);

  console.log("\n--- Traps ---");
  for (const t of TRAPS) {
    await write(trapAddr, trapAgentABI, "registerTrap", [t.trapId, t.name, t.floor, t.resetMs, t.damage, t.pattern]);
  }

  console.log("\n=== Seed complete ===");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
