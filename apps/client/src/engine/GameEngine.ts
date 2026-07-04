import { useGameStore } from "../state/gameStore";
import { Camera } from "./Camera";
import { InputManager } from "./InputManager";
import { Vector2 } from "./Vector2";
import type { Enemy } from "./entities/Enemy";
import type { NPC } from "./entities/NPC";
import type { Obstacle } from "./entities/Obstacle";
import { Pickup } from "./entities/Pickup";
import type { Platform } from "./entities/Platform";
import { Player } from "./entities/Player";
import type { Portal } from "./entities/Portal";
import { ParallaxBackground } from "./rendering/ParallaxBackground";
import { ParticleSystem } from "./rendering/ParticleSystem";
import { SilhouetteRenderer } from "./rendering/SilhouetteRenderer";
import { DungeonManager } from "./systems/DungeonManager";
import { NetworkManager } from "./systems/NetworkManager";
import { QuestManager } from "./systems/QuestManager";
import { SoundManager } from "./systems/SoundManager";

export interface GameConfig {
  canvas: HTMLCanvasElement;
  onStatusChange?: (status: string) => void;
  onFloorChange?: (floor: string) => void;
  onStatsChange?: () => void;
  onInteraction?: (npc: NPC) => void;
  onOverlay?: (title: string, desc: string, btnText: string) => void;
  onQuestUpdate?: (id: string, status: string) => void;
  onInventoryChange?: () => void;
  onPlayerDeath?: () => void;
  onNPCDialog?: (npcId: string, npcName: string, dialogue: string[]) => void;
  signMessage?: (msg: string) => Promise<string | null>;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  input: InputManager;
  player: Player;
  npcs: NPC[] = [];
  enemies: Enemy[] = [];
  platforms: Platform[] = [];
  portals: Portal[] = [];
  obstacles: Obstacle[] = [];
  pickups: Pickup[] = [];
  background: ParallaxBackground;
  silhouetteRenderer: SilhouetteRenderer;
  dungeonManager: DungeonManager;
  networkManager: NetworkManager;
  particleSystem: ParticleSystem;
  questManager: QuestManager;
  soundManager: SoundManager;

  private lastTime = 0;
  private running = false;
  private animFrameId = 0;
  config: GameConfig;
  screenShakeTimer = 0;

  private readonly MAX_DT = 1 / 30;
  private readonly TARGET_FPS = 60;
  private readonly TARGET_DT = 1 / this.TARGET_FPS;

  private vignetteGradient: CanvasGradient | null = null;
  private _lastVignetteW = 0;
  private _lastVignetteH = 0;

