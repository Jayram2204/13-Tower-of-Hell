# 13 Towers of Hell

> **A Server-Authoritative Agentic Platformer RPG** built natively on the ultra-fast, parallelized **Monad EVM Network**. Every entity is an independent autonomous agent backed by its own dedicated smart contract layer.

---

## ───■  [ 13 TOWERS OF HELL ]  ■───

### ───■     MONAD AGENTIC RPG   ■───

---

<img width="1459" height="786" alt="image" src="https://github.com/user-attachments/assets/e25bf2a0-32cd-47b9-8cb2-9b75363dc055" />


## 1. Executive Summary & The "Hook"

Most Web3 games are simply Web2 frontends with a token wrapper or basic NFT cosmetic layer. **13 Towers of Hell** flips this paradigm entirely. It is a completely dynamic, server-authoritative 2D platforming action RPG where **zero game state text or entity behaviors are hardcoded.**

The entire loop runs as an **"Agentic Ecosystem within Agents."** Every single NPC, enemy cluster, and environment trap acts as an autonomous engine instance operating through **its own dedicated stateful smart contract** on the Monad network. By leveraging Monad's parallel execution and lightning-fast block times, the game orchestrates real-time inter-agent microtransactions, dynamic supply-and-demand market price adjustments, and dynamic player reputation curves—entirely on-chain.

---

## 2. System Architecture & Dynamic Loop

The client application operates strictly as a lean, low-overhead rendering engine ("Vantage Point") processing Canvas 2D layouts asynchronously, keeping state processing completely isolated.

```
                  ┌─────────────────────────────────┐
                  │      GAME CLIENT (Vite)         │
                  │   Canvas 2D Rendering Pipe     │
                  └────────────────┬────────────────┘
                                   │
                                   │ (1) Asynchronous signed actions
                                   ▼
                  ┌─────────────────────────────────┐
                  │    NEXT.JS / HONO BACKEND       │
                  │       API Gateway Router        │
                  └────────────────┬────────────────┘
                                   │
                                   │ (2) Proxied System Event
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                 AI AGENT MICROSERVICE CLUSTER               │
    │  [CoordinatorAgent] ──► Routes payloads dynamically        │
    │         │                                                   │
    │         ├─► [WorkerAgents] ──► [LLMAgents] (Nemotron Ultra) │
    │         ├─► [EnemyAgents]  ◄── [AdminAgents]                │
    │         └─► [TrapAgents]                                    │
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   │ (3) Cryptographic validation
                                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                 MONAD EVM TESTNET LAYER                     │
    │   - Dedicated Smart Contracts per Autonomous Agent Type      │
    │   - CharacterRegistry.sol & DungeonProgress.sol            │
    └─────────────────────────────────────────────────────────────┘

```

### Core Architecture Highlights:

* **The Network Bridge Gateway:** When a player approaches an NPC and types a custom narrative prompt, the action bypasses rigid client variables, passing an EIP-191 signature through a secure proxy handler out to the agent microservices on port `4000`.
* **Context-Aware Dialog Loops:** The `WorkerAgent` cluster queries the player's real-time metadata (on-chain reputation coefficients, active balances, cleared dungeon history) via the unified `ToolRegistry` to build dynamic system templates passed to the **Nemotron 3 Ultra** processing engine.
* **Cryptographic Attestation Settlement:** Clearing any of the 13 vertical dungeon structures triggers a validation check by our automated security agents. This emits an ECDSA signature, settling verification immediately on the `DungeonProgress.sol` smart contract for instant, gas-efficient payouts.


<img width="1461" height="828" alt="image" src="https://github.com/user-attachments/assets/c5dac3c3-11ba-48f0-92cf-5b80f8e98403" />


## 3. Decentralized Agentic Ecosystem Matrix

Every primary role across the network functions via a uniquely structured, purpose-built agent:

| Agent Identifier | Core Architecture Mapping | Functionality Scope | On-Chain Responsibility |
| --- | --- | --- | --- |
| **Coordinator** | `CoordinatorAgent.ts` | Central message bus router & microservice health watchdog | Manages global address routing and service validation mappings. |
| **Admin Governance** | `AdminAgent.ts` | Tracks global dungeon clears and auto-scales world difficulty offsets | Sets required thresholds and clears tracking parameters on-chain. |
| **Worker System** | `WorkerAgent.ts` | Directs economy loops, supply-demand swings, and live pricing | Dictates dynamic transaction pricing shifts across merchant inventories. |
| **Enemy AI Group** | `EnemyAgent.ts` | Adjusts behavior states, stat vectors, and aggressive pathfinding arrays | Updates baseline attributes per floor target based on difficulty. |
| **Trap Control** | `TrapAgent.ts` | Orchestrates trap trigger patterns, sequence layouts, and cool-downs | Records defensive threat indicators natively across network layers. |

<img width="326" height="585" alt="image" src="https://github.com/user-attachments/assets/f55f7a51-2228-417c-8838-e81a9f0ff968" />


## 4. Solidity Smart Contracts (`apps/contracts/`)

All contracts are built with security and gas efficiency at their core, optimized specifically for the parallel execution pipeline of Monad.

### `CharacterRegistry.sol`

* Registers unique player aliases and maps public wallet keys directly to character identities.
* Houses global tracking arrays, mapping user accounts securely across downstream components.

### `DungeonProgress.sol`

* Implements an ECDSA-based cryptographic verification verification system.
* Requires valid server signatures to process `clearFloor` operations.
* Supports all 13 primary gameplay levels with scaling token bounty structures, avoiding manual client overrides.



## 5. Technical Stack Breakdown

* **Client Viewport Component:** TypeScript, Canvas 2D Engine, Zustand State Hub, `viem` Client Utilities.
* **API Orchestration Layer:** Next.js, Hono API Framework, Drizzle ORM Database Connectors.
* **Smart Contract Pipeline:** Solidity `0.8.27`, Foundry Toolkit, OpenZeppelin Cryptographic Suite.
* **Agent Automation Engine:** Node.js Runtime environment, Core Agent Bus Architecture, Nemotron 3 Ultra LLM Integration.
* **Deployment Endpoint:** Monad EVM Testnet (Chain ID: `10143`).

---

## 6. Local Quick-Start Framework

### Prerequisites

Ensure your local environment includes Node.js (v20+) and the Foundry compilation library:

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup

```

### Setup & Multi-Process Ignition

```bash
# 1. Install required workspace dependencies
npm install

# 2. Duplicate environment configuration parameters
cp .env.example .env

# 3. Boot all microservices, backend routers, and the UI client concurrently
npm run dev

```

*Your local console will show Vite active on `:5173`, the Next.js framework active on `:3000`, and the background Agent engine listening on `:4000`.*

---

## 7. Presenter-Safe Visual Framework

The game's front-end features a custom theme designed to prevent visibility issues on projection screens during evening events:

* **High-Luminance Matte Backing:** Canvas background clearing layers utilize a deep, near-black space shade (`#030205`), which absorbs ambient room light and completely eliminates projector bleed.
* **Luminous Depth Outlines:** Game characters are drawn as distinct deep slate silhouettes (`#2A2A3A`) highlighted by an aggressive, glowing neon-gold border stroke (`#FFD700`) with high-intensity blur shadows, ensuring complete readability from the back of the room.
