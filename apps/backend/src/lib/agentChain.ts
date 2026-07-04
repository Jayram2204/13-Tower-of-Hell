import {
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  keccak256,
  toHex,
  encodeFunctionData,
  decodeAbiParameters,
  encodeAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { agentRegistryABI } from "../abis/AgentRegistry";
import { npcRegistryABI } from "../abis/NPCRegistry";
import { coordinatorAgentABI } from "../abis/CoordinatorAgent";
import { workerAgentABI } from "../abis/WorkerAgent";
import { heroAgentABI } from "../abis/HeroAgent";
import { enemyAgentABI } from "../abis/EnemyAgent";
import { trapAgentABI } from "../abis/TrapAgent";
import { adminAgentABI } from "../abis/AdminAgent";

export const monadTestnet = defineChain({
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

const ADDR = {
  agentRegistry: process.env.AGENT_REGISTRY_ADDRESS as `0x${string}` | undefined,
  npcRegistry: process.env.NPC_REGISTRY_ADDRESS as `0x${string}` | undefined,
  coordinator: process.env.COORDINATOR_ADDRESS as `0x${string}` | undefined,
  worker: process.env.WORKER_AGENT_ADDRESS as `0x${string}` | undefined,
  hero: process.env.HERO_AGENT_ADDRESS as `0x${string}` | undefined,
  enemy: process.env.ENEMY_AGENT_ADDRESS as `0x${string}` | undefined,
  trap: process.env.TRAP_AGENT_ADDRESS as `0x${string}` | undefined,
  admin: process.env.ADMIN_AGENT_ADDRESS as `0x${string}` | undefined,
};

const MONAD_RPC = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const AGENT_ADMIN_KEY = process.env.AGENT_ADMIN_PRIVATE_KEY || process.env.NPC_PRIVATE_KEY;

export const publicClient: PublicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC),
});

let walletClient: WalletClient | null = null;

function requireAddr(key: keyof typeof ADDR): `0x${string}` {
  const addr = ADDR[key];
  if (!addr) throw new Error(`${key.toUpperCase()}_ADDRESS not set`);
  return addr;
}

function initWallet(): void {
  if (!AGENT_ADMIN_KEY) {
    console.warn("No agent admin private key set — write mode disabled");
    return;
  }
  walletClient = createWalletClient({
    account: privateKeyToAccount(AGENT_ADMIN_KEY as `0x${string}`),
    chain: monadTestnet,
    transport: http(MONAD_RPC),
  });
}

function hashId(id: string): `0x${string}` {
  return keccak256(toHex(id));
}

function isConfigured(): boolean {
  return !!ADDR.agentRegistry && !!walletClient;
}

// --- Agent Registry ---

async function registerAgent(
  agentId: string,
  agentType: number,
  contractAddress: `0x${string}`,
  adminAddress: `0x${string}`,
): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("agentRegistry"),
      abi: agentRegistryABI,
      functionName: "registerAgent",
      args: [hashId(agentId), agentType, contractAddress, adminAddress, "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch (err) {
    console.error(`registerAgent failed:`, err);
    return false;
  }
}

async function sendHeartbeat(agentId: string, status: number): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("agentRegistry"),
      abi: agentRegistryABI,
      functionName: "heartbeat",
      args: [hashId(agentId), status],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

// --- NPC Registry ---

async function registerNPC(
  npcId: string,
  name: string,
  npcType: number,
  initialCredits: bigint,
  initialPriceModifier: bigint,
): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("npcRegistry"),
      abi: npcRegistryABI,
      functionName: "registerNPC",
      args: [npcId, name, npcType, initialCredits, initialPriceModifier],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch (err) {
    console.error(`registerNPC ${npcId} failed:`, err);
    return false;
  }
}

