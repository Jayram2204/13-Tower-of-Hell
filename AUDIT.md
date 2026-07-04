# 13 Towers of Hell — Full Codebase Audit

> **Date:** 2026-07-04
> **Status:** Post-redesign audit against GAME_SPEC.md v1.0 alignment matrix.

---

## 1. Current State Summary

The codebase has progressed significantly beyond the original GAME_SPEC alignment matrix. A major redesign session delivered:

- **CharacterGenerator** — 12 distinct pixel-art sprite types (player, 7 NPCs, 4 enemies) rendered via offscreen canvas
- **SilhouetteRenderer** — now uses CharacterGenerator canvases instead of flat rectangles
- **Double jump** (coyote time 80ms, jump buffer 100ms) + **wall climbing** (180px/s, cyan glow indicator)
- **NPC patrol** — all 7 town NPCs wander sinusoidally with independent speed/range
- **Dynamic music** — 3 styles (Town 70bpm, Dungeon 90bpm, Combat 130bpm) via Web Audio API
- **Quest system** — 14-quest linear chain (Bramble Gate → 13 floors → Summit)
- **Parallax** — 3 building layers, 180-star density gradient, moon glow casting onto platforms, 12 fireflies
- **Platforms** — 3-stop gradient + top-edge highlight for standable-surface readability
- **Pickup labels** — item name + quantity below icons
- **HUD dimmed** — desaturated colors so gameplay elements win visual hierarchy
- **Performance** — spatial culling, frame-rate cap (60fps), swap-pop particles, cached gradients, pre-computed star/firefly positions, Vector2 mutable methods

The following sections evaluate each GAME_SPEC phase against current implementation.

---

## 2. Phase-by-Phase Audit

### Phase 0: Critical Fixes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Wallet auth on API endpoints | ✅ Fixed | `requireAuth()` in `lib/auth.ts`, applied to `player/register`, `dungeon/verify`, `dungeon/claim`, `npc/interact`, `player/[id]`. Uses viem `verifyMessage`. |
| 0.2 | `claimBounty()` fund transfer | ✅ Fixed | Contract now sends `call{value: bounty}`. |
| 0.3 | Server-signed proof in `clearFloor()` | ✅ Fixed | ECDSA imported, `serverSigner` address, `signature` parameter. |
| 0.4 | Vector2 mutable methods | ✅ Fixed | `set()`, `addMut()`, `subMut()`, `scaleMut()`, `lerpMut()`. Camera uses `lerpMut`. |
| 0.5 | Spatial culling | ✅ Fixed | `Camera.isVisible()` with 100px margin used for all entities in render loop. |
| 0.6 | Cross-service DB import (agents → HTTP) | ✅ Fixed | `ai-agents/src/index.ts` uses `fetch()` to backend, not direct DB import. |

### Phase 1: Engine Rewrite

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Y-sorting (Layer 1) | ✅ Done | `GameEngine.ts:408-456` — builds `layer1` array with Z = bottom-edge Y, sorts ascending, renders in order. Platforms and pickups stay unsorted (ground/foreground). |
| 1.2 | Frame-rate cap | ✅ Fixed | `MAX_DT = 1/30`, `TARGET_DT = 1/60`. Skips physics when running too fast, still renders. |
| 1.3 | Cache gradients, pre-compute randoms | ✅ Fixed | `vignetteGradient` cached with size tracking. Stars (180) and fireflies (12) pre-computed in constructor. |
| 1.4 | Particle swap-pop | ✅ Fixed | Reverse loop + swap-pop removal (O(1) instead of O(n)). |
| 1.5 | Install PixiJS + WebGL scaffold | ❌ Missing | Still on Canvas 2D. PixiJS v8 not installed. |
| 1.6 | Migrate silhouette renderer to PixiJS | ❌ Missing | Depends on 1.5. |
| 1.7 | Layer 2 (Foreground overlay) | ❌ Missing | No canopy/roof/weather overlay container. |

