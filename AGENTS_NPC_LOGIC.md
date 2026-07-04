# 13 Towers of Hell — Agents & NPC Logic

> **Date:** 2026-07-04
> **Source:** Direct code audit of `apps/ai-agents/` (2,469 lines, 18 files) and `apps/client/src/` NPC subsystem (9 files).
> **Cross-referenced:** AUDIT.md, GAME_SPEC.md §7.

---

## 1. Client-Side NPC System

### 1.1 NPC Spawning

`DungeonManager.getTownNPCs()` creates 7 town NPCs, all placed on Floor 0 (Town Square). No dungeon floors have NPCs.

| ID | Name | Title | Type | Position | Patrol Range |
|---|---|---|---|---|---|
| `gatekeeper` | GATEKEEPER | Town Gate | gatekeeper | (400, 390) | 20 |
| `registrar` | REGISTRAR | Identity Keeper | registrar | (700, 310) | 15 |
| `teo_merchant` | TEO | Traveling Merchant | **merchant** | (900, 500) | 25 |
| `blacksmith` | DURIN | Blacksmith | blacksmith | (1200, 290) | 10 |
| `mage` | LYRA | Mage of the Arcane | mage | (1500, 370) | 20 |
| `manager` | ALDRIC | Town Manager | manager | (1800, 290) | 12 |
| `bounty` | REAVER | Bounty Admin | bounty | (2200, 390) | 18 |

**Spawning flow:** `DungeonManager.buildFloors()` → `getTownNPCs()` → returns `NPC[]` → assigned to `FloorData.npcs` → `GameEngine.init()` reads `this.npcs = floor.npcs`.

### 1.2 NPC Update Loop (per frame)

```
GameEngine.update(dt)
  ├─ for each npc:
  │   ├─ npc.update(dt)              → sinusoidal patrol (Math.sin * range)
  │   ├─ npc.updateInteraction(player, input) → proximity check + E key
  │   └─ if npc.interacted:
  │       ├─ GameEngine.handleNPCInteraction(npc)
  │       │   ├─ sets npcDispositions[floor][npcId] = 1
  │       │   ├─ gatekeeper → gives name + 100 credits
  │       │   ├─ teo_merchant → trade logic (5 glow berries → Rusty Axe)
  │       │   └─ all others → delegates to main.ts UI handler
  │       ├─ questManager.evaluate("floor_1_entry")
  │       └─ npc.interacted = false
```

### 1.3 NPC Interaction Dispatch

**GameEngine** handles 2 NPC types with game logic:
- `gatekeeper`: Sets player name to "Wanderer", adds 100 credits
- `teo_merchant`: Checks 5 glow berries → removes them → gives "Rusty Axe" + 50 renown + floor 1 portal unlock

**main.ts** handles 6 NPC types with UI overlays:
- `gatekeeper`: "TOWN GATE" overlay
- `registrar`: Browser prompt → set name → register with server
- `blacksmith`: Sells iron_sword for 50 credits
- `mage`: Sells health_potion for 30 credits (if not at full HP)
- `bounty`: Bounty board overlay
- `manager`: Town ledger flavor text

### 1.4 NPC Dialog

- Dialog auto-advances every **2.5 seconds** (hardcoded)
- No player-controlled skip or selection
- Dialog text rendered as word-wrapped text box above NPC

### 1.5 NPC Rendering

`SilhouetteRenderer.drawNPC()`:
- Generates procedural sprite via `CharacterGenerator` (keyed by NPC type)
- Draws at 48×80 pixels (scaled from 32×40 source)
- Name label: bold white text on black backplate (presentation-safe palette)

### 1.6 Zustand Store NPC State

```typescript
// apps/client/src/state/gameStore.ts
FloorState.npcDispositions: Record<string, number>  // npcId → disposition value
setNpcDisposition(floor, npcId, value)               // called on every NPC interaction
```

### 1.7 Client-Side NPC-Quest Connection

Only **1 quest** uses NPC interaction:
- `floor_1_entry` ("The Bramble Gate") requires `npc_interacted` with target `"teo_merchant"` and threshold ≥ 1

---