const npcStateComponents = [
  { name: "npcId", type: "string" },
  { name: "name", type: "string" },
  { name: "npcType", type: "uint8" },
  { name: "credits", type: "uint256" },
  { name: "priceModifier", type: "uint256" },
  { name: "reputation", type: "int256" },
  { name: "isActive", type: "bool" },
  { name: "lastAction", type: "uint256" },
  { name: "lastHeartbeat", type: "uint256" },
  { name: "totalInteractions", type: "uint256" },
];

async function getNPC(npcId: string) {
  try {
    const sel = keccak256(toHex("getNPC(string)")).slice(0, 10);
    const encArgs = encodeAbiParameters(
      [{ type: "string" }],
      [npcId],
    );
    const { data } = await publicClient.call({
      to: requireAddr("npcRegistry"),
      data: (sel + encArgs.slice(2)) as `0x${string}`,
    });
    if (!data) return null;
    const decoded = decodeAbiParameters(
      [{ type: "tuple", components: npcStateComponents }],
      data,
    );
    return decoded[0];
  } catch {
    return null;
  }
}

const heroStateComponents = [
  { name: "playerAddress", type: "address" },
  { name: "playerName", type: "string" },
  { name: "currentFloor", type: "uint256" },
  { name: "renown", type: "uint256" },
  { name: "totalFloorsCleared", type: "uint256" },
  { name: "totalDeaths", type: "uint256" },
  { name: "totalEnemiesKilled", type: "uint256" },
  { name: "lastActive", type: "uint256" },
  { name: "registeredAt", type: "uint256" },
  { name: "exists", type: "bool" },
];

async function getHero(player: `0x${string}`) {
  try {
    const sel = keccak256(toHex("getHero(address)")).slice(0, 10);
    const encArgs = encodeAbiParameters(
      [{ type: "address" }],
      [player],
    );
    const { data } = await publicClient.call({
      to: requireAddr("hero"),
      data: (sel + encArgs.slice(2)) as `0x${string}`,
    });
    if (!data) return null;
    const decoded = decodeAbiParameters(
      [{ type: "tuple", components: heroStateComponents }],
      data,
    );
    return decoded[0];
  } catch {
    return null;
  }
}

async function getNPCInventory(npcId: string) {
  try {
    return await publicClient.readContract({
      address: requireAddr("npcRegistry"),
      abi: npcRegistryABI,
      functionName: "getNPCInventory",
      args: [npcId],
    });
  } catch {
    return [];
  }
}

async function updateNPCCredits(npcId: string, credits: bigint): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("npcRegistry"),
      abi: npcRegistryABI,
      functionName: "updateCredits",
      args: [npcId, credits],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

async function updateNPCReputation(npcId: string, delta: bigint): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("npcRegistry"),
      abi: npcRegistryABI,
      functionName: "updateReputation",
      args: [npcId, delta],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

async function addNPCInventory(
  npcId: string,
  itemId: string,
  itemName: string,
  itemType: string,
  quantity: bigint,
): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("npcRegistry"),
      abi: npcRegistryABI,
      functionName: "addInventory",
      args: [npcId, itemId, itemName, itemType, quantity],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

// --- Worker Agent ---

async function runEconomyTick(npcId: string, supply: bigint, demand: bigint): Promise<{ priceModifier: bigint; credits: bigint } | null> {
  if (!walletClient?.account) return null;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("worker"),
      abi: workerAgentABI,
      functionName: "runEconomyTick",
      args: [npcId, supply, demand],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") return null;
    const state = await publicClient.readContract({
      address: requireAddr("worker"),
      abi: workerAgentABI,
      functionName: "getEconomicState",
      args: [npcId],
    }) as [string, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
    return { priceModifier: state[2], credits: state[1] };
  } catch {
    return null;
  }
}

async function settleMicrotransaction(npcId: string, player: `0x${string}`, amount: bigint, itemId: string): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("worker"),
      abi: workerAgentABI,
      functionName: "settleMicrotransaction",
      args: [npcId, player, amount, itemId],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

