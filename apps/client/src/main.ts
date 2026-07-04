import { GameEngine } from "./engine/GameEngine";
import type { NPC } from "./engine/entities/NPC";
import { WalletManager } from "./engine/systems/WalletManager";
import { useGameStore } from "./state/gameStore";

const walletManager = new WalletManager();

class App {
  private engine: GameEngine | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (!canvas) return;

    this.engine = new GameEngine({
      canvas,
      onStatusChange: (status) => {
        const el = document.getElementById("status-display");
        if (el) el.textContent = status;
      },
      onFloorChange: (floor) => {
        const el = document.getElementById("floor-display");
        if (el) el.textContent = floor;
      },
      onStatsChange: () => {
        this.updateHUD();
      },
      onInteraction: (npc: NPC) => {
        // Legacy fallback — not used in dynamic mode
      },
      onNPCDialog: (npcId, npcName, dialogue) => {
        this.showNPCDialog(npcId, npcName, dialogue);
      },
      onOverlay: (title, desc, btnText) => {
        this.showOverlay(title, desc, btnText);
      },
      onQuestUpdate: (_id, _status) => {
        this.renderQuestLog();
      },
      onInventoryChange: () => {
        this.renderInventory();
      },
      onPlayerDeath: () => {
        this.showOverlay(
          "YOU DIED",
          "The darkness claims you... but the tower revives the worthy.\nYour renown and items are intact. Press on.",
          "RISE AGAIN",
        );
      },
      signMessage: (msg: string) => walletManager.signMessage(msg),
    });

    this.setupOverlay();
    this.setupDevControls();
    this.setupWalletWidget();
    this.setupMuteButton();

    this.engine.init().catch(console.error);

    const store = useGameStore.getState();
    if (walletManager.isConnected && walletManager.address) {
      const addr = walletManager.address.toLowerCase();
      store.setPlayerId(addr);
      store.setWalletAddress(addr);
    } else if (!store.playerId) {
      store.setPlayerId(`player_${Math.random().toString(36).substring(2, 8)}`);
    }