## 2. Client-Side NPC Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| N1 | **`teo_merchant` type mismatch** — `DungeonManager` sets `type: "merchant"` but `GameEngine` switches on `case "teo_merchant"`. The trade case never matches. | `DungeonManager.ts:370` vs `GameEngine.ts:276` | **Bug** |
| N2 | `patrolSpeed` declared but never used — patrol is purely sine-based at fixed angular rate | `NPC.ts:56` | Latent bug |
| N3 | `NetworkManager.interactNPC()` is dead code — never called from any file | `NetworkManager.ts:22-34` | Dead code |
| N4 | NPC type `"quest_giver"` declared in union but never instantiated or handled | `NPC.ts:6` | Unused |
| N5 | Dialog has no player-controlled skip — purely timer-based | `NPC.ts:92-104` | Missing feature |
| N6 | Only 7 NPCs exist, all on Town floor — 13 dungeon floors have zero NPCs | `DungeonManager.ts:349-402` | Content gap |

---

## 3. AI Agent System

### 3.1 Architecture Overview

```
apps/ai-agents/src/
├── index.ts                    # Entrypoint, auto-starts agents
├── core/
│   ├── types.ts                # AgentType, AgentMessage, AgentConfig (57 lines)
│   ├── AgentBase.ts            # Abstract base class (114 lines)
│   ├── AgentBus.ts             # In-process pub/sub message bus (65 lines)
│   └── npc-mapping.ts          # Agent→NPC slot registry (68 lines)
├── agents/
│   ├── agent-lifecycle.ts      # startAgents/stopAgents/publishEvent (114 lines)
│   ├── CoordinatorAgent.ts     # Central message router + health monitor (123 lines)
│   ├── AdminAgent.ts           # Floor governance (148 lines)
│   ├── WorkerAgent.ts          # NPC economics + LLM dialogue (249 lines)
│   ├── LLMAgent.ts             # OpenAI gpt-4o-mini integration (257 lines)
│   ├── EnemyAgent.ts           # Enemy difficulty scaling (114 lines)
│   ├── HeroAgent.ts            # Player progression tracking (143 lines)
│   ├── TrapAgent.ts            # Trap state management (130 lines)
│   └── NPCAgent.ts             # Legacy standalone NPC manager (207 lines)
├── tools/
│   └── registry.ts             # HTTP bridge to backend API (163 lines)
├── prompts/
│   └── npc-prompts.ts          # 7 NPC personality definitions (150 lines)
└── memory/
    └── store.ts                # In-memory conversation store (104 lines)
```

**Total:** 18 files, **2,469 lines** of TypeScript.

### 3.2 Agent Topology (from `npc-mapping.ts`)

| Agent ID | Type | Manages NPCs | Tick Interval |
|----------|------|-------------|---------------|
| `coordinator_01` | Coordinator | — | 5s |
| `admin_01` | Admin | — | 20s |
| `worker_01` | Worker | teo_merchant, durin_blacksmith, lyra_mage | 30s |
| `worker_02` | Worker | aldric_manager, reaver_bounty, gatekeeper, registrar | 30s |
| `enemy_01` | Enemy | skeleton, wraith, golem, bat | 10s |
| `trap_01` | Trap | 6 traps (brambles→doom_barrier) | 15s |
| `hero_01` | Hero | — (per-player tracking) | 30s |

### 3.3 Agent Lifecycle

```
index.ts
  └─ startAgents()
       ├─ Creates AgentBus (in-process pub/sub)
       ├─ Instantiates all 6 agent types from npc-mapping slots
       ├─ Starts all agents (each registers subscriptions + tick loop)
       └─ Sets up 15s heartbeat broadcast

publishEvent(type, payload)  →  bus.publish()  →  Coordinator routes  →  target agent(s) handle
```

### 3.4 Message Flow

```
External event → publishEvent("player_interaction", {playerId, npcId, input})
  → CoordinatorAgent resolves NPC→agent mapping via resolveAgentForNpc()
  → Forwards to correct WorkerAgent
  → WorkerAgent delegates to LLMAgent.processInteraction()
  → LLMAgent calls OpenAI gpt-4o-mini with system prompt + tools
  → LLMAgent executes tool calls via ToolRegistry (HTTP to backend)
  → Returns { dialogue, actions } back through the chain
```

### 3.5 Agent Details

#### CoordinatorAgent (123 lines)
- Central message router
- Subscribes to 7 message types
- Health monitor: detects agents offline after 60s heartbeat timeout
- Routes player interactions to correct worker via `resolveAgentForNpc()`

#### AdminAgent (148 lines)
- Governs all 14 floors (0-13)
- Manages unlock progression, difficulty scaling
- `FloorGovernance[]` with per-floor: isUnlocked, difficultyTier, minRenown, requiredClears, currentClears
- Auto-adjusts `globalDifficultyOffset` (+0.05/tick if >3 active floors, cap 1.0)
- Handles admin commands: `global_difficulty_up/down`, `reset_tower`