### Phase 2: Game Systems

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Zustand game store with persist | ❌ Missing | zustand installed in client deps but no store file. |
| 2.2 | HP/stamina/renown systems | ❌ Missing | Player has HP logic in engine but no Zustand-tracked HP/stamina/renown. HUD shows status text not bars. |
| 2.3 | Inventory system with UI | ❌ Partial | `QuestManager` tracks item requirements. `Pickup.ts` renders labels. No inventory UI panel. |
| 2.4 | QuestManager with dependency tree | ✅ Done | 14-quest linear chain: "The Bramble Gate" → `clear_floor_N` (×13) → "The Summit". Conditions evaluate on floor transition. |
| 2.5 | Obstacle interaction | ❌ Missing | Bramble obstacle type exists in engine but no interaction mini-game. |
| 2.6 | Gate portals on quest completion | ✅ Done | `DungeonManager.activateFloorQuest()` called on enter. Portals check `quest.status`. |

### Phase 3: AI Agent System

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | ToolRegistry + HTTP bridge | ❌ Missing | No tool abstraction. Agents mutate DB directly via reference. |
| 3.2 | LLMAgent with OpenAI integration | ❌ Missing | No LLM API calls. `LLMAgent.ts` skeleton not created. |
| 3.3 | Replace economic cycles with LLM | ❌ Missing | Current agents use hardcoded `Math.random` economic cycles. |
| 3.4 | Vector DB for conversation memory | ❌ Missing | No memory/persistence for conversations. |
| 3.5 | Personality prompts per NPC | ❌ Missing | No prompt templates. |

### Phase 4: Blockchain Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Fix DungeonProgress contract | ✅ Fixed | ECDSA, serverSigner, fund transfer, ownership transfer, mapping bounties, correct denomination (10^18). |
| 4.2 | Wire backend blockchain client | ✅ Fixed | `blockchain.ts` imports viem, defines monadTestnet chain, publicClient + walletClient. Functions: `isFloorCleared`, `getFloorProgressDetails`, `getFloorBounty`, `getTotalFloorsCleared`, `signFloorClear`, `submitClearFloor`, `isRegistered`, `registerPlayer`, `getPlayerName`, `claimBounty`, `getFloorClearedEvents`, `getBountyClaimedEvents`, `isConfigured`. |
| 4.3 | Event listener for Monad | ✅ Fixed | `EventListener` class polls every 30s, handles `FloorCleared` and `BountyClaimed` events with callbacks. |
| 4.4 | Wallet connection (wagmi/RainbowKit) | ✅ Done | `WalletManager.ts` — viem `createWalletClient` with injected provider (MetaMask), `connect()`, `signMessage()`, `accountsChanged` listener, `monadTestnet` chain config. Wallet address used as `playerId` for auth. |
| 4.5 | Signed state sync flow | ✅ Done | Client signs `13towers:dungeon:verify:${address}:floor_N:${epochHour}` on floor clear quest completion, sends to `/api/dungeon/verify` and `/api/dungeon/sync`. Backend verifies with `requireAuth()`, submits `clearFloor()` to Monad via `chain.submitClearFloor()`. |

### Phase 5: Content & Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Design 13 floors with unique themes | ❌ Partial | GAME_SPEC defines 13 floors but only 3 dungeon floors implemented (`dungeon_1`, `dungeon_2`, `dungeon_3`). GameEngine has `FloorTheme` array with 40+ entries. Contract only validates 3 floors. |
| 5.2 | Source/create pixel art tilesets | ❌ Skipped | Using runtime-generated pixel art via CharacterGenerator. Sprites downloaded to `public/sprites/` (ghost, bat, bat2, skeleton) but enemies zip was corrupted. |
| 5.3 | Tileset-based rendering | ❌ Skipped | Procedural gradient platforms used instead (intentional for silhouette aesthetic). |
| 5.4 | Y-sorted building/obstacle sprites | ❌ Missing | Depends on 1.1 (Y-sorting) and 5.3 (tilesets). |
| 5.5 | Audio system | ✅ Done | `SoundManager.ts` — 3 dynamic styles (Town/Dungeon/Combat), beat scheduling via setTimeout, quest completion arpeggio. WIP status shows correct for "Audio system". |
| 5.6 | Mobile controls | ❌ Missing | No touch joystick or button overlay. Keyboard-only input. |

