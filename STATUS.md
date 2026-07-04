# 13 Towers of Hell — Current Status

> **Last updated:** 2026-07-04
> **Typecheck:** ✅ 0 errors (client + backend)
> **Tests:** ✅ 15/15 passing (client)
> **Vite build:** ✅ succeeds
> **Forge build:** ✅ succeeds

---

## 1. Apps Overview

| App | TypeCheck | Build | Tests | Dev Server |
|-----|-----------|-------|-------|------------|
| `apps/client` | ✅ passes | ✅ builds | ✅ 15/15 | ✅ works on :5173 |
| `apps/backend` | ✅ passes | untested | ❌ 0 tests | ❌ mixed Hono/Next.js |
| `apps/ai-agents` | ❌ not in root script | ❌ never run | ❌ 0 tests | ❌ missing deps |
| `apps/contracts` | n/a | ✅ forge build | untested | n/a |

---

## 2. What's Working

### Client (Game Engine)
- Canvas 2D rendering with parallax backgrounds (4 themes)
- CharacterGenerator — 12 pixel-art sprite types
- SilhouetteRenderer with bottom-center anchor
- Player: movement, double jump (coyote + buffer), wall climbing, attack
- NPCs: 7 town NPCs with sinusoidal patrol, interaction dialog
- Enemies: skeleton, wraith, golem, bat — with AI states (idle/patrol/chase/attack)
- DungeonManager: 13 floors (Town + F1–F13) with platforms, enemies, portals, obstacles
- QuestManager: 14-quest linear chain (Bramble Gate → 13 floors → Summit)
- SoundManager: 3 dynamic music styles (Town 70bpm, Dungeon 90bpm, Combat 130bpm)
- ParticleSystem: radial glow, swap-pop removal, capped at 60fps
- Zustand game store with localStorage persistence
- WalletManager: viem-based wallet connection (MetaMask) + message signing
- NetworkManager: HTTP bridge to backend API
- Spatial culling, frame-rate cap, cached gradients
- **Frosted-glass HUD panel** with HP/STA/Renown bars
- **Monad wallet widget** (top-right) with status dot indicator
- **NPC floating name labels** (proximity-based, above sprite head)
- **Pixel-art pickup icons** with pulsing glint effect

### Backend
- Hono routes: `/api/player/*`, `/api/dungeon/*`, `/api/npc/*`
- Next.js API routes: player register, inventory, dungeon verify/claim/unlock, NPC interact/reputation
- In-memory database with seeded NPCs (7) and dungeon floors (3)
- Blockchain client (viem): Monad testnet integration, read/write to contracts
- EventListener class (polls Monad for FloorCleared/BountyClaimed events)
- Wallet auth via `requireAuth()` with ECDSA signature verification
- Agent API key middleware
- Rate limiting middleware

### Contracts (Solidity)
- CharacterRegistry.sol — register names, resolve wallet → name
- DungeonProgress.sol — floor clearing, bounty claiming, ECDSA proofs
- Forge lint warnings (style) but no errors

### AI Agents
- AgentBase, AgentBus (pub/sub message bus) — working
- CoordinatorAgent, WorkerAgent, HeroAgent, EnemyAgent, TrapAgent, AdminAgent — skeleta exist
- NPC prompts and tool registry defined

---

## 3. Known Issues

### Critical
| # | Issue | Location | Notes |
|---|-------|----------|-------|
| C1 | EventListener never runs | `apps/backend/src/index.ts` | Only instantiated in Hono entrypoint, but only `next dev` is wired. No script starts the Hono server. |
| C2 | Dual routing (Next.js + Hono) | `apps/backend/` | Both `src/app/api/` (Next.js) and `src/routes/` (Hono) duplicate each other. Confusing and half the code is dead. |

### High Priority
| # | Issue | Location | Notes |
|---|-------|----------|-------|
| H1 | AI Agents not in root typecheck | `package.json` | `typecheck` script excludes `apps/ai-agents` |
| H2 | AI Agents missing LLM deps | `apps/ai-agents/package.json` | No OpenAI/Anthropic SDK despite LLMAgent reference |
| H3 | Backend has zero tests | `apps/backend/` | `vitest run -w apps/backend` exits with "No test files found" |
| H4 | In-memory DB only | `apps/backend/src/lib/database.ts` | Drizzle schema exists but unused |
| H5 | No mobile controls | `apps/client/` | Keyboard-only input, no touch joystick |
| H6 | No inventory UI panel | `apps/client/` | Items tracked in store but no visual panel |

### Medium Priority
| # | Issue | Location | Notes |
|---|-------|----------|-------|
| M1 | Contracts support only 3 of 13 floors | `apps/contracts/src/DungeonProgress.sol` | `clearFloor` requires server proof for each floor |
| M2 | `.env` not configured | `.env.example` | All blockchain/API keys are placeholders |
| M3 | No PixiJS migration | `apps/client/` | Still on Canvas 2D, PixiJS planned but not installed |
| M4 | No floor fade transition | `GameEngine.ts` | Direct state swap on floor transition |
| M5 | Diagonal normalization | `Player.ts` | Uses `sqrt` on X only, Y not normalized for platformer |

### Low Priority
| # | Issue | Location | Notes |
|---|-------|----------|-------|
| L1 | Only 1 test file across entire project | `Vector2.test.ts` | No tests for backend, agents, or contracts |
| L2 | No SQLite persistence | `apps/backend/` | Data lost on server restart |
| L3 | No path aliases | Fragile relative imports like `../../../../` | |

---

## 4. Build Output

### Client
```
vite v5.4.21 building for production...
✓ 454 modules transformed
dist/index.html                 9.79 kB │ gzip: 2.44 kB
dist/assets/ccip-*.js           4.72 kB │ gzip: 2.02 kB
dist/assets/secp256k1-*.js     27.82 kB │ gzip: 10.82 kB
dist/assets/index-*.js         264.38 kB │ gzip: 77.87 kB
```

### Contracts
```
forge build — No files changed, compilation skipped
```
Lint notes are style-only (unaliased imports, snake_case immutables, unwrapped modifiers).

---

## 5. Commands

```bash
# Development
npm run dev:client        # Vite dev server on :5173
npm run dev:backend       # Next.js dev server on :3000
npm run dev:agents        # AI agent cluster (tsx watch)

# Build
npm run build:client      # tsc + vite build
npm run build:backend     # next build
npm run build:contracts   # forge build

# Check
npm run typecheck         # tsc --noEmit (client + backend)
npm run lint              # biome check .
npm run lint:fix          # biome check --apply .
npm run format            # biome format --write .

# Test
npm run test              # vitest (client + backend)
npm run test:client       # vitest (client only)
npm run test:watch        # vitest watch mode

# Full build
npm run build             # contracts → backend → client
npm run dev               # client + backend concurrently
```