// --- Hero Agent ---

async function registerHero(player: `0x${string}`, name: string): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("hero"),
      abi: heroAgentABI,
      functionName: "registerHero",
      args: [player, name],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch (err) {
    console.error("registerHero failed:", err);
    return false;
  }
}

async function recordFloorClear(player: `0x${string}`, floor: bigint): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("hero"),
      abi: heroAgentABI,
      functionName: "recordFloorClear",
      args: [player, floor],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

async function recordEnemyKill(player: `0x${string}`): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("hero"),
      abi: heroAgentABI,
      functionName: "recordEnemyKill",
      args: [player],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

// --- Enemy Agent ---

async function getSpawnRecommendation(floor: bigint) {
  try {
    return await publicClient.readContract({
      address: requireAddr("enemy"),
      abi: enemyAgentABI,
      functionName: "getSpawnRecommendation",
      args: [floor],
    });
  } catch {
    return null;
  }
}

async function shouldGroupAggro(): Promise<boolean> {
  try {
    return await publicClient.readContract({
      address: requireAddr("enemy"),
      abi: enemyAgentABI,
      functionName: "shouldGroupAggro",
      args: [],
    });
  } catch {
    return false;
  }
}

// --- Trap Agent ---

async function getTrapState(trapId: string) {
  try {
    return await publicClient.readContract({
      address: requireAddr("trap"),
      abi: trapAgentABI,
      functionName: "getTrap",
      args: [trapId],
    });
  } catch {
    return null;
  }
}

async function triggerTrap(trapId: string): Promise<bigint | null> {
  if (!walletClient?.account) return null;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("trap"),
      abi: trapAgentABI,
      functionName: "triggerTrap",
      args: [trapId],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") return null;
    return await publicClient.readContract({
      address: requireAddr("trap"),
      abi: trapAgentABI,
      functionName: "getTrap",
      args: [trapId],
    }) as unknown as bigint;
  } catch {
    return null;
  }
}

// --- Admin Agent ---

async function getFloorGovernance(floor: bigint) {
  try {
    return await publicClient.readContract({
      address: requireAddr("admin"),
      abi: adminAgentABI,
      functionName: "getFloor",
      args: [floor],
    });
  } catch {
    return null;
  }
}

async function getAllFloors() {
  try {
    return await publicClient.readContract({
      address: requireAddr("admin"),
      abi: adminAgentABI,
      functionName: "getAllFloors",
      args: [],
    });
  } catch {
    return null;
  }
}

async function transitionFloor(floor: bigint, player: `0x${string}`): Promise<boolean> {
  if (!walletClient?.account) return false;
  try {
    const hash = await walletClient.writeContract({
      address: requireAddr("admin"),
      abi: adminAgentABI,
      functionName: "transitionFloor",
      args: [floor, player],
      account: walletClient.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === "success";
  } catch {
    return false;
  }
}

async function canAccessFloor(floor: bigint, renown: bigint) {
  try {
    return await publicClient.readContract({
      address: requireAddr("admin"),
      abi: adminAgentABI,
      functionName: "canAccessFloor",
      args: [floor, renown],
    });
  } catch {
    return [false, "Read failed"];
  }
}

initWallet();

export const agentChain = {
  isConfigured,
  monadTestnet,

  // Registry
  registerAgent,
  sendHeartbeat,

  // NPC
  registerNPC,
  getNPC,
  getNPCInventory,
  updateNPCCredits,
  updateNPCReputation,
  addNPCInventory,

  // Worker
  runEconomyTick,
  settleMicrotransaction,

  // Hero
  registerHero,
  recordFloorClear,
  recordEnemyKill,
  getHero,

  // Enemy
  getSpawnRecommendation,
  shouldGroupAggro,

  // Trap
  getTrapState,
  triggerTrap,

  // Admin
  getFloorGovernance,
  getAllFloors,
  transitionFloor,
  canAccessFloor,
};