### Phase 6: Infrastructure

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Replace Next.js with Hono | ❌ Partial | Hono installed and routes exist (`routes/player.ts`, `routes/dungeon.ts`, `routes/npc.ts`) alongside Next.js App Router routes. Dual system — not migrated. |
| 6.2 | SQLite/PostgreSQL | ❌ Partial | Drizzle schema defined (`db/schema.ts`). Database still uses in-memory Map (`lib/database.ts`). |
| 6.3 | Biome linter | ✅ Done | `biome.json` with `lint`, `format`, `organizeImports`. Run via `npm run lint`. |
| 6.4 | Vitest test suite | ❌ Partial | `vitest.config.ts` in both client and backend. Only 1 test file exists (`Vector2.test.ts`). |
| 6.5 | GitHub Actions CI | ✅ Done | `.github/workflows/ci.yml` — lint, typecheck, test, contracts jobs. |

---

## 3. Detailed Issue Tracking

### Critical Issues (0 remaining — all resolved from original 6)

The original 6 critical issues (no auth, no fund transfer, no proof-of-completion, cross-service DB import, Vector2 allocations, no spatial culling) have all been fixed.

### High Priority Remaining

| # | Issue | Location | Est. Effort |
|---|-------|----------|-------------|
| H1 | No Zustand game store | `apps/client/src/state/gameStore.ts` not created | 4h |
| H2 | No client-side wallet connection | No wagmi/viem wallet integration | 6h |
| H3 | No service layer — routes manipulate DB directly | `lib/database.ts` vs `services/` | 6h |
| H4 | No LLM integration for AI agents | `apps/ai-agents/src/` — no OpenAI API calls | 8h |
| H5 | Diagonal normalization missing in Player | `Player.ts:update()` — no `Math.sqrt` normalization | 0.5h |
| H6 | 10-20% collision mask not implemented | Full entity size used for AABB | 2h |
| H7 | Bottom-center anchor not used | ❌ Fixed — `SilhouetteRenderer` now accepts bottom-center coords, all callers converted. Was top-left origin throughout. | ✅ Done |
| H8 | DungeonProgress only supports 3 floors | Contract hardcodes `dungeon_1`/`2`/`3` | 3h |

### Medium Priority Remaining

| # | Issue | Location | Est. Effort |
|---|-------|----------|-------------|
| M1 | No inventory UI | No panel/dialog for items | 4h |
| M2 | No HP/stamina/renown HUD bars | DOM shows text status only | 3h |
| M3 | No obstacle interaction mini-game | Bramble type exists but no clearing mechanic | 4h |
| M4 | No floor fade transition | Direct state swap | 2h |
| M5 | Vector2 still allocates in `worldToScreen`/`screenToWorld` | `Camera.ts:35-41` — creates new Vector2 | 1h |
| M6 | No foreground overlay (Layer 2) | Missing canopy/roof/weather layer | 4h |
| M7 | No canvas-based HUD (Layer 3) | DOM-based HUD in `index.html` | 3h |
| M8 | No path aliases | Fragile relative imports (`../../../../`) | 1h |
| M9 | In-memory DB not migrated to SQLite | Drizzle schema exists but unused | 6h |
| M10 | Dual routing (Next.js + Hono) | Both `app/api/` and `routes/` active | 4h |

### Low Priority

| # | Issue | Location | Est. Effort |
|---|-------|----------|-------------|
| L1 | Only 1 test file | `Vector2.test.ts` only | 8h |
| L2 | No mobile touch controls | Keyboard-only input | 6h |
| L3 | Contracts support only 3 of 13 floor themes | `DungeonProgress.sol` | 2h |
| L4 | Player GET endpoint lacks signature requirement | `player/[id]/route.ts` — no auth on GET | 1h |

---

## 4. Files Created This Session