    this.showOverlay(
      "13 TOWERS OF HELL",
      "A world bound by shadow. Navigate the town, speak with the NPCs, and descend into the dungeons.\n\nUse A/D or Arrow Keys to move.\nPress W, Up, or Space to jump.\nPress E near NPCs to interact.\nPress F to attack with your weapon.\n\nTalk to TEO the merchant to begin your quest.",
      "BEGIN",
    );
  }

  private setupOverlay(): void {
    const btn = document.getElementById("overlay-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        this.hideOverlay();
        this.engine?.input.keys.add("click");
      });
    }
  }

  private setupDevControls(): void {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === "KeyR") {
        this.handleRegistration();
      }
    };
    window.addEventListener("keydown", keyHandler);
  }

  private async handleRegistration(): Promise<void> {
    const store = useGameStore.getState();
    const name = store.playerName || "Wanderer";
    const playerId = walletManager.isConnected ? walletManager.address!.toLowerCase() : store.playerId;

    let signature = "";
    if (walletManager.isConnected) {
      const message = `13towers:player:register:${name}:${Math.floor(Date.now() / 60000)}`;
      const sig = await walletManager.signMessage(message);
      if (sig) signature = sig;
    }

    const result = await this.engine?.networkManager.registerPlayer(
      name,
      playerId,
      signature,
    );
    console.log("[Registration]", result);
  }

  private setupMuteButton(): void {
    const btn = document.getElementById("mute-btn");
    if (!btn || !this.engine) return;
    btn.addEventListener("click", () => {
      this.engine!.soundManager.toggleMute();
      btn.textContent = this.engine!.soundManager.muted ? "♫ MUTED" : "♫ MUSIC";
      btn.classList.toggle("muted", this.engine!.soundManager.muted);
    });
  }

  private setupWalletWidget(): void {
    const widget = document.getElementById("wallet-widget");
    const dot = document.getElementById("wallet-dot");
    const addrEl = document.getElementById("wallet-address");
    if (!widget || !dot || !addrEl) return;

    const updateWidget = (address: string | null) => {
      if (address) {
        addrEl.textContent = `${address.substring(0, 6)}...${address.substring(38)}`;
        widget.classList.add("connected");
        dot.className = "connected";
      } else {
        addrEl.textContent = "Connect Wallet";
        widget.classList.remove("connected");
        dot.className = "";
      }
    };

    walletManager.onConnectionChange(updateWidget);

    if (walletManager.isConnected) {
      updateWidget(walletManager.address);
    }

    widget.addEventListener("click", async () => {
      if (walletManager.isConnected) return;
      dot.className = "connecting";
      addrEl.textContent = "Connecting...";
      const address = await walletManager.connect();
      if (address) {
        const addr = address.toLowerCase();
        const store = useGameStore.getState();
        store.setPlayerId(addr);
        store.setWalletAddress(addr);
      } else {
        addrEl.textContent = "No Wallet Found";
        dot.className = "";
        setTimeout(() => {
          addrEl.textContent = "Connect Wallet";
        }, 2000);
      }
    });
  }

  private currentNPCId: string | null = null;

  private showNPCDialog(npcId: string, npcName: string, dialogue: string[]): void {
    this.currentNPCId = npcId;
    const dialog = document.getElementById("npc-dialog");
    const nameEl = document.getElementById("npc-dialog-name");
    const textEl = document.getElementById("npc-dialog-text");
    const input = document.getElementById("npc-dialog-input") as HTMLInputElement;
    if (!dialog || !nameEl || !textEl || !input) return;

    nameEl.textContent = npcName;
    textEl.textContent = dialogue.join("\n\n");
    input.value = "";
    dialog.classList.add("visible");
    input.focus();

    const sendBtn = document.getElementById("npc-dialog-send");
    const onSend = async () => {
      const msg = input.value.trim();
      if (!msg) return;
      input.value = "";
      textEl.textContent = "Thinking...";

      if (!this.engine) return;
      const store = useGameStore.getState();
      const result = await this.engine.networkManager.dispatchAgentInteraction(
        store.walletAddress || "offline",
        npcId,
        msg,
      );
      textEl.textContent = result.dialogue.join("\n\n");

      for (const action of result.actions) {
        if (action.tool === "grant_item") {
          store.addItem(String(action.args.itemId ?? ""), String(action.args.itemId ?? ""), Number(action.args.quantity ?? 1));
        } else if (action.tool === "unlock_portal") {
          store.unlockPortal(Number(action.args.floor ?? store.currentFloor + 1));
        }
      }
      this.updateHUD();
      this.renderInventory();
    };

    sendBtn?.removeEventListener("click", onSend);
    sendBtn?.addEventListener("click", onSend);

    input.onkeydown = (e) => {
      if (e.key === "Enter") onSend();
      if (e.key === "Escape") this.hideNPCDialog();
    };
  }

  private hideNPCDialog(): void {
    const dialog = document.getElementById("npc-dialog");
    if (dialog) dialog.classList.remove("visible");
    this.currentNPCId = null;
  }

  private async showNamePrompt(): Promise<void> {
    const store = useGameStore.getState();
    const current = store.playerName || "---";
    const name = window.prompt("Enter your name (once set, it cannot be changed):", current);
    if (!name || name.trim().length === 0) return;

    const trimmed = name.trim().substring(0, 16);
    store.setPlayerName(trimmed);

    const playerId = walletManager.isConnected ? walletManager.address!.toLowerCase() : store.playerId;

    let signature = "";
    if (walletManager.isConnected) {
      const message = `13towers:player:register:${trimmed}:${Math.floor(Date.now() / 60000)}`;
      const sig = await walletManager.signMessage(message);
      if (sig) signature = sig;
    }

    const result = await this.engine?.networkManager.registerPlayer(
      trimmed,
      playerId,
      signature,
    );

    const walletLine = walletManager.isConnected
      ? `\nWallet: ${walletManager.address?.substring(0, 6)}...${walletManager.address?.substring(38)}`
      : "";

    this.showOverlay(
      "IDENTITY LOCKED",
      `Your name "${trimmed}" has been recorded.\nIt is permanently bound to your identity.${walletLine}`,
      "UNDERSTOOD",
    );
  }

  private updateHUD(): void {
    const store = useGameStore.getState();
    const nameEl = document.getElementById("player-name");
    const floorEl = document.getElementById("floor-display");
    const hpBar = document.getElementById("hp-bar");
    const staminaBar = document.getElementById("stamina-bar");
    const renownBar = document.getElementById("renown-bar");
    const hpText = document.getElementById("hp-text");
    const staminaText = document.getElementById("stamina-text");
    const renownText = document.getElementById("renown-text");

    if (nameEl) nameEl.textContent = store.playerName || "---";
    if (hpBar) hpBar.style.width = `${(store.hp / store.maxHp) * 100}%`;
    if (staminaBar) staminaBar.style.width = `${(store.stamina / store.maxStamina) * 100}%`;
    if (renownBar) renownBar.style.width = `${Math.min(store.towerRenown / 500, 1) * 100}%`;
    if (hpText) hpText.textContent = `${Math.floor(store.hp)}/${store.maxHp}`;
    if (staminaText) staminaText.textContent = `${Math.floor(store.stamina)}/${store.maxStamina}`;
    if (renownText) renownText.textContent = store.towerRenown.toString();
  }

  private renderInventory(): void {
    const store = useGameStore.getState();
    const el = document.getElementById("inventory-list");
    if (!el) return;

    if (store.inventory.length === 0) {
      el.innerHTML = "";
      return;
    }

    el.innerHTML = store.inventory
      .map((item) => `<div class="item">• ${item.name} x${item.quantity}</div>`)
      .join("");
  }

  private renderQuestLog(): void {
    const el = document.getElementById("quest-log");
    if (!el || !this.engine) return;

    const quests = this.engine.questManager.getActiveQuests();
    el.innerHTML = quests
      .map(
        (q) =>
          `<div class="quest-item ${q.status}">${q.status === "completed" ? "✓" : q.status === "active" ? "▶" : "○"} ${q.name}</div>`,
      )
      .join("");
  }

  private showOverlay(title: string, desc: string, btnText: string): void {
    const overlay = document.getElementById("overlay-screen");
    const titleEl = document.getElementById("overlay-title");
    const descEl = document.getElementById("overlay-desc");
    const btnEl = document.getElementById("overlay-btn");

    if (titleEl) titleEl.textContent = title;
    if (descEl) {
      descEl.innerHTML = desc.replace(/\n/g, "<br>");
    }
    if (btnEl) btnEl.textContent = btnText;
    if (overlay) overlay.classList.add("visible");
  }

  private hideOverlay(): void {
    const overlay = document.getElementById("overlay-screen");
    if (overlay) overlay.classList.remove("visible");
  }
}

new App();
