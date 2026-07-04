# Blockchain & Backend Architecture — Remaining Work

> **Audit Date:** 2026-07-04
> **Files Reviewed:** 18 files across `apps/contracts/`, `apps/backend/`, `apps/client/`

---

## 1. Summary of Current State

| Layer | Status | What exists |
|-------|--------|-------------|
| Smart Contracts | ⚠️ Partial | CharacterRegistry (68 lines), DungeonProgress (141 lines) |
| Contract Tests | ⚠️ Partial | CharacterRegistry.t (4 tests), DungeonProgress.t (4 tests) |
| Backend Blockchain Client | ✅ Exists | `blockchain.ts` — viem read/write for both contracts |
| Event Listener | ⚠️ Dead Code | Created in Hono app, but Hono app is never booted |
| Wallet Integration (Client) | ✅ Works | WalletManager.ts — MetaMask connect + sign |
| Wallet Integration (API Auth) | ✅ Works | `requireAuth()` — EIP-191 signature verification |
| On-Chain NPC/Agent Logic | ❌ Missing | No contract exists |
| Contract Addresses Config | ❌ Missing | `.env` has placeholders |
| Deploy Scripts | ❌ Missing | No Foundry deploy script |

---

## 2. Smart Contracts — What Exists

### 2.1 CharacterRegistry.sol (68 lines)
- `register(name)` — binds name to msg.sender wallet
- `getName(wallet)` — view function
- `isRegistered(wallet)` — check registration
- `transferOwnership(newOwner)` — owner management
- Emits `CharacterRegistered` event

### 2.2 DungeonProgress.sol (141 lines)
- `clearFloor(floorId, signature)` — ECDSA proof-based floor clear
- `claimBounty(floorId)` — claim MON bounty for cleared floor
- Server signer pattern (off-chain signs, on-chain verifies)
- **Only 3 floors hardcoded** (`dungeon_1`, `dungeon_2`, `dungeon_3`)
- Imports OpenZeppelin ECDSA

### 2.3 Contract Tests
- `CharacterRegistry.t.sol` — 4 tests (register, name-too-short, duplicate, getName)
- `DungeonProgress.t.sol` — 4 tests (clear, invalid-proof, invalid-floor, claim-bounty, update-signer)

---

## 3. Remaining Work — By Priority

### CRITICAL (blocks demo)

#### C1: Deploy Contracts to Monad Testnet
- Create `apps/contracts/script/Deploy.s.sol` (Foundry script)
- Deploy CharacterRegistry first, then DungeonProgress with its address
- Set `SERVER_SIGNER_ADDRESS` in env
- **Files:** NEW `script/Deploy.s.sol`
- **Time:** ~30min

#### C2: Wire EventListener into Backend Startup
- The Hono app (`apps/backend/src/index.ts`) creates an EventListener but is NEVER BOOTED
- `next dev` only serves Next.js App Router routes — it doesn't import or run the Hono app
- **Fix:** Either create an `instrumentation.ts` for Next.js, or add event polling directly to a Next.js route
- **Files:** `apps/backend/src/index.ts`, NEW `apps/backend/src/instrumentation.ts`
- **Time:** ~1h

#### C3: Contract Addresses in .env
- `.env.example` has `CHARACTER_REGISTRY_ADDRESS` and `DUNGEON_PROGRESS_ADDRESS` as empty
- Must be populated after deployment
- **Files:** `.env`, `apps/backend/src/lib/blockchain.ts` (already reads them)
- **Time:** ~5min

#### C4: Server Signer Private Key
- `blockchain.ts` reads `NPC_PRIVATE_KEY` for wallet client
- This key must be deployed as `serverSigner` in DungeonProgress constructor
- **Files:** `.env`
- **Time:** ~5min

### HIGH (needed for full loop)

#### H1: EventListener Callbacks Must Sync DB
- Currently callbacks only `console.log()` — they don't actually update the database
- When `FloorCleared` event is detected, should call `db.markFloorCleared()`
- When `BountyClaimed` event is detected, should update player credits
- **Files:** `apps/backend/src/lib/eventListener.ts`, `apps/backend/src/index.ts`
- **Time:** ~1h

#### H2: Add `reputation` Storage to CharacterRegistry.sol (or new contract)
- GAME_SPEC §7 calls for on-chain reputation per NPC per player
- Currently reputation is tracked in an in-memory Map in the backend route
- **Option A:** Add mapping to CharacterRegistry: `mapping(address => mapping(bytes32 => int256)) public reputation;`
- **Option B:** New `NPCRegistry.sol` contract with reputation + agent registration
- **Files:** `apps/contracts/src/CharacterRegistry.sol` or NEW `apps/contracts/src/NPCRegistry.sol`
- **Time:** ~3h

#### H3: Expand DungeonProgress to Support 13 Floors
- Currently only `dungeon_1` `dungeon_2` `dungeon_3` are valid
- Game has 13 floors (`dungeon_1` through `dungeon_13`)
- Add all 13 in constructor, with escalating bounties
- Allow owner to add floors post-deploy (addFloor function)
- **Files:** `apps/contracts/src/DungeonProgress.sol`
- **Time:** ~2h

#### H4: `POST /api/player/[id]` has No Auth
- Player GET endpoint has no signature requirement
- Anyone can look up any player's state
- **Fix:** Add optional signature verification (like other endpoints)
- **Files:** `apps/backend/src/app/api/player/[id]/route.ts`
- **Time:** ~30min

### MEDIUM