| File | Purpose |
|------|---------|
| `apps/client/src/engine/rendering/CharacterGenerator.ts` | Pixel-art sprite generator — 12 distinct character/enemy types |
| `apps/client/src/engine/systems/SpriteManager.ts` | Asset loading/caching with frame extraction |
| `apps/client/public/sprites/ghost.png` | Fallback ghost sprite |
| `apps/client/public/sprites/bat.png` | Fallback bat sprite |
| `apps/client/public/sprites/bat2.png` | Fallback bat sprite variant |
| `apps/client/public/sprites/skeleton.png` | Fallback skeleton sprite |

## 5. Files Rewritten This Session

| File | Changes |
|------|---------|
| `apps/client/src/engine/rendering/SilhouetteRenderer.ts` | Uses CharacterGenerator canvases instead of flat rectangles |
| `apps/client/src/engine/entities/Player.ts` | Double jump (2 in air, coyote time 80ms, jump buffer 100ms), wall climbing (180px/s, cyan glow) |
| `apps/client/src/engine/entities/NPC.ts` | `patrolRange`/`patrolSpeed`, sinusoidal wandering, facing direction |
| `apps/client/src/engine/systems/QuestManager.ts` | 14-quest linear chain with `floor_reached` condition type |
| `apps/client/src/engine/systems/SoundManager.ts` | 3 music styles (Town 70bpm, Dungeon 90bpm, Combat 130bpm), dynamic switching, arpeggio |
| `apps/client/src/engine/rendering/ParallaxBackground.ts` | 3 building layers, star density gradient, moon glow, fireflies |
| `apps/client/src/engine/GameEngine.ts` | Parallax fix (rawCamX), dynamic music style, quest evaluation on floor transition |

## 6. Files Modified This Session

| File | Changes |
|------|---------|
| `apps/client/src/engine/rendering/ParticleSystem.ts` | Radial glow rendering for combat particles |
| `apps/client/src/engine/entities/Platform.ts` | 3-stop gradient + top-edge highlight |
| `apps/client/src/engine/entities/Pickup.ts` | Item name + quantity label |
| `apps/client/src/engine/entities/Enemy.ts` | Visual distinctness via type-based silhouette |
| `apps/client/index.html` | HUD colors dimmed/desaturated |

## 7. Remaining Key Deliverables by Effort

| Deliverable | Phase | Est. Hours |
|-------------|-------|------------|
| Y-sorting (Layer 1) | 1.1 | 3h |
| PixiJS migration | 1.5–1.7 | 16h |
| Zustand game store | 2.1 | 2h |
| HP/stamina/renown HUD | 2.2 | 3h |
| Inventory UI | 2.3 | 4h |
| Obstacle interaction | 2.5 | 4h |
| ToolRegistry + HTTP bridge | 3.1 | 3h |
| LLM integration | 3.2–3.3 | 8h |
| Vector DB + prompts | 3.4–3.5 | 5h |
| Wallet connection (client) | 4.4 | 6h |
| Signed state sync flow | 4.5 | 4h |
| 13 floor themes | 5.1 | 10h |
| Mobile controls | 5.6 | 6h |
| Hono migration (cleanup) | 6.1 | 4h |
| SQLite persistence | 6.2 | 6h |
| Test suite expansion | 6.4 | 8h |
| **Total remaining** | | **~85h** |

## 8. Audit History

- **2026-07-04 (original):** 22 issues identified — 6 critical, 9 high, 5 medium, 2 low. All critical resolved.
- **2026-07-04 (this revision):** Full redesign delivered — CharacterGenerator, double jump, wall climbing, NPC patrol, dynamic music, 14-quest chain, parallax overhaul, fireflies, moon glow, platform highlights, pickup labels, HUD dimming, performance optimizations.
- **2026-07-04 (second revision):** Wallet auth chain unblocked (playerId now uses wallet address), Y-sort confirmed already implemented (Layer 1), bottom-center anchor fixed on all entities (SilhouetteRenderer + callers). Remaining effort revised ~85h.