  constructor(config: GameConfig) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = config.canvas.getContext("2d")!;
    this.camera = new Camera(this.canvas.width, this.canvas.height);
    this.input = new InputManager();
    this.player = new Player(new Vector2(100, 400));
    this.background = new ParallaxBackground();
    this.silhouetteRenderer = new SilhouetteRenderer();
    this.networkManager = new NetworkManager(
      import.meta.env.VITE_API_URL || "http://localhost:3000",
    );
    this.dungeonManager = new DungeonManager(this.networkManager);
    this.particleSystem = new ParticleSystem();
    this.questManager = new QuestManager(config.onQuestUpdate);
    this.soundManager = new SoundManager();
    this.setupResize();
  }

  private setupResize(): void {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.width = this.canvas.width;
      this.camera.height = this.canvas.height;
    };
    resize();
    window.addEventListener("resize", resize);
  }

  async init(): Promise<void> {
    await this.dungeonManager.init();
    const floor = this.dungeonManager.currentFloor;
    this.platforms = floor.platforms;
    this.npcs = floor.npcs;
    this.enemies = floor.enemies;
    this.portals = floor.portals;
    this.obstacles = floor.obstacles;
    this.pickups = this.createTownPickups();
    this.background.setTheme(floor.theme);

    const isDungeon = floor.name !== "Town Square";
    this.soundManager.setStyle(isDungeon ? "dungeon" : "town");

    this.running = true;
    this.lastTime = performance.now();

    const store = useGameStore.getState();
    if (floor.name === "Town Square") {
      this.questManager.activate("floor_1_entry");
    }

    this.soundManager.startMusic();
    this.loop(this.lastTime);
  }

  private createTownPickups(): Pickup[] {
    return [
      new Pickup(500, 440, "glow_berry", "Glow Berry", 2),
      new Pickup(1100, 340, "glow_berry", "Glow Berry", 3),
      new Pickup(1550, 420, "glow_berry", "Glow Berry", 2),
      new Pickup(2100, 340, "glow_berry", "Glow Berry", 3),
    ];
  }

  private loop = (time: number): void => {
    if (!this.running) return;
    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (rawDt < this.TARGET_DT * 0.9) {
      this.render();
      this.animFrameId = requestAnimationFrame(this.loop);
      return;
    }

    const dt = Math.min(rawDt, this.MAX_DT);

    this.input.update();
    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const store = useGameStore.getState();

    this.player.update(dt, this.input, this.platforms);
    this.camera.follow(this.player.position);
    this.camera.update();

    if (store.hp <= 0) {
      this.handlePlayerDeath();
      return;
    }

    for (const npc of this.npcs) {
      npc.update(dt);
      npc.updateInteraction(this.player, this.input);
      if (npc.interacted) {
        this.handleNPCInteraction(npc);
        npc.interacted = false;
      }
    }

    for (const portal of this.portals) {
      portal.update(dt);
      portal.checkTrigger(this.player.position, () => {
        this.soundManager.playPortalOpen();
        this.handlePortalTrigger();
      });
    }

    for (const obstacle of this.obstacles) {
      obstacle.update(dt);
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.position.x, this.player.position.y, this.platforms);

      if (enemy.canAttack(this.player.position.x, this.player.position.y)) {
        const dmg = enemy.performAttack();
        this.player.takeDamage(dmg);
        this.particleSystem.emit(
          new Vector2(this.player.position.x + 16, this.player.position.y + 32),
          6,
          "#ff4444",
        );
        this.soundManager.playPlayerHit();
        this.soundManager.setStyle("combat");
      }

      const attackHitbox = this.player.getAttackHitbox();
      if (attackHitbox && enemy.overlapsPlayer(attackHitbox.x, attackHitbox.y, attackHitbox.w, attackHitbox.h)) {
        const killed = enemy.takeDamage(this.player.getWeaponDamage());
        this.soundManager.playSwordSwing();
        this.particleSystem.emit(
          new Vector2(enemy.x + 20, enemy.y + 30),
          8,
          "#f0c040",
        );
        if (killed) {
          this.soundManager.playEnemyDeath();
          store.addRenown(enemy.renownReward);
          this.particleSystem.emit(
            new Vector2(enemy.x + 20, enemy.y + 30),
            20,
            "#50c878",
          );
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !e.deathAnimationComplete);

    for (const pickup of this.pickups) {
      pickup.update(dt);
      if (
        !pickup.collected &&
        pickup.overlaps(this.player.position.x, this.player.position.y, 32, 64)
      ) {
        pickup.collected = true;
        store.addItem(pickup.itemId, pickup.itemName, pickup.quantity);
        this.soundManager.playPickup();
        this.particleSystem.emit(new Vector2(pickup.x + 12, pickup.y + 12), 8, "#50c878");
        this.config.onInventoryChange?.();
        this.questManager.evaluate("floor_1_entry");
      }
    }

    if (this.input.justPressed("KeyE")) {
      this.handleObstacleInteraction();
    }

    this.particleSystem.update(dt);

    if (store.stamina < store.maxStamina) {
      store.restoreStamina(2 * dt);
    }

    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
    }

    this.config.onFloorChange?.(this.dungeonManager.currentFloor.name);
    this.config.onStatsChange?.();
  }

  private handlePlayerDeath(): void {
    const store = useGameStore.getState();
    store.healPlayer(store.maxHp);
    this.dungeonManager.resetToTown();
    this.transitionToFloor(this.dungeonManager.currentFloor);
    this.player.position.set(100, 400);
    this.camera.position.set(0, 0);
    this.camera.target.set(0, 0);
    this.screenShakeTimer = 0.5;
    this.config.onPlayerDeath?.();
  }

  private async handleNPCInteraction(npc: NPC): Promise<void> {
    const store = useGameStore.getState();
    store.setNpcDisposition(store.currentFloor, npc.config.id, 1);

    const walletAddress = store.walletAddress || "offline";
    const result = await this.networkManager.dispatchAgentInteraction(
      walletAddress,
      npc.config.id,
      "interact",
    );

    if (result.dialogue.length > 0) {
      this.config.onNPCDialog?.(npc.config.id, npc.config.name, result.dialogue);
    }

    for (const action of result.actions) {
      if (action.tool === "grant_item") {
        store.addItem(action.args.itemId as string, action.args.itemId as string, (action.args.quantity as number) || 1);
      } else if (action.tool === "modify_reputation") {
        store.setNpcDisposition(store.currentFloor, npc.config.id, 1);
      } else if (action.tool === "unlock_portal") {
        store.unlockPortal((action.args.floor as number) || store.currentFloor + 1);
      }
    }

    this.questManager.evaluate("floor_1_entry");
    this.config.onInventoryChange?.();
    this.config.onStatsChange?.();
  }

  private handleObstacleInteraction(): void {
    const store = useGameStore.getState();
    for (const obstacle of this.obstacles) {
      if (obstacle.cleared) continue;
      if (!obstacle.playerOverlap(this.player.position.x, this.player.position.y, 32, 64)) continue;

      const hasRequired = obstacle.requiredItem ? store.hasItem(obstacle.requiredItem, 1) : true;
      if (!obstacle.canInteract(hasRequired)) {
        this.config.onOverlay?.("CANNOT CUT", "You need something sharp to cut through these thick vines.", "CLOSE");
        return;
      }

      if (store.stamina < 15) {
        this.config.onOverlay?.("EXHAUSTED", "You are too tired. Rest before attempting again.", "CLOSE");
        return;
      }

      store.spendStamina(15);
      const result = obstacle.applyHit();

      this.particleSystem.emit(
        new Vector2(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2),
        10,
        "#f0c040",
      );

      if (result.cleared) {
        store.clearObstacle(store.currentFloor, obstacle.id);
        store.addRenown(obstacle.renownReward);
        this.particleSystem.emit(
          new Vector2(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2),
          30,
          "#50c878",
        );
        this.config.onOverlay?.("OBSTACLE CLEARED", `The ${obstacle.name} have been cleared!\nYou gain ${obstacle.renownReward} Tower Renown.`, "CLOSE");
        this.questManager.evaluate("floor_1_entry");
      }

      this.config.onStatsChange?.();
      return;
    }
  }

  private handlePortalTrigger(): void {
    const store = useGameStore.getState();
    const floorIndex = this.dungeonManager.currentFloorIndex;
    const targetFloor = floorIndex + 1;

    const floorState = store.worldState[targetFloor];
    if (targetFloor > 0 && floorState && !floorState.isPortalUnlocked) {
      this.config.onOverlay?.("PORTAL LOCKED", "The portal is sealed by dark magic.\nComplete the floor quest to unlock it.", "CLOSE");
      return;
    }

    this.transitionFloor();
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = "#030205";
    ctx.fillRect(0, 0, w, h);

    const shakeX = this.screenShakeTimer > 0
      ? (Math.random() - 0.5) * this.screenShakeTimer * 40
      : 0;
    const shakeY = this.screenShakeTimer > 0
      ? (Math.random() - 0.5) * this.screenShakeTimer * 40
      : 0;

    const rawCamX = this.camera.offsetX;
    const rawCamY = this.camera.offsetY;
    const camX = rawCamX + shakeX;
    const camY = rawCamY + shakeY;

    this.background.render(ctx, w, h, rawCamX, rawCamY);

    ctx.save();
    ctx.translate(-camX, -camY);

    for (const platform of this.platforms) {
      if (this.camera.isVisible(platform.x, platform.y, platform.width, platform.height)) {
        platform.render(ctx);
      }
    }

    const layer1: { z: number; draw: () => void }[] = [];

    for (const npc of this.npcs) {
      if (this.camera.isVisible(npc.config.position.x, npc.config.position.y, 48, 80)) {
        layer1.push({ z: npc.config.position.y + 80, draw: () => npc.render(ctx, this.silhouetteRenderer) });
      }
    }

    for (const enemy of this.enemies) {
      if (this.camera.isVisible(enemy.x, enemy.y, enemy.w, enemy.h)) {
        layer1.push({ z: enemy.y + enemy.h, draw: () => enemy.render(ctx, this.silhouetteRenderer) });
      }
    }

    for (const obstacle of this.obstacles) {
      if (this.camera.isVisible(obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        layer1.push({ z: obstacle.y + obstacle.height, draw: () => obstacle.render(ctx) });
      }
    }

    for (const portal of this.portals) {
      if (this.camera.isVisible(portal.x, portal.y, portal.width, portal.height)) {
        layer1.push({ z: portal.y + portal.height, draw: () => portal.render(ctx) });
      }
    }

    if (this.camera.isVisible(this.player.position.x, this.player.position.y, 32, 64)) {
      layer1.push({ z: this.player.position.y + this.player.size.y, draw: () => this.player.render(ctx, this.silhouetteRenderer) });
    }

    layer1.sort((a, b) => a.z - b.z);
    for (const item of layer1) {
      item.draw();
    }

    for (const pickup of this.pickups) {
      if (!pickup.collected && this.camera.isVisible(pickup.x, pickup.y, pickup.width, pickup.height)) {
        pickup.render(ctx);
      }
    }

    this.particleSystem.render(ctx);
    ctx.restore();

    this.renderVignette(ctx, w, h);
  }

  private renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.vignetteGradient || this._lastVignetteW !== w || this._lastVignetteH !== h) {
      this.vignetteGradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
      this.vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
      this.vignetteGradient.addColorStop(1, "rgba(0,0,0,0.6)");
      this._lastVignetteW = w;
      this._lastVignetteH = h;
    }
    ctx.fillStyle = this.vignetteGradient;
    ctx.fillRect(0, 0, w, h);
  }

  private transitionFloor(): void {
    const nextFloor = this.dungeonManager.advanceFloor();
    this.transitionToFloor(nextFloor);
  }

  private async syncFloorClear(floorIndex: number): Promise<void> {
    if (!this.config.signMessage) return;
    const store = useGameStore.getState();
    const playerId = store.playerId;
    if (!playerId.startsWith("0x")) return;

    const message = `13towers:dungeon:verify:${playerId}:floor_${floorIndex}:${Math.floor(Date.now() / 3600000)}`;
    const signature = await this.config.signMessage(message);
    if (!signature) return;

    this.networkManager.verifyFloorClear(playerId, `floor_${floorIndex}`, signature).catch(() => {});
    this.networkManager.syncFloorClear(playerId, `floor_${floorIndex}`, signature).catch(() => {});
  }

  private transitionToFloor(floor: {
    platforms: Platform[];
    npcs: NPC[];
    enemies: Enemy[];
    portals: Portal[];
    obstacles: Obstacle[];
    theme: string;
    name: string;
  }): void {
    this.platforms = floor.platforms;
    this.npcs = floor.npcs;
    this.enemies = floor.enemies;
    this.portals = floor.portals;
    this.obstacles = floor.obstacles;
    this.pickups = [];
    this.background.setTheme(floor.theme);
    this.player.position.set(100, 300);
    this.camera.position.set(0, 0);
    this.camera.target.set(0, 0);
    this.particleSystem.emit(this.player.position.copy(), 20, "#f0c040");

    const store = useGameStore.getState();
    const newFloorIndex = this.dungeonManager.currentFloorIndex;
    store.currentFloor = newFloorIndex;

    this.config.onFloorChange?.(floor.name);
    this.config.onStatsChange?.();

    const justCleared = this.questManager.evaluate(`clear_floor_${newFloorIndex}`);
    if (justCleared) {
      this.syncFloorClear(newFloorIndex);
    }
    this.questManager.activate(`clear_floor_${newFloorIndex + 1}`);

    const isDungeon = floor.name !== "TOWN SQUARE";
    this.soundManager.setStyle(isDungeon ? "dungeon" : "town");

    if (this.enemies.length > 0) {
      this.soundManager.setStyle("combat");
    }
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    this.input.destroy();
  }
}