#### M1: On-Chain NPC Agent Registry
- GAME_SPEC §7.4 calls for NPCRegistry mapping `npc_id → agent_endpoint_url`
- A contract that stores: NPC ID → agent HTTP endpoint, last heartbeat, active status
- Agents register themselves on-chain, allowing the game to discover them
- **Files:** NEW `apps/contracts/src/AgentRegistry.sol`
- **Time:** ~3h

#### M2: Add ABI Files for forge → backend sync
- ABI files in `apps/backend/src/abis/` are hand-written, not `forge inspect` generated
- Risk of drift: if contracts change, ABIs won't match
- **Fix:** Add a script to `forge inspect` and regenerate ABIs
- **Files:** NEW `scripts/generate-abis.sh`, regeneration of `apps/backend/src/abis/CharacterRegistry.ts` and `apps/backend/src/abis/DungeonProgress.ts`
- **Time:** ~1h

#### M3: `claimBounty` Route Doesn't Call Chain
- Backend `POST /api/dungeon/claim` only marks in-memory DB
- Does NOT call `chain.submitClearFloor()` or `chain.claimBounty()` on Monad
- **Fix:** After DB update, call blockchain write
- **Files:** `apps/backend/src/app/api/dungeon/claim/route.ts`
- **Time:** ~2h

#### M4: `POST /api/dungeon/verify` Doesn't Submit to Chain
- Similar to M3 — verifies and marks in DB but doesn't call `clearFloor()` on Monad
- **Fix:** After DB verify, call `chain.submitClearFloor()` and then `chain.claimBounty()`
- **Files:** `apps/backend/src/app/api/dungeon/verify/route.ts`
- **Time:** ~2h

### LOW

#### L1: Forge Gas Report
- No gas benchmarking for contracts
- `forge test --gas-report` should be run to catch expensive operations
- **Files:** None (CI step)
- **Time:** ~30min

#### L2: Contract Event Indexing
- Event listener polls from block 0 each time (or from `EVENT_LISTENER_START_BLOCK`)
- No checkpoint in DB of last polled block
- **Fix:** Store `lastCheckedBlock` in DB or file
- **Files:** `apps/backend/src/lib/eventListener.ts`
- **Time:** ~1h

#### L3: Backend Test Coverage
- 0 tests for blockchain client, event listener, or any route
- Should at minimum mock viem and test `blockchain.ts` methods
- **Files:** NEW `apps/backend/src/lib/blockchain.test.ts`, `apps/backend/src/lib/eventListener.test.ts`
- **Time:** ~4h

---

## 4. Architecture Diagram (Current vs Required)

### Current Flow
```
Client (WalletManager)
  ↓ signMessage()
Backend API Routes (Next.js)
  ↓ requireAuth()
In-Memory DB (database.ts)
  ↛    EventListener (created but never runs)
  ↛    Smart Contracts (deployed but never called)
```

### Required Flow
```
Client (WalletManager)
  ↓ signMessage()
Backend API Routes (Next.js)
  ↓ requireAuth() + viem read/write
Blockchain Client (blockchain.ts)
  ├─→ Monad (read: getFloorProgress, isRegistered)
  └─→ Monad (write: clearFloor, claimBounty, registerPlayer)
       ↓
EventListener (30s poll)
  ├─→ detects FloorCleared → db.markFloorCleared()
  └─→ detects BountyClaimed → update player credits
Agent Cluster
  ├─→ ToolRegistry → POST /api/npc/reputation → (on-chain eventually)
  └─→ LLMAgent → OpenAI → tool execution
```

---

## 5. Files Touched Per Task

| Task | New Files | Modified Files | Est. Time |
|------|-----------|----------------|-----------|
| C1: Deploy script | `apps/contracts/script/Deploy.s.sol` | — | 30min |
| C2: Wire EventListener | `apps/backend/src/instrumentation.ts` | — | 1h |
| C3: .env config | — | `.env` | 5min |
| C4: Server signer key | — | `.env` | 5min |
| H1: EventListener sync DB | — | `eventListener.ts`, `index.ts` | 1h |
| H2: On-chain reputation | `NPCRegistry.sol` | `CharacterRegistry.sol` | 3h |
| H3: 13 floors | — | `DungeonProgress.sol` | 2h |
| H4: Player endpoint auth | — | `player/[id]/route.ts` | 30min |
| M1: AgentRegistry | `AgentRegistry.sol` | — | 3h |
| M2: ABI auto-gen | `scripts/generate-abis.sh` | 2 ABI files | 1h |
| M3: Claim calls chain | — | `dungeon/claim/route.ts` | 2h |
| M4: Verify calls chain | — | `dungeon/verify/route.ts` | 2h |
| L1: Gas report | — | CI config | 30min |
| L2: Event checkpoint | — | `eventListener.ts` | 1h |
| L3: Backend tests | 2 test files | — | 4h |

**Total estimated remaining:** ~21h

---

## 6. Key Blockers

1. **Hono app never runs** — `apps/backend/src/index.ts` exports a Hono app with EventListener, but nothing boots it. No `instrumentation.ts`, no catch-all route. The event listener is completely dead.
2. **Contracts not deployed** — No `MONAD_RPC_URL`, `CHARACTER_REGISTRY_ADDRESS`, or `DUNGEON_PROGRESS_ADDRESS` configured in any `.env`. Contract addresses are empty strings, so `blockchain.ts:isConfigured()` returns `false` and all chain calls are skipped.
3. **EventListener doesn't sync** — Even if it ran, `onFloorCleared`/`onBountyClaimed` callbacks only log. They never call `db.markFloorCleared()` or update player state.
4. **Backend routes don't submit to chain** — `/api/dungeon/verify` and `/api/dungeon/claim` only update in-memory DB. They never call `chain.submitClearFloor()` or `chain.claimBounty()` on Monad.
