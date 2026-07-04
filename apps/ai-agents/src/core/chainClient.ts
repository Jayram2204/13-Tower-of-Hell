import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  testnet: true,
});

const RPC = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(RPC),
});

const pk = process.env.AGENT_ADMIN_PRIVATE_KEY || process.env.NPC_PRIVATE_KEY;

export function getWalletClient() {
  if (!pk) return null;
  return createWalletClient({
    account: privateKeyToAccount(pk as `0x${string}`),
    chain: monadTestnet,
    transport: http(RPC),
  });
}

export const ADDRESSES = {
  agentRegistry: process.env.AGENT_REGISTRY_ADDRESS as `0x${string}` | undefined,
  npcRegistry: process.env.NPC_REGISTRY_ADDRESS as `0x${string}` | undefined,
  coordinator: process.env.COORDINATOR_ADDRESS as `0x${string}` | undefined,
  worker: process.env.WORKER_AGENT_ADDRESS as `0x${string}` | undefined,
  hero: process.env.HERO_AGENT_ADDRESS as `0x${string}` | undefined,
  enemy: process.env.ENEMY_AGENT_ADDRESS as `0x${string}` | undefined,
  trap: process.env.TRAP_AGENT_ADDRESS as `0x${string}` | undefined,
  admin: process.env.ADMIN_AGENT_ADDRESS as `0x${string}` | undefined,
};
