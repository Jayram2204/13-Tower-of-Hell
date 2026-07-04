# 13 Towers of Hell — Game Design Specification

> **Version:** 1.0
> **Engine:** Custom Canvas 2D (PixiJS migration planned)
> **Blockchain:** Monad EVM (delegated-Proof-of-Stake, Ethereum-compatible)
> **AI Runtime:** External LLM agent cluster (HTTP bridge)
> **Target:** Browser (Desktop/Mobile WebGL)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component 1: Global State & Persistence](#2-component-1-global-state--persistence)
3. [Component 2: 2.5D Rendering Pipeline](#3-component-2-25d-rendering-pipeline)
4. [Component 3: Kinematics, Collision & Interaction](#4-component-3-kinematics-collision--interaction)
5. [Component 4: Gameplay Loop & Quest State Machine](#5-component-4-gameplay-loop--quest-state-machine)
6. [Component 5: Monad Blockchain Integration](#6-component-5-monad-blockchain-integration)
7. [Component 6: AI Agent Autonomous Bridge](#7-component-6-ai-agent-autonomous-bridge)
8. [Asset Pipeline & Art Direction](#8-asset-pipeline--art-direction)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Current Codebase Alignment Matrix](#10-current-codebase-alignment-matrix)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Canvas 2D│  │ Zustand  │  │ Network  │  │ Wallet   │ │
│  │ Engine   │  │ State    │  │ Manager  │  │ Connect  │ │
│  │ (Canvas) │  │ (planned)│  │ (fetch)  │  │ (planned)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
└───────┼──────────────┼────────────┼──────────────┼───────┘
        │              │            │              │
        ▼              ▼            ▼              ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Next.js + Hono / Node.js)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Routes   │→│ Services │→│ DB       │  │ Web3    │ │
│  │ (auth'd) │  │ (planned)│  │ (in-mem) │  │ (viem)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘ │
└──────────────────────────────────────────────────┼───────┘
                                                   │
                    ┌──────────────────────────────┼────────┐
                    │              ┌──────────────┐│        │
                    │              │ AI Agent     ││        │
                    │              │ Cluster      ││        │
                    │              │ (Node/Python)││        │
                    │              └──────┬───────┘│        │
                    │                     │         │        │
                    ▼                     ▼         ▼        │
              ┌──────────┐         ┌──────────┐              │
              │ Monad    │         │ LLM API  │              │
              │ EVM      │         │ (OpenAI) │              │
              │ Contracts│         │          │              │
              └──────────┘         └──────────┘              │
                    └────────────────────────────────────────┘
```

---

## 2. Component 1: Global State & Persistence [PLANNED]

### 2.1 Design

A single immutable state tree (Zustand store) drives all client-side logic. Mutations flow one-way: **User Input → Store Action → Re-render**.

### 2.2 Player State Schema

```typescript
interface PlayerState {
  playerId: string;          // UUID or wallet address
  hp: number;                // 0–100
  stamina: number;           // 0–100
  towerRenown: number;       // currency, defaults 0
  currentFloor: number;      // 1-indexed, defaults 1
  inventory: InventoryItem[];
}

interface InventoryItem {
  itemId: string;
  quantity: number;
}
```

### 2.3 World State Schema

```typescript
interface WorldState {
  floorStates: Map<number, FloorState>;
}

interface FloorState {
  isPortalUnlocked: boolean;
  clearedObstacles: string[];       // e.g. ["gateway_brambles"]
  npcDispositions: Map<string, number>;  // npc_id → reputation
}
```

### 2.4 Persistence Layer

```
Client:  localStorage (cached progress)
         ↓
         periodic HTTP POST (cryptographically signed via wallet)
         ↓
Backend: SQLite/PostgreSQL (canonical source)
         ↓
Chain:   Monad EVM (immutable settlement — floor clears, bounty claims)
```

### 2.5 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| Player state schema | ✅ Partial | `packages/shared-types/src/index.ts` — missing `hp`, `stamina`, `towerRenown` |
| World state schema | ❌ Missing | Only `DungeonState` exists, no `FloorState` with obstacles/dispositions |
| Zustand store | ❌ Missing | No state management library installed |
| localStorage caching | ❌ Missing | No persistence layer |
| Signed state sync | ❌ Missing | No auth on API (see AUDIT.md #2.1) |

### 2.6 Required Implementation

**New file: `apps/client/src/state/gameStore.ts`**:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameStore {
  // Player
  playerId: string;
  hp: number;
  stamina: number;
  towerRenown: number;
  currentFloor: number;
  inventory: { itemId: string; quantity: number }[];

  // World
  worldState: Record<number, {
    isPortalUnlocked: boolean;
    clearedObstacles: string[];
    npcDispositions: Record<string, number>;
  }>;

  // Actions
  setPlayerId: (id: string) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  spendStamina: (amount: number) => void;
  addItem: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => boolean;
  unlockPortal: (floor: number) => void;
  clearObstacle: (floor: number, obstacleId: string) => void;
  setNpcDisposition: (floor: number, npcId: string, value: number) => void;
  syncFromServer: (data: Partial<GameStore>) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      playerId: '',
      hp: 100,
      stamina: 100,
      towerRenown: 0,
      currentFloor: 1,
      inventory: [],
      worldState: {},

      // Actions
      setPlayerId: (id) => set({ playerId: id }),
      damagePlayer: (amount) => set((s) => ({ hp: Math.max(0, s.hp - amount) })),
      healPlayer: (amount) => set((s) => ({ hp: Math.min(100, s.hp + amount) })),
      spendStamina: (amount) => set((s) => ({ stamina: Math.max(0, s.stamina - amount) })),
      addItem: (itemId, quantity) =>
        set((s) => {
          const existing = s.inventory.find((i) => i.itemId === itemId);
          if (existing) {
            existing.quantity += quantity;
            return { inventory: [...s.inventory] };
          }
          return { inventory: [...s.inventory, { itemId, quantity }] };
        }),
      removeItem: (itemId, quantity) => {
        const item = get().inventory.find((i) => i.itemId === itemId);
        if (!item || item.quantity < quantity) return false;
        item.quantity -= quantity;
        if (item.quantity <= 0) {
          set((s) => ({ inventory: s.inventory.filter((i) => i.itemId !== itemId) }));
        }
        return true;
      },
      unlockPortal: (floor) =>
        set((s) => ({
          worldState: {
            ...s.worldState,
            [floor]: {
              ...s.worldState[floor],
              isPortalUnlocked: true,
            },
          },
        })),
      clearObstacle: (floor, obstacleId) =>
        set((s) => {
          const floorState = s.worldState[floor] || { isPortalUnlocked: false, clearedObstacles: [], npcDispositions: {} };
          return {
            worldState: {
              ...s.worldState,
              [floor]: {
                ...floorState,
                clearedObstacles: [...new Set([...floorState.clearedObstacles, obstacleId])],
              },
            },
          };
        }),
      setNpcDisposition: (floor, npcId, value) =>
        set((s) => {
          const floorState = s.worldState[floor] || { isPortalUnlocked: false, clearedObstacles: [], npcDispositions: {} };
          return {
            worldState: {
              ...s.worldState,
              [floor]: {
                ...floorState,
                npcDispositions: { ...floorState.npcDispositions, [npcId]: value },
              },
            },
          };
        }),
      syncFromServer: (data) => set(data),
    }),
    { name: '13towers-save' }
  )
);
```

---

## 3. Component 2: 2.5D Rendering Pipeline [PARTIAL]

### 3.1 Design

Four distinct Z-order layers create the 2.5D illusion:

```
Layer 0: Background / Floor        (Z 0–10)
  └─ Flat ground tiles, paths, water. No player intersection.

Layer 1: Dynamic / Y-Sorted        (Z dynamically assigned)
  └─ Player, NPCs, obstacles, buildings, trees.
     Z recalculated per frame: Z = floor(obj.y + obj.height)

Layer 2: Foreground / Overlay      (Z 1000+)
  └─ Tree canopies, roof overhangs, weather particles.
     Always renders on top of Layer 1 regardless of Y.

Layer 3: UI / HUD                  (fixed screen space)
  └─ HP bar, stamina bar, renown counter, dialogue box.
     Ignores camera transforms entirely.
```

### 3.2 Y-Sorting Algorithm

```
For all entities in Layer 1 each frame:
  Z-index = floor(entity.y + entity.height)
  Sort ascending by Z-index
  Render in sorted order

Result: Entities lower on screen draw on top of entities higher up.
```

### 3.3 Silhouette Shading (Shadow Fight 2 Style)

```
All character sprites (player, NPCs) are rendered as pure black silhouettes:
  - RGB forced to (0, 0, 0)
  - Alpha channel preserved for anti-aliasing
  - Optional: emissive glow lines (eyes, runes) in #f0c040

This creates stark contrast against vibrant, neon-glowing backgrounds.
```

### 3.4 Viewport Configuration

```
Camera:  Fixed orthographic
Tilt:    30–45° downward angle (simulated via parallax speeds)
         → Background layers scroll at different rates:
           - Sky:      0.01× camera
           - Mountains: 0.02× camera
           - Buildings: 0.05× camera
           - Mid:       0.10× camera
           - Fog:       0.03× camera
```

### 3.5 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| Layer 0 (Background) | ✅ Exists | `ParallaxBackground.ts` — sky, mountains, buildings, fog |
| Layer 1 (Y-Sorted) | ❌ No Y-sort | `GameEngine.ts:135-148` — renders in fixed order: platforms → npcs → portals → player |
| Layer 2 (Foreground) | ❌ Missing | No foreground overlay layer |
| Layer 3 (UI/HUD) | ✅ Partial | `index.html` — DOM-based HUD, not in canvas |
| Silhouette rendering | ✅ Exists | `SilhouetteRenderer.ts` — draws characters in `#0a0a0f` (near-black) |
| Backdrop parallax speeds | ✅ Exists | `ParallaxBackground.ts` — camera speed multipliers: 0.02, 0.05, 0.1, 0.03 |
| Frame-by-frame Z recalc | ❌ Missing | No z-sorting in render loop |

### 3.6 Required Implementation

**Add Y-sorting to `GameEngine.ts` render loop**:

```typescript
private render(): void {
  // ... setup, background (Layer 0) ...

  ctx.save();
  ctx.translate(-camX, -camY);

  // Layer 1: Y-Sorted
  const layer1: { z: number; draw: () => void }[] = [];

  for (const npc of this.npcs) {
    layer1.push({
      z: npc.config.position.y + 80,  // npc height ~80px
      draw: () => npc.render(ctx, this.silhouetteRenderer),
    });
  }

  for (const portal of this.portals) {
    layer1.push({
      z: portal.y + portal.height,
      draw: () => portal.render(ctx),
    });
  }

  layer1.push({
    z: this.player.position.y + this.player.size.y,
    draw: () => this.player.render(ctx, this.silhouetteRenderer),
  });

  // Draw platforms first (ground layer within Layer 1)
  for (const platform of this.platforms) {
    platform.render(ctx);
  }

  // Sort by Z and render
  layer1.sort((a, b) => a.z - b.z);
  for (const item of layer1) {
    item.draw();
  }

  // Layer 2: Foreground particles
  this.particleSystem.render(ctx);

  ctx.restore();

  // Layer 3: Vignette (screen-space overlay)
  this.renderVignette(ctx, w, h);
}
```

**Note:** Platforms should remain unsorted (they're ground-level and always below characters). The Y-sort applies only to vertical entities.

---

## 4. Component 3: Kinematics, Collision & Interaction [PARTIAL]

### 4.1 Movement System

```
Input: WASD or Arrow Keys
Output: Normalized 2D vector → velocity
Diagonal normalization: prevents √2 speed boost

  velocity = normalize(inputVector) × speed
```

### 4.2 Sprite Anchor Points

```
All entities use bottom-center as origin point:
  - Player:  (x + width/2, y + height)
  - NPC:     (x + width/2, y + height)
  - Building: (x + width/2, y + height)

This ensures Y-sorting uses the feet/base of the sprite,
not the geometric center. A tall building's Y for sorting
is its bottom (doorway), not its visual midpoint.
```

### 4.3 Collision Mask Rule

```
Dynamic collision bounding boxes occupy only 10–20% height
of the visual asset. Example for a 64px-tall player:
  - Visual:  64px (drawn full)
  - Hitbox:  12px tall at bottom (y+52 to y+64)

This allows the upper 80% of the player silhouette to pass
VISUALLY behind a wall or tree before physics stops it.
```

### 4.4 Interaction Volume

```
A trigger circle █ extending 24px outward from the
player's facing direction. Pressing E evaluates:
  - Is any NPC/object within this volume?
  - If yes → query state → launch interaction
```

### 4.5 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| WASD/Arrow movement | ✅ Exists | `Player.ts:26-28` |
| Diagonal normalization | ❌ Missing | `Player.ts:33` — `velocity.x = moveX × SPEED`, sets x but ignores y normalization |
| Jump physics | ✅ Exists | `Player.ts:35-38` — gravity, jump force |
| AABB collision | ✅ Exists | `Player.ts:62-99` — horizontal + vertical sweep |
| Collision mask rule (10-20%) | ❌ Missing | Current collision uses full entity size |
| Bottom-center anchor | ❌ Missing | All entities use top-left origin (standard Canvas 2D) |
| Interaction volume (24px) | ✅ Partial | `NPC.ts:34` — `interactionRange: 80` on config |
| E key interaction | ✅ Exists | `NPC.ts:37` — `input.justPressed('KeyE')` |

### 4.6 Required Implementation

**Add diagonal normalization to `Player.ts`**:

```typescript
update(dt: number, input: InputManager, platforms: Platform[]): void {
  let moveX = 0;
  let moveY = 0;
  if (input.isDown('ArrowLeft') || input.isDown('KeyA')) moveX = -1;
  if (input.isDown('ArrowRight') || input.isDown('KeyD')) moveX = 1;
  if (input.isDown('ArrowUp') || input.isDown('KeyW')) moveY = -1;
  if (input.isDown('ArrowDown') || input.isDown('KeyS')) moveY = 1;

  // 🔥 Normalize diagonal movement
  const len = Math.sqrt(moveX * moveX + moveY * moveY);
  if (len > 0) {
    moveX /= len;
    moveY /= len;
  }

  if (moveX !== 0) {
    this.facingRight = moveX > 0;
  }

  this.velocity.x = moveX * this.SPEED;
  // Note: No horizontal movement on Y axis in platformer mode.
  // For top-down, uncomment: this.velocity.y = moveY * this.SPEED;
  // ...
```

**Add bottom-center anchor to `NPC.ts` and `Player.ts`**:

The Y-sorting Z value should use `entity.position.y + entity.size.y` (bottom edge), not `entity.position.y` (top edge). This is already reflected in the Y-sort implementation in §3.6.

---

## 5. Component 4: Gameplay Loop & Quest State Machine [PARTIAL]

### 5.1 Interaction Event Flow

```
Press [E] 
  → Check Interaction Volume (24px forward) 
  → Find nearest Entity ID 
  → Query WorldState for entity status 
  → Check Quest Dependency Tree 
  → Launch Dialogue / Action Module
```

### 5.2 Quest Dependency Tree (Floor 1)

```
Quest_01_Start: Proximity/interaction with NPC Teo
│
├─ Condition_A: inventory contains "glow_berry" ≥ 5
│  └─ Action_A: Deduct 5 berries → grant "rusty_axe"
│
├─ Condition_B: At "gateway_brambles" with "rusty_axe"
│  └─ Action_B: Deduct 15 stamina per hit, track 3 hits
│     └─ obstacle "gateway_brambles" marked cleared
│
└─ Quest_01_Complete: floorStates[1].isPortalUnlocked = true
   └─ Portal to Floor 2 activates
```

### 5.3 Scene / Dimension Swapping

```
On floor transition (portal entry):
  1. Snapshot player state (HP, stamina, position)
  2. Render full-screen black fade overlay
  3. Clear active scene entities (NPCs, platforms, portals)
  4. Load floor config from FloorData (DungeonManager)
  5. Spawn player at floor's spawn vector
  6. Fade in overlay
  7. Resume game loop
```

### 5.4 Quest State Machine Schema

```typescript
interface QuestState {
  questId: string;
  status: 'inactive' | 'active' | 'completed';
  conditions: {
    type: 'inventory_check' | 'stamina_check' | 'obstacle_cleared' | 'npc_interaction';
    target: string;       // item_id, obstacle_id, npc_id
    threshold: number;    // quantity, hits, reputation
    current: number;
  }[];
  rewards: {
    type: 'item' | 'renown' | 'portal_unlock';
    target: string;
    quantity: number;
  }[];
}
```

### 5.5 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| Interaction flow (E key → NPC) | ✅ Exists | `main.ts:72-113` — NPC interaction handler |
| Static dialogue | ✅ Exists | `DungeonManager.ts:142-228` — NPC configs with dialog arrays |
| Quest system | ❌ Missing | No quest data structures, no dependency tree |
| Item inventory | ❌ Missing | No inventory UI or logic in client |
| Stamina system | ❌ Missing | No stamina tracking |
| Obstacle clearing | ❌ Missing | No interactive obstacles (brambles, etc.) |
| Portal unlock mechanic | ❌ Missing | `transitionFloor()` always advances regardless of conditions |
| Scene swap with fade | ❌ Missing | Direct state swap, no fade overlay |
| 13 floor structure | ❌ Partial | Only 3 dungeon floors + town. Spec requires 13 floors |

### 5.6 Required Implementation

**New file: `apps/client/src/engine/systems/QuestManager.ts`**:

```typescript
import { useGameStore } from '../../state/gameStore';

interface QuestCondition {
  type: 'inventory_check' | 'stamina_check' | 'obstacle_cleared' | 'npc_interacted';
  target: string;
  threshold: number;
}

interface QuestReward {
  type: 'item' | 'renown' | 'portal_unlock';
  target: string;
  quantity: number;
}

interface Quest {
  id: string;
  status: 'inactive' | 'active' | 'completed';
  conditions: QuestCondition[];
  rewards: QuestReward[];
}

export class QuestManager {
  private quests: Map<string, Quest> = new Map();

  constructor() {
    this.registerQuests();
  }

  private registerQuests(): void {
    this.quests.set('floor_1_entry', {
      id: 'floor_1_entry',
      status: 'inactive',
      conditions: [
        { type: 'npc_interacted', target: 'teo_merchant', threshold: 1 },
        { type: 'inventory_check', target: 'glow_berry', threshold: 5 },
        { type: 'obstacle_cleared', target: 'gateway_brambles', threshold: 1 },
      ],
      rewards: [
        { type: 'portal_unlock', target: 'floor_1', quantity: 0 },
        { type: 'renown', target: 'tower_renown', quantity: 50 },
      ],
    });
  }

  evaluate(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest || quest.status === 'completed') return;

    const store = useGameStore.getState();
    const allMet = quest.conditions.every((c) => {
      switch (c.type) {
        case 'inventory_check': {
          const item = store.inventory.find((i) => i.itemId === c.target);
          return item && item.quantity >= c.threshold;
        }
        case 'stamina_check':
          return store.stamina >= c.threshold;
        case 'obstacle_cleared': {
          const floor = store.worldState[store.currentFloor];
          return floor?.clearedObstacles.includes(c.target) ?? false;
        }
        case 'npc_interacted': {
          const floor = store.worldState[store.currentFloor];
          const disp = floor?.npcDispositions[c.target] ?? 0;
          return disp >= c.threshold;
        }
        default:
          return false;
      }
    });

    if (allMet) {
      quest.status = 'completed';
      this.applyRewards(quest.rewards);
    }
  }

  private applyRewards(rewards: QuestReward[]): void {
    const store = useGameStore.getState();
    for (const reward of rewards) {
      switch (reward.type) {
        case 'item':
          store.addItem(reward.target, reward.quantity);
          break;
        case 'renown':
          store.towerRenown += reward.quantity;
          break;
        case 'portal_unlock':
          store.unlockPortal(parseInt(reward.target.split('_')[1]));
          break;
      }
    }
  }
}
```

**Gate portal on conditions in `GameEngine.ts`**:

```typescript
private transitionFloor(): void {
  const nextFloor = this.dungeonManager.advanceFloor();

  // 🔥 Check if portal is unlocked for this floor
  const store = useGameStore.getState();
  const floorState = store.worldState[nextFloorIndex];
  if (floorState && !floorState.isPortalUnlocked) {
    // Show locked message, don't transition
    this.config.onOverlay?.('PORTAL LOCKED', 'Complete the floor quest to unlock.', 'CLOSE');
    return;
  }

  // ... existing transition logic with fade ...
}
```

---

## 6. Component 5: Monad Blockchain Integration [IMPLEMENTED]

### 6.1 Architecture

```
Game Client (browser)
  ↓ signed message
Backend API
  ↓ verification + proof generation
Monad EVM
  ↓ event emission
Event Listener (backend)
  ↓ state diff
Backend DB + Client sync
```

### 6.2 Smart Contract Architecture

**CharacterRegistry.sol** (deployed once):
- `register(name)` — bind wallet address to character name
- `getName(address)` — resolve name from wallet
- `isRegistered(address)` — check registration status

**DungeonProgress.sol** (deployed once):
- `clearFloor(floorId, signature)` — mark floor cleared (requires server-signed proof)
- `claimBounty(floorId)` — claim reward tokens (actually transfers value)
- `getFloorProgress(wallet, floorId)` — read floor state

**TowerRenown.sol** (future):
- ERC20-like token for `tower_renown`
- Earned via floor clears, spent at NPC shops

### 6.3 State Synchronization Flow

```
1. Player clears floor in game client
2. Client → Backend: POST /api/dungeon/verify (signed by wallet)
3. Backend validates game logic (quest conditions, anti-cheat)
4. Backend → Monad: submit clearFloor() with server signature     ← COST: gas fee
5. Monad emits FloorCleared event
6. Backend event listener catches event
7. Backend updates canonical DB state
8. Client polls or WebSocket receives updated state
9. Client re-renders floor state (portals, NPC dispositions)
```

### 6.4 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| CharacterRegistry.sol | ✅ Exists | `apps/contracts/src/CharacterRegistry.sol` |
| DungeonProgress.sol | ✅ Exists | `apps/contracts/src/DungeonProgress.sol` |
| Server signature in clearFloor | ❌ Missing | No ECDSA import, no serverSigner |
| Funds transfer in claimBounty | ❌ Missing | No `call{value:}` |
| Backend blockchain client | ❌ Dead code | `blockchain.ts` — never imported, never called |
| Event listener | ❌ Missing | No WebSocket/RPC listener for contract events |
| Wallet-based auth | ❌ Missing | No viem wallet integration in client |

### 6.5 Required Implementation

See [AUDIT.md §3 (Smart Contract Fixes)](AUDIT.md#3-smart-contract-fixes) for the full contract remediation, and [AUDIT.md §7 (Web3 Integration)](AUDIT.md#7-web3-integration) for the backend blockchain wiring.

**Additional: Event Listener for Monad**

**New file: `apps/backend/src/web3/eventListener.ts`**:

```typescript
import { createPublicClient, http, parseAbiItem } from 'viem';
import { db } from '../db/database';

const MONAD_RPC = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const DUNGEON_CONTRACT = process.env.DUNGEON_PROGRESS_ADDRESS as `0x${string}`;

const client = createPublicClient({
  transport: http(MONAD_RPC),
});

export function startEventListener(): void {
  // Poll for FloorCleared events
  setInterval(async () => {
    try {
      const logs = await client.getLogs({
        address: DUNGEON_CONTRACT,
        event: parseAbiItem('event FloorCleared(address indexed player, bytes32 indexed floorId, uint256 timestamp)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      for (const log of logs) {
        const player = log.args.player;
        const floorId = log.args.floorId;
        if (player && floorId) {
          console.log(`[Chain Event] Floor cleared: ${player} → ${floorId}`);
          // Update local DB
          const playerRecord = db.getPlayerByWallet(player);
          if (playerRecord) {
            db.markFloorCleared(playerRecord.id, floorId.toString());
          }
        }
      }
    } catch (err) {
      console.error('[Event Listener] Poll failed:', err);
    }
  }, 15000); // Poll every 15s
}
```

---

## 7. Component 6: AI Agent Autonomous Bridge [PARTIAL]

### 7.1 Architecture

```
NPC in game engine
  ↓ (player interacts, sends message)
Client → Backend: POST /api/npc/interact
  ↓ (forwards to AI agent)
Backend → AI Agent Cluster: HTTP request
  ↓ (LLM processes context + conversation memory + tool calls)
AI Agent → Backend: JSON response with dialogue + state mutations
  ↓ (validates, applies state changes)
Backend → Client: Response
  ↓ (renders dialogue, updates game state)
NPC in game engine
```

### 7.2 AI Agent API Payload

```json
{
  "player_id": "0x...",
  "npc_id": "teo_merchant",
  "player_renown": 50,
  "current_floor_state": {
    "brambles_cleared": true,
    "portal_unlocked": false
  },
  "player_input_text": "Is there another way past the portal?",
  "conversation_history": [
    {"role": "npc", "text": "The gateway brambles block the path. Bring me 5 glow berries and I'll lend you my axe."},
    {"role": "player", "text": "Where can I find glow berries?"}
  ]
}
```

### 7.3 AI Agent Cognitive Loop

```
1. Receive context + player input
2. Retrieve conversation memory (vector DB: Pinecone/Chroma)
3. Evaluate player intent via LLM
4. Check tool-calling permissions:
   - grant_item(player_id, item_id, quantity)
   - modify_reputation(npc_id, player_id, delta)
   - unlock_portal(floor_id)
   - generate_quest(quest_template, parameters)
5. Return: { dialogue: string, actions: ToolCall[] }
```

### 7.4 NPC Runtime Architecture

```
NPCs are NOT hardcoded state arrays.
They are interfaces pointing to a decentralized LLM agent cluster:

  NPCRegistry (backend DB)
    ↓ maps npc_id → agent endpoint URL
    ↓
  Agent Cluster (Node.js / Python)
    ↓
  Each agent has:
    - Personality prompt (system prompt)
    - Economic parameters (price curves, inventory)
    - Tool access (grant_item, modify_reputation, etc.)
    - Conversation memory (vector DB)
```

### 7.5 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| NPC agent runtime | ✅ Exists | `apps/ai-agents/src/agents/NPCAgent.ts` |
| Economic cycles | ✅ Exists | `NPCAgent.ts:53-137` — blacksmith/mage/manager cycles |
| Tool-based agent design | ❌ Missing | No tool abstraction — agents mutate state directly |
| Vector DB memory | ❌ Missing | No memory/persistence for conversations |
| LLM integration | ❌ Missing | No OpenAI/LLM API calls |
| HTTP bridge to agents | ❌ Missing | `ai-agents/src/index.ts` imports backend DB directly (see AUDIT.md §4.1) |
| Personality prompts | ❌ Missing | No prompt templates |

### 7.6 Required Implementation

**New file: `apps/ai-agents/src/tools/registry.ts`**:

```typescript
// Tool-calling abstraction for AI agents

export type ToolName =
  | 'grant_item'
  | 'modify_reputation'
  | 'unlock_portal'
  | 'generate_quest';

export interface ToolCall {
  tool: ToolName;
  args: Record<string, string | number | boolean>;
}

export interface ToolResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class ToolRegistry {
  private backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
  }

  async execute(tool: ToolCall, playerId: string): Promise<ToolResult> {
    switch (tool.tool) {
      case 'grant_item':
        return this.grantItem(playerId, tool.args as any);
      case 'modify_reputation':
        return this.modifyReputation(playerId, tool.args as any);
      case 'unlock_portal':
        return this.unlockPortal(playerId, tool.args as any);
      case 'generate_quest':
        return this.generateQuest(playerId, tool.args as any);
      default:
        return { success: false, error: `Unknown tool: ${tool.tool}` };
    }
  }

  private async grantItem(
    playerId: string,
    { itemId, quantity }: { itemId: string; quantity: number }
  ): Promise<ToolResult> {
    const res = await fetch(`${this.backendUrl}/api/player/${playerId}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity, signature: process.env.AGENT_API_KEY }),
    });
    return res.json();
  }

  private async modifyReputation(
    playerId: string,
    { npcId, delta }: { npcId: string; delta: number }
  ): Promise<ToolResult> {
    const res = await fetch(`${this.backendUrl}/api/npc/${npcId}/reputation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, delta, signature: process.env.AGENT_API_KEY }),
    });
    return res.json();
  }

  private async unlockPortal(
    playerId: string,
    { floorId }: { floorId: string }
  ): Promise<ToolResult> {
    const res = await fetch(`${this.backendUrl}/api/dungeon/${floorId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, signature: process.env.AGENT_API_KEY }),
    });
    return res.json();
  }

  private async generateQuest(
    playerId: string,
    { questTemplate }: { questTemplate: string }
  ): Promise<ToolResult> {
    const res = await fetch(`${this.backendUrl}/api/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, template: questTemplate, signature: process.env.AGENT_API_KEY }),
    });
    return res.json();
  }
}
```

**New file: `apps/ai-agents/src/agents/LLMAgent.ts`**:

```typescript
import { ToolRegistry, ToolCall } from '../tools/registry';

interface AgentConfig {
  npcId: string;
  personalityPrompt: string;
  backendUrl: string;
  llmApiKey: string;
}

interface ConversationTurn {
  role: 'npc' | 'player';
  text: string;
}

export class LLMAgent {
  private config: AgentConfig;
  private tools: ToolRegistry;
  private conversation: ConversationTurn[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = new ToolRegistry(config.backendUrl);
  }

  async processInteraction(
    playerId: string,
    playerInput: string,
    context: {
      playerRenown: number;
      floorState: Record<string, boolean>;
      inventory: { itemId: string; quantity: number }[];
    }
  ): Promise<{ dialogue: string; actions: ToolCall[] }> {
    this.conversation.push({ role: 'player', text: playerInput });

    // Build the LLM prompt
    const messages = [
      { role: 'system', content: this.config.personalityPrompt },
      { role: 'system', content: `Current context: ${JSON.stringify(context)}` },
      ...this.conversation.map((t) => ({
        role: t.role === 'npc' ? 'assistant' : 'user',
        content: t.text,
      })),
    ];

    // Call LLM (OpenAI-compatible API)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: this.getToolDefinitions(),
        tool_choice: 'auto',
      }),
    });

    const data = await response.json();
    const choice = data.choices[0];

    // Parse tool calls from LLM response
    const actions: ToolCall[] = (choice.message.tool_calls || []).map((tc: any) => ({
      tool: tc.function.name as ToolCall['tool'],
      args: JSON.parse(tc.function.arguments),
    }));

    // Execute tool calls
    for (const action of actions) {
      await this.tools.execute(action, playerId);
    }

    const dialogue = choice.message.content || '...';

    this.conversation.push({ role: 'npc', text: dialogue });

    // Trim conversation history (keep last 10 turns)
    if (this.conversation.length > 20) {
      this.conversation = this.conversation.slice(-20);
    }

    return { dialogue, actions };
  }

  private getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'grant_item',
          description: 'Grant an item to the player',
          parameters: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              quantity: { type: 'number' },
            },
            required: ['itemId', 'quantity'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'modify_reputation',
          description: 'Change the player reputation with this NPC',
          parameters: {
            type: 'object',
            properties: {
              npcId: { type: 'string' },
              delta: { type: 'number' },
            },
            required: ['npcId', 'delta'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'unlock_portal',
          description: 'Unlock a portal to the next floor',
          parameters: {
            type: 'object',
            properties: {
              floorId: { type: 'string' },
            },
            required: ['floorId'],
          },
        },
      },
    ];
  }
}
```

---

## 8. Asset Pipeline & Art Direction [PARTIAL]

### 8.1 Visual Style

```
Palette:  Dark, moody backgrounds (#0a0a0f, #1a0a2e) with neon-gold highlights (#f0c040)
Characters: Pure black silhouettes with subtle glow accents
Environments: Vibrant, glowing 2.5D pixel art (tilesets + parallax layers)
```

### 8.2 Asset Sources

| Source | Type | Use Case |
|--------|------|----------|
| itch.io | Premium tilesets | "Sprout Lands" or "Cup Nooble" packs for cozy environments |
| OpenGameArt.org | Free sprites | Environmental textures, architectural shapes |
| Custom generation | Silhouettes | Any pixel art character → black tinted for silhouette effect |

### 8.3 Silhouette Generation Pipeline

```
1. Download/create any pixel art character sprite
2. Apply color transform: RGB → (0, 0, 0), alpha preserved
3. Optionally add emissive glow lines (eyes, runes) in #f0c040
4. Place against vibrant parallax background

The stark contrast creates the "Shadow Fight 2" aesthetic
without requiring custom silhouette assets.
```

### 8.4 Collision Mask Convention

```
For each asset, define:
  - Origin point: bottom-center of sprite
  - Collision mask: rectangle at base, 10-20% of total height

Example — 48×80 NPC sprite:
  origin: (24, 80)        ← bottom-center
  hitbox: (4, 68, 40, 12)  ← x=4, y=68, w=40, h=12 (15% height)
```

### 8.5 Current Codebase Alignment

| Spec | Status | Location |
|------|--------|----------|
| Silhouette rendering | ✅ Exists | `SilhouetteRenderer.ts` — draws characters in near-black |
| Parallax backgrounds | ✅ Exists | `ParallaxBackground.ts` — 4 themes (town, dungeon 1-3) |
| Neon-gold accent (#f0c040) | ✅ Exists | Used in HUD, dialogue, portals |
| Tileset-based environments | ❌ Missing | Currently uses procedural gradient rectangles for platforms |
| Character sprites | ❌ Missing | Current silhouette is procedural (geometric shapes), not sprite-based |
| Proper hitbox masks | ❌ Missing | No collision mask data structure per entity |

---

## 9. Implementation Roadmap

### Phase 0: Critical Fixes (Week 1)

| # | Task | Depends On |
|---|------|------------|
| 0.1 | Add wallet auth to all API endpoints | — |
| 0.2 | Fix `claimBounty()` fund transfer in contract | — |
| 0.3 | Add server-signed proof to `clearFloor()` | — |
| 0.4 | Replace Vector2 allocations with mutable methods | — |
| 0.5 | Add spatial culling to render loop | — |
| 0.6 | Eliminate cross-service DB import (agents → HTTP) | 0.1 |

### Phase 1: Engine Rewrite (Weeks 2-3)

| # | Task | Depends On |
|---|------|------------|
| 1.1 | Add Y-sorting to Layer 1 render loop | 0.5 |
| 1.2 | Add frame-rate cap | — |
| 1.3 | Cache gradients, pre-compute background randoms | — |
| 1.4 | Replace particle splice with swap-pop | — |
| 1.5 | Install PixiJS and create webgl renderer scaffold | — |
| 1.6 | Migrate silhouette renderer to PixiJS Graphics | 1.5 |
| 1.7 | Add Layer 2 (Foreground overlay) container | 1.5 |

### Phase 2: Game Systems (Weeks 3-4)

| # | Task | Depends On |
|---|------|------------|
| 2.1 | Create Zustand game store with persist | — |
| 2.2 | Implement HP/stamina/renown systems | 2.1 |
| 2.3 | Build inventory system with UI | 2.1 |
| 2.4 | Build QuestManager with dependency tree | 2.1 |
| 2.5 | Add obstacle interaction (brambles, etc.) | 2.3 |
| 2.6 | Gate portals on quest completion | 2.4 |

### Phase 3: AI Agent System (Weeks 4-5)

| # | Task | Depends On |
|---|------|------------|
| 3.1 | Create ToolRegistry with HTTP backend bridge | 0.6 |
| 3.2 | Build LLMAgent with OpenAI integration | 3.1 |
| 3.3 | Replace NPCAgent economic cycles with LLM calls | 3.2 |
| 3.4 | Add vector DB for conversation memory | 3.2 |
| 3.5 | Create personality prompts for each NPC | — |

### Phase 4: Blockchain Integration (Weeks 5-6)

| # | Task | Depends On |
|---|------|------------|
| 4.1 | Fix DungeonProgress contract (ECDSA, fund transfer) | — |
| 4.2 | Wire up backend blockchain client (viem) | 4.1 |
| 4.3 | Add event listener for Monad events | — |
| 4.4 | Add wallet connection (wagmi/ RainbowKit) to client | — |
| 4.5 | Implement signed state sync flow | 0.1, 4.4 |

### Phase 5: Content & Polish (Weeks 6-8)

| # | Task | Depends On |
|---|------|------------|
| 5.1 | Design 13 floors with unique themes | — |
| 5.2 | Source/create pixel art tilesets | — |
| 5.3 | Import tileset-based rendering (replace procedural platforms) | 1.5 |
| 5.4 | Add Y-sorted building/obstacle sprites | 1.1, 5.3 |
| 5.5 | Audio system (ambient, SFX) | — |
| 5.6 | Mobile controls (touch joystick) | — |

### Phase 6: Infrastructure (Ongoing)

| # | Task | Depends On |
|---|------|------------|
| 6.1 | Replace Next.js with Hono | — |
| 6.2 | Add SQLite/PostgreSQL (replace in-memory DB) | — |
| 6.3 | Add Biome linter | — |
| 6.4 | Add Vitest test suite | — |
| 6.5 | Add GitHub Actions CI | 6.3, 6.4 |

---

## 10. Current Codebase Alignment Matrix

| Specification | Current State | Gap | Priority | Effort |
|---|---|---|---|---|
| **State & Persistence** | | | | |
| Player schema (hp, stamina, renown) | Partial — has credits but not hp/stamina | Missing 3 fields + store | HIGH | 4h |
| World state schema | Missing — only basic DungeonState | Need FloorState with obstacles, dispositions | HIGH | 3h |
| Zustand store | Missing | Need to install + implement | HIGH | 2h |
| localStorage caching | Missing | Zustand persist middleware handles this | HIGH | 1h |
| Signed state sync | Missing | Depends on auth (Phase 0.1) | CRITICAL | 4h |
| **2.5D Rendering** | | | | |
| Y-sorting (Layer 1) | Missing — fixed render order | Need per-frame Z sort of entities | CRITICAL | 3h |
| Layer 0 (Background) | Exists (ParallaxBackground) | — | — | — |
| Layer 2 (Foreground) | Missing | Need canopy/roof/weather overlay | MEDIUM | 4h |
| Layer 3 (UI) | Partial — DOM-based, not canvas | Should move to canvas overlay | LOW | 2h |
| Silhouette rendering | Exists (SilhouetteRenderer) | — | — | — |
| Frame-rate cap | Missing | Need dt threshold in game loop | MEDIUM | 1h |
| Spatial culling | Missing — renders everything | Need isVisible check in render loop | CRITICAL | 1h |
| **Kinematics & Collision** | | | | |
| WASD + diagonal normalize | Partial — no normalization | Add Math.sqrt normalization | MEDIUM | 0.5h |
| Bottom-center anchor | Missing — uses top-left | Affects Y-sorting accuracy | HIGH | 1h |
| 10-20% collision mask | Missing | Need hitbox data per entity | MEDIUM | 2h |
| Interaction volume (24px) | Exists — uses 80px range | Adjustable per-NPC config | LOW | 0.5h |
| **Gameplay Loop** | | | | |
| Quest system | Missing | QuestManager + dependency tree | HIGH | 6h |
| Inventory system | Missing | Item data structures + UI | HIGH | 4h |
| Stamina system | Missing | Stamina drain/regen logic | MEDIUM | 2h |
| Obstacle interaction | Missing | Bramble clearing minigame | MEDIUM | 4h |
| Portal gating | Missing — portals always work | Must check quest completion | HIGH | 1h |
| 13 floors | Partial — only 3 + town | Need 10 more floors | LOW | 10h |
| **Blockchain** | | | | |
| CharacterRegistry contract | Exists | Minor bug fixes needed | — | — |
| DungeonProgress contract | Exists | Major fixes: ECDSA, fund transfer | CRITICAL | 4h |
| Backend blockchain client | Dead code (stubs) | Need to wire up with real contracts | HIGH | 4h |
| Event listener | Missing | Need polling/WebSocket listener | MEDIUM | 3h |
| Wallet-based auth | Missing | Need viem/wagmi integration | CRITICAL | 4h |
| **AI Agents** | | | | |
| NPCAgent runtime | Exists | Economic cycles work | — | — |
| HTTP bridge (not direct DB) | Missing | Cross-service import needs fixing | CRITICAL | 3h |
| LLM integration | Missing | Need OpenAI API + tool-calling | HIGH | 6h |
| Vector DB memory | Missing | Need conversation persistence | MEDIUM | 3h |
| Personality prompts | Missing | Need system prompt per NPC | MEDIUM | 2h |
| Tool abstraction | Missing | Need ToolRegistry | HIGH | 3h |
| **Assets** | | | | |
| Tileset-based environments | Missing | Using procedural rectangles | MEDIUM | 8h |
| Sprite-based characters | Missing | Using procedural geometry | MEDIUM | 6h |
| 13 floor themes | Partial — only 4 themes | Need unique theme per floor | LOW | 10h |
| **Infrastructure** | | | | |
| Linter (Biome) | Missing | Need config + run | MEDIUM | 1h |
| Tests (Vitest) | Missing | Need test suite | MEDIUM | 4h |
| CI/CD | Missing | Need GitHub Actions workflow | MEDIUM | 2h |
| Backend framework (Hono) | Next.js (overkill) | Optional migration | LOW | 4h |
| Persistent DB (SQLite) | In-memory only | Optional but recommended | MEDIUM | 4h |

---

### Total Estimated Effort

| Phase | Hours |
|-------|-------|
| Phase 0: Critical Fixes | 16h |
| Phase 1: Engine Rewrite | 24h |
| Phase 2: Game Systems | 20h |
| Phase 3: AI Agent System | 20h |
| Phase 4: Blockchain Integration | 16h |
| Phase 5: Content & Polish | 30h |
| Phase 6: Infrastructure | 16h |
| **Total** | **~142h (5-6 weeks full-time)** |

---

*This document is a living specification. Update as implementation reveals new constraints or requirements.*
