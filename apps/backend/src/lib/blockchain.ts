import {
  http,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  defineChain,
  keccak256,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { characterRegistryABI } from "../abis/CharacterRegistry";
import { dungeonProgressABI } from "../abis/DungeonProgress";

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

const CONTRACT_ADDRESSES = {
  characterRegistry: (process.env.CHARACTER_REGISTRY_ADDRESS || "") as `0x${string}`,
  dungeonProgress: (process.env.DUNGEON_PROGRESS_ADDRESS || "") as `0x${string}`,
};

const MONAD_RPC = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

export const publicClient: PublicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC),
});

let walletClient: WalletClient | null = null;

function initWallet(): void {
  const pk = process.env.NPC_PRIVATE_KEY;
  if (!pk) {
    console.warn("No NPC_PRIVATE_KEY set — blockchain write mode disabled");
    return;
  }
  const account = privateKeyToAccount(pk as `0x${string}`);
  walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(MONAD_RPC),
  });
}

function getDungeonAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESSES.dungeonProgress) throw new Error("DUNGEON_PROGRESS_ADDRESS not set");
  return CONTRACT_ADDRESSES.dungeonProgress;
}

function getRegistryAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESSES.characterRegistry) throw new Error("CHARACTER_REGISTRY_ADDRESS not set");
  return CONTRACT_ADDRESSES.characterRegistry;
}

export const chain = {
  initWallet,
  monadTestnet,

  async isFloorCleared(walletAddress: string, floorId: string): Promise<boolean> {
    if (!CONTRACT_ADDRESSES.dungeonProgress) return false;
    try {
      const data = await publicClient.readContract({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        functionName: "getFloorProgress",
        args: [walletAddress as `0x${string}`, floorId],
      });
      return (data as [bigint, bigint])[0] > 0n;
    } catch (err) {
      console.error("Failed to read floor progress:", err);
      return false;
    }
  },

  async getFloorProgressDetails(
    walletAddress: string,
    floorId: string,
  ): Promise<{ clearedAt: bigint; bountyClaimed: bigint } | null> {
    if (!CONTRACT_ADDRESSES.dungeonProgress) return null;
    try {
      const data = await publicClient.readContract({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        functionName: "getFloorProgress",
        args: [walletAddress as `0x${string}`, floorId],
      });
      const [clearedAt, bountyClaimed] = data as [bigint, bigint];
      return { clearedAt, bountyClaimed };
    } catch {
      return null;
    }
  },

  async getFloorBounty(floorId: string): Promise<bigint | null> {
    if (!CONTRACT_ADDRESSES.dungeonProgress) return null;
    try {
      const id = keccak256(toHex(floorId));
      const bounty = await publicClient.readContract({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        functionName: "floorBounties",
        args: [id],
      });
      return bounty as bigint;
    } catch (err) {
      console.error("Failed to get floor bounty:", err);
      return null;
    }
  },

  async getTotalFloorsCleared(walletAddress: string): Promise<number> {
    if (!CONTRACT_ADDRESSES.dungeonProgress) return 0;
    try {
      const count = await publicClient.readContract({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        functionName: "getTotalFloorsCleared",
        args: [walletAddress as `0x${string}`],
      });
      return Number(count);
    } catch {
      return 0;
    }
  },

  async signFloorClear(playerAddress: string, floorId: string): Promise<string> {
    if (!walletClient) throw new Error("Wallet not initialized");
    const message = keccak256(
      toHex(`${playerAddress}${floorId}${Math.floor(Date.now() / 3600000)}`),
    );
    const signature = await walletClient.signMessage({
      account: walletClient.account!,
      message,
    });
    return signature;
  },

  async submitClearFloor(
    playerAddress: string,
    floorId: string,
    signature: string,
  ): Promise<boolean> {
    if (!walletClient || !walletClient.account) return false;
    try {
      const hash = await walletClient.writeContract({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        functionName: "clearFloor",
        args: [floorId, signature as `0x${string}`],
        account: walletClient.account,
        chain: null,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === "success";
    } catch (err) {
      console.error("Failed to submit clearFloor:", err);
      return false;
    }
  },

  async isRegistered(walletAddress: string): Promise<boolean> {
    if (!CONTRACT_ADDRESSES.characterRegistry) return false;
    try {
      return await publicClient.readContract({
        address: getRegistryAddress(),
        abi: characterRegistryABI,
        functionName: "isRegistered",
        args: [walletAddress as `0x${string}`],
      });
    } catch {
      return false;
    }
  },

  async registerPlayer(walletAddress: string, name: string): Promise<boolean> {
    if (!walletClient || !walletClient.account) return false;
    try {
      const hash = await walletClient.writeContract({
        address: getRegistryAddress(),
        abi: characterRegistryABI,
        functionName: "register",
        args: [name],
        account: walletClient.account,
        chain: null,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === "success";
    } catch (err) {
      console.error("Blockchain registration failed:", err);
      return false;
    }
  },

  async getPlayerName(walletAddress: string): Promise<string | null> {
    if (!CONTRACT_ADDRESSES.characterRegistry) return null;
    try {
      return await publicClient.readContract({
        address: getRegistryAddress(),
        abi: characterRegistryABI,
        functionName: "getName",
        args: [walletAddress as `0x${string}`],
      });
    } catch {
      return null;
    }
  },

  async claimBounty(floorId: string): Promise<boolean> {
    if (!walletClient || !walletClient.account) return false;
    try {
      const hash = await walletClient.writeContract({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        functionName: "claimBounty",
        args: [floorId],
        account: walletClient.account,
        chain: null,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === "success";
    } catch (err) {
      console.error("Failed to claim bounty:", err);
      return false;
    }
  },

  async getFloorClearedEvents(fromBlock?: bigint, toBlock?: bigint) {
    if (!CONTRACT_ADDRESSES.dungeonProgress) return [];
    try {
      const logs = await publicClient.getContractEvents({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        eventName: "FloorCleared",
        fromBlock,
        toBlock,
      });
      return logs.map((log) => ({
        player: log.args.player as `0x${string}`,
        floorId: log.args.floorId as `0x${string}`,
        timestamp: log.args.timestamp as bigint,
        blockNumber: log.blockNumber,
      }));
    } catch (err) {
      console.error("Failed to get FloorCleared events:", err);
      return [];
    }
  },

  async getBountyClaimedEvents(fromBlock?: bigint, toBlock?: bigint) {
    if (!CONTRACT_ADDRESSES.dungeonProgress) return [];
    try {
      const logs = await publicClient.getContractEvents({
        address: getDungeonAddress(),
        abi: dungeonProgressABI,
        eventName: "BountyClaimed",
        fromBlock,
        toBlock,
      });
      return logs.map((log) => ({
        player: log.args.player as `0x${string}`,
        floorId: log.args.floorId as `0x${string}`,
        amount: log.args.amount as bigint,
        blockNumber: log.blockNumber,
      }));
    } catch (err) {
      console.error("Failed to get BountyClaimed events:", err);
      return [];
    }
  },

  isConfigured(): boolean {
    return !!(CONTRACT_ADDRESSES.dungeonProgress && CONTRACT_ADDRESSES.characterRegistry);
  },
};

initWallet();