#### WorkerAgent (249 lines)
- Manages NPC economic state: credits, priceModifier, inventory, reputation
- Per-NPC economic state with default credits (Teo: 200, Durin: 500, Lyra: 300, Aldric: 1000, Reaver: 2000, Gatekeeper: 100, Registrar: 50)
- Creates `LLMAgent` instance per NPC (passes `OPENAI_API_KEY`)
- Economic cycle: supply/demand pricing, random item crafting, reputation drift
- Fallback dialog generation when no LLM available

#### LLMAgent (257 lines)
- **The core LLM integration.** Each instance = one NPC's AI brain.
- Calls OpenAI `gpt-4o-mini` via raw `fetch` (no SDK dependency)
- System prompt built from: NPC personality + player context + knowledge + response rules + tool descriptions
- Function-calling with 4 tools: `grant_item`, `modify_reputation`, `unlock_portal`, `generate_quest`
- Conversation history: last 10 turns sent to LLM, max 20 stored
- Falls back to template responses when API key is `"sk-placeholder"`
- Stores messages in `MemoryStore` for future semantic search

#### EnemyAgent (114 lines)
- Enemy difficulty scaling across 13 dungeon floors
- Per-floor config: HP/damage/spawn multipliers, enemy count, type pool
- "Player advantage" scaling: revisiting lower floors gets +10% HP/floor, +5% DMG/floor
- Group aggro system: 3s cooldown

#### HeroAgent (143 lines)
- Tracks per-player progression: floor, renown, quests, kills, deaths
- Evaluates quest conditions: `floor_reached`, `renown_required`, `enemies_killed`
- Awards renown and chains to next quest on completion

#### TrapAgent (130 lines)
- 6 named traps with per-trap state
- 4 pattern types: `single`, `timed`, `proximity`, `sequence`
- Cooldown management via tick-based decrement
- Sequence-pattern traps use `setTimeout` for reactivation

#### NPCAgent (207 lines) — LEGACY/INDEPENDENT
- **Does NOT extend `AgentBase`** — standalone earlier implementation
- Requires external `DBLike` adapter (not provided)
- Runs own `setInterval` cycles per NPC type
- Type-specific economic behaviors (blacksmith forging, mage brewing, etc.)
- **Not integrated with the bus system** — dead code relative to the main agent cluster

### 3.6 Tool Registry (HTTP Bridge)

| Tool | Backend Endpoint | Method |
|------|-----------------|--------|
| `getPlayer` | `/api/player/:id` | GET |
| `grantItem` | `/api/player/inventory` | POST |
| `modifyReputation` | `/api/npc/reputation` | POST |
| `unlockPortal` | `/api/dungeon/unlock` | POST |
| `generateQuest` | `/api/quests/evaluate` | POST |
| `npcInteract` | `/api/npc/interact` | POST |

All authenticated via `X-Agent-Key` header.

### 3.7 NPC Prompts (7 defined)

| NPC ID | Name | Title | Personality |
|--------|------|-------|-------------|
| `gatekeeper` | GATEKEEPER | Town Gate Warden | Stern, protective, cryptic |
| `registrar` | REGISTRAR | Identity Keeper | Mysterious, formal |
| `teo_merchant` | TEO | Traveling Merchant | Cheerful, opportunistic |
| `durin_blacksmith` | DURIN | Master Blacksmith | Gruff, honest, practical |
| `lyra_mage` | LYRA | Mage of the Arcane | Wise, cryptic, helpful |
| `aldric_manager` | ALDRIC | Town Manager | Formal, bureaucratic |
| `reaver_bounty` | REAVER | Bounty Admin | Tough, no-nonsense |

### 3.8 Conversation Memory

- `MemoryStore`: in-memory array, capped at 1000 records (FIFO eviction)
- `search()`: keyword-based matching (not semantic/vector)
- `recall()`: up to 20 records per player+NPC pair
- `ChromaAdapter`: **stub** — logs but does not connect to ChromaDB
- `MemoryRecord.embedding`: field exists but always `undefined`

---

