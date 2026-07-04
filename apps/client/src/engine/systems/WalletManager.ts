import { type WalletClient, createWalletClient, custom } from "viem";

export const monadTestnet = {
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
} as const;

export class WalletManager {
  private walletClient: WalletClient | null = null;
  private _address: `0x${string}` | null = null;
  private listeners: Array<(address: `0x${string}` | null) => void> = [];
  private _connecting = false;

  get address(): `0x${string}` | null {
    return this._address;
  }

  get isConnected(): boolean {
    return this._address !== null;
  }

  get isConnecting(): boolean {
    return this._connecting;
  }

  get client(): WalletClient | null {
    return this.walletClient;
  }

  onConnectionChange(fn: (address: `0x${string}` | null) => void): void {
    this.listeners.push(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) {
      fn(this._address);
    }
  }

  async connect(): Promise<`0x${string}` | null> {
    if (this._connecting) return this._address;
    if (typeof window === "undefined" || !(window as any).ethereum) {
      console.warn("[WalletManager] No injected provider found");
      return null;
    }

    this._connecting = true;
    try {
      this.walletClient = createWalletClient({
        chain: monadTestnet,
        transport: custom((window as any).ethereum),
      });

      const [address] = await this.walletClient.requestAddresses();
      this._address = address.toLowerCase() as `0x${string}`;

      (window as any).ethereum?.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          this._address = null;
          this.walletClient = null;
        } else {
          this._address = accounts[0].toLowerCase() as `0x${string}`;
        }
        this.notify();
      });

      this.notify();
      return this._address;
    } catch (err) {
      console.error("[WalletManager] Connection failed:", err);
      return null;
    } finally {
      this._connecting = false;
    }
  }

  async signMessage(message: string): Promise<`0x${string}` | null> {
    if (!this.walletClient || !this._address) {
      console.warn("[WalletManager] Not connected");
      return null;
    }
    try {
      return await this.walletClient.signMessage({
        account: this._address,
        message,
      });
    } catch (err) {
      console.error("[WalletManager] Signing failed:", err);
      return null;
    }
  }

  disconnect(): void {
    this._address = null;
    this.walletClient = null;
    this.notify();
  }
}