## 4. Agent System Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| A1 | **No root `typecheck` for agents** — `package.json` excludes `apps/ai-agents` | `package.json:8` | Structural |
| A2 | **No tests** — zero test files in `apps/ai-agents/` | — | Structural |
| A3 | **LLM API key is `"sk-placeholder"`** — all NPC dialogue falls back to templates | `WorkerAgent.ts:46` | Placeholder |
| A4 | **`ChromaAdapter` is a stub** — does not connect to ChromaDB, all queries go to in-memory | `memory/store.ts:56-104` | Placeholder |
| A5 | **`MemoryRecord.embedding` always undefined** — no embedding model integrated | `memory/store.ts:3` | Placeholder |
| A6 | **`NPCAgent.ts` is legacy dead code** — does not integrate with bus, not started by lifecycle | `agents/NPCAgent.ts` | Dead code |
| A7 | **`NPCAgent.ts` `DBLike.getAllDungeons()`** — declared but never called | `NPCAgent.ts:8` | Dead interface |
| A8 | **Agent cluster never runs** — no script starts the process; only `next dev` is wired | `package.json` scripts | Structural |
| A9 | **OpenAI via raw `fetch`** — no retry, no streaming, no error recovery | `LLMAgent.ts:130-180` | Fragile |
| A10 | **ToolRegistry HTTP calls** — no retry, no timeout, no circuit breaker | `tools/registry.ts` | Fragile |

---

## 5. GAME_SPEC vs Implementation

### GAME_SPEC §7 (AI Agent Bridge) Alignment

| Spec Requirement | Status | Implementation |
|-----------------|--------|----------------|
| NPC agent runtime | ✅ Exists | `NPCAgent.ts` (legacy) + full agent cluster |
| Economic cycles | ✅ Exists | `WorkerAgent.ts` + `NPCAgent.ts` |
| Tool-based agent design | ✅ Exists | `ToolRegistry` with 6 HTTP tools |
| LLM integration | ✅ Exists | `LLMAgent.ts` → OpenAI `gpt-4o-mini` |
| HTTP bridge to agents | ✅ Exists | `ToolRegistry` via `fetch()` |
| Personality prompts | ✅ Exists | `npc-prompts.ts` — 7 NPC definitions |
| Vector DB memory | ⚠️ Stub | `MemoryStore` in-memory only, `ChromaAdapter` placeholder |
| Conversation memory | ✅ Exists | Per-NPC `ConversationTurn[]` (max 20) |

### Client-Side NPC System Alignment

| Spec Requirement | Status | Implementation |
|-----------------|--------|----------------|
| NPC spawning/placement | ✅ Done | 7 NPCs on Town floor |
| NPC patrol | ✅ Done | Sinusoidal wandering |
| NPC dialog | ✅ Done | Auto-advancing text boxes |
| NPC interaction | ✅ Done | E key proximity trigger |
| NPC→Quest connection | ✅ Done | `npcDispositions` in store |
| NPC types on dungeon floors | ❌ Missing | 13 dungeon floors have 0 NPCs |
| NPC-driven portal unlocking | ✅ Done | Teo merchant unlocks floor 1 |
| NPC reputation system | ⚠️ Partial | `npcDispositions` tracked but only binary (0/1) |

---

## 6. Data Flow Summary

### Client NPC Interaction (current working flow)
```
Player presses E near NPC
  → NPC.interacted = true
  → GameEngine.handleNPCInteraction(npc)
    → store.setNpcDisposition(floor, npcId, 1)
    → type-specific game logic (items, credits, overlays)
    → questManager.evaluate("floor_1_entry")
  → main.ts UI handler (overlay/prompt)
  → NPC.dialog[] auto-advances for 2.5s each
```

### Agent Cluster (built but never started)
```
publishEvent("player_interaction", {playerId, npcId, input})
  → CoordinatorAgent → resolveAgentForNpc(npcId) → WorkerAgent
  → WorkerAgent → LLMAgent.processInteraction()
    → OpenAI gpt-4o-mini (function calling)
    → ToolRegistry.execute() → HTTP POST to backend
  → { dialogue, actions } returned
```

### Gap: Client ↔ Agent Cluster
The client-side NPC interaction (Section 1) and the agent cluster (Section 3) are **completely disconnected**. The client never calls `publishEvent()`. The backend `POST /api/npc/interact` endpoint exists but `NetworkManager.interactNPC()` is never invoked. The agent cluster is built but has no entry point that actually runs.

---

## 7. Test Coverage

### What exists
- `apps/client/src/engine/Vector2.test.ts` — 15 tests (Vector2 math only)
- No tests for NPC logic, agent logic, or any NPC-related code

### What's missing
- NPC patrol movement tests
- NPC interaction proximity tests
- NPC dialog auto-advance tests
- Agent bus pub/sub tests
- Agent lifecycle (start/stop) tests
- CoordinatorAgent routing tests
- AdminAgent floor governance tests
- WorkerAgent economic cycle tests
- LLMAgent fallback response tests
- EnemyAgent difficulty scaling tests
- HeroAgent quest evaluation tests
- TrapAgent cooldown tests
- ToolRegistry HTTP bridge tests
- MemoryStore insert/search/recall tests
