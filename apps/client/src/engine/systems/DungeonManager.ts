import { Vector2 } from "../Vector2";
import { Enemy } from "../entities/Enemy";
import { NPC, type NPCConfig } from "../entities/NPC";
import { Obstacle } from "../entities/Obstacle";
import { Platform } from "../entities/Platform";
import { Portal } from "../entities/Portal";
import { NetworkManager } from "./NetworkManager";

export interface FloorData {
  id: string;
  name: string;
  theme: string;
  platforms: Platform[];
  npcs: NPC[];
  enemies: Enemy[];
  portals: Portal[];
  obstacles: Obstacle[];
}

interface DifficultyOverride {
  hpMult: number;
  dmgMult: number;
  enemyCount: number;
  groupAggro: boolean;
}

function p(x: number, y: number, w: number, t: "ground" | "wall" | "ledge" | "floor" = "ledge"): Platform {
  return new Platform(x, y, w, 16, t);
}

function ground(): Platform {
  return new Platform(0, 590, 3200, 40, "floor");
}

function portal(x: number, y: number, label: string): Portal {
  return new Portal(x, y, 60, 80, label);
}

function eBat(x: number, y: number, dmg: number, hp: number, renown: number = 5): Enemy {
  return new Enemy({ x, y, enemyType: "bat", patrolRange: 100, detectionRange: 200, attackRange: 30, attackDamage: dmg, attackCooldown: 1.5, attackWindup: 0.2, maxHp: hp, speed: 160, renownReward: renown });
}
function eSkel(x: number, y: number, dmg: number, hp: number, renown: number = 10): Enemy {
  return new Enemy({ x, y, enemyType: "skeleton", patrolRange: 80, detectionRange: 220, attackRange: 35, attackDamage: dmg, attackCooldown: 2, attackWindup: 0.4, maxHp: hp, speed: 80, renownReward: renown });
}
function eWraith(x: number, y: number, dmg: number, hp: number, renown: number = 12): Enemy {
  return new Enemy({ x, y, enemyType: "wraith", patrolRange: 100, detectionRange: 250, attackRange: 35, attackDamage: dmg, attackCooldown: 2.5, attackWindup: 0.3, maxHp: hp, speed: 100, renownReward: renown });
}
function eGolem(x: number, y: number, dmg: number, hp: number, renown: number = 25): Enemy {
  return new Enemy({ x, y, enemyType: "golem", patrolRange: 60, detectionRange: 180, attackRange: 30, attackDamage: dmg, attackCooldown: 3, attackWindup: 0.8, maxHp: hp, speed: 50, renownReward: renown });
}

const BASE_ENEMY_STATS: Record<string, { hp: number; dmg: number; renown: number }> = {
  bat: { hp: 20, dmg: 8, renown: 5 },
  skeleton: { hp: 40, dmg: 12, renown: 10 },
  wraith: { hp: 30, dmg: 15, renown: 12 },
  golem: { hp: 100, dmg: 25, renown: 25 },
};

export class DungeonManager {
  private floors: FloorData[] = [];
  currentFloorIndex = 0;
  private networkManager: NetworkManager;

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager;
  }

  async init(): Promise<void> {
    const diff = await this.tryFetchDifficulty(1);
    this.buildFloors(diff);
  }

  private async tryFetchDifficulty(floor: number): Promise<DifficultyOverride | null> {
    try {
      const d = await this.networkManager.getDifficulty(floor);
      if (d) {
        return {
          hpMult: d.hpMultiplier,
          dmgMult: d.damageMultiplier,
          enemyCount: d.enemyCount,
          groupAggro: d.groupAggro,
        };
      }
    } catch { /* fall through */ }
    return null;
  }

  private getEnemyStats(enemyType: string, diff: DifficultyOverride | null): { hp: number; dmg: number; renown: number } {
    const base = BASE_ENEMY_STATS[enemyType] || { hp: 30, dmg: 10, renown: 5 };
    if (!diff) return base;
    return {
      hp: Math.round(base.hp * diff.hpMult),
      dmg: Math.round(base.dmg * diff.dmgMult),
      renown: Math.round(base.renown * diff.hpMult),
    };
  }

  private buildFloors(diff: DifficultyOverride | null): void {
    const d = (type: string) => this.getEnemyStats(type, diff);
    this.floors = [
      this.buildTown(),
      this.buildFloor1(d),
      this.buildFloor2(d),
      this.buildFloor3(d),
      this.buildFloor4(d),
      this.buildFloor5(d),
      this.buildFloor6(d),
      this.buildFloor7(d),
      this.buildFloor8(d),
      this.buildFloor9(d),
      this.buildFloor10(d),
      this.buildFloor11(d),
      this.buildFloor12(d),
      this.buildFloor13(d),
    ];
  }

  private buildTown(): FloorData {
    return {
      id: "town", name: "TOWN SQUARE", theme: "town",
      platforms: [ground(), p(300,460,160), p(600,380,140), p(900,460,160), p(1150,360,140), p(1400,440,160), p(1700,360,140), p(1950,460,160), p(2200,380,140), p(2500,460,160), p(2800,360,400)],
      npcs: this.getTownNPCs(), enemies: [],
      portals: [portal(3100,340,"DUNGEON F1")], obstacles: [],
    };
  }
  private buildFloor1(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const b = stat("bat"), s = stat("skeleton");
    return { id: "dungeon_1", name: "DUNGEON FLOOR 1", theme: "dungeon_1",
      platforms: [ground(), p(200,480,120), p(450,400,100), p(700,500,120), p(950,380,100), p(1150,460,140), p(1400,360,100), p(1650,460,120), p(1900,380,100), p(2150,480,120), p(2400,360,100), p(2700,460,140), p(2950,360,250)],
      npcs: [], enemies: [eBat(500,530,b.dmg,b.hp,b.renown), eBat(1200,530,b.dmg,b.hp,b.renown), eSkel(2000,400,s.dmg,s.hp,s.renown)],
      portals: [portal(3100,340,"DUNGEON F2")],
      obstacles: [new Obstacle(3000,310,60,50,"gateway_brambles","GATEWAY BRAMBLES","Thick thorny vines block the path.",3,"rusty_axe",15)],
    };
  }
  private buildFloor2(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const s = stat("skeleton"), w = stat("wraith");
    return { id: "dungeon_2", name: "DUNGEON FLOOR 2", theme: "dungeon_2",
      platforms: [ground(), p(150,510,80), p(350,420,100), p(580,480,80), p(780,360,100), p(1000,440,80), p(1220,360,120), p(1480,460,80), p(1700,360,100), p(1950,440,80), p(2180,360,120), p(2450,460,80), p(2680,360,100), p(2900,460,300)],
      npcs: [], enemies: [eSkel(400,350,s.dmg,s.hp,s.renown), eWraith(900,530,w.dmg,w.hp,w.renown), eSkel(1600,530,s.dmg,s.hp,s.renown), eWraith(2400,350,w.dmg,w.hp,w.renown)],
      portals: [portal(3100,340,"DUNGEON F3")], obstacles: [],
    };
  }
  private buildFloor3(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const s = stat("skeleton"), g = stat("golem"), w = stat("wraith");
    return { id: "dungeon_3", name: "DUNGEON FLOOR 3", theme: "dungeon_3",
      platforms: [ground(), p(100,520,60), p(280,440,80), p(480,520,60), p(660,420,80), p(860,500,60), p(1050,400,80), p(1260,480,60), p(1460,380,80), p(1680,460,60), p(1880,380,100), p(2120,460,60), p(2340,380,80), p(2560,460,60), p(2760,380,80), p(2950,340,250)],
      npcs: [], enemies: [eSkel(300,530,s.dmg,s.hp,s.renown), eGolem(700,530,g.dmg,g.hp,g.renown), eWraith(1300,530,w.dmg,w.hp,w.renown), eSkel(1900,400,s.dmg,s.hp,s.renown), eGolem(2600,400,g.dmg,g.hp,g.renown)],
      portals: [portal(3100,320,"DUNGEON F4")], obstacles: [],
    };
  }
  private buildFloor4(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const b = stat("bat"), s = stat("skeleton"), w = stat("wraith");
    return { id: "dungeon_4", name: "DUNGEON FLOOR 4", theme: "dungeon_4",
      platforms: [ground(), p(120,490,80), p(350,410,100), p(600,490,80), p(800,380,100), p(1050,470,80), p(1300,360,100), p(1550,460,80), p(1800,370,100), p(2050,460,80), p(2300,360,100), p(2600,460,80), p(2850,360,300)],
      npcs: [], enemies: [eBat(300,530,b.dmg,b.hp,b.renown), eSkel(800,530,s.dmg,s.hp,s.renown), eWraith(1500,530,w.dmg,w.hp,w.renown), eSkel(2200,400,s.dmg,s.hp,s.renown)],
      portals: [portal(3100,340,"DUNGEON F5")],
      obstacles: [new Obstacle(2900,300,50,50,"flame_barrier","FLAME BARRIER","A wall of hellfire.",4,null,20)],
    };
  }
  private buildFloor5(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const s = stat("skeleton"), w = stat("wraith"), g = stat("golem");
    return { id: "dungeon_5", name: "DUNGEON FLOOR 5", theme: "dungeon_5",
      platforms: [ground(), p(180,480,70), p(400,390,90), p(650,480,70), p(880,370,90), p(1100,460,70), p(1350,360,100), p(1600,460,70), p(1850,370,90), p(2100,460,70), p(2350,360,90), p(2650,460,70), p(2900,350,250)],
      npcs: [], enemies: [eSkel(500,530,s.dmg,s.hp,s.renown), eWraith(1000,530,w.dmg,w.hp,w.renown), eSkel(1500,530,s.dmg,s.hp,s.renown), eGolem(2100,530,g.dmg,g.hp,g.renown), eWraith(2600,380,w.dmg,w.hp,w.renown)],
      portals: [portal(3100,330,"DUNGEON F6")], obstacles: [],
    };
  }
  private buildFloor6(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const b = stat("bat"), s = stat("skeleton"), w = stat("wraith"), g = stat("golem");
    return { id: "dungeon_6", name: "DUNGEON FLOOR 6", theme: "dungeon_6",
      platforms: [ground(), p(100,520,50), p(300,430,80), p(550,500,50), p(750,390,80), p(1000,480,50), p(1250,370,90), p(1500,470,50), p(1750,380,80), p(2000,470,50), p(2250,370,80), p(2500,470,50), p(2750,370,80), p(2950,340,250)],
      npcs: [], enemies: [eBat(200,530,b.dmg,b.hp,b.renown), eBat(600,530,b.dmg,b.hp,b.renown), eSkel(1000,530,s.dmg,s.hp,s.renown), eWraith(1500,530,w.dmg,w.hp,w.renown), eGolem(2000,530,g.dmg,g.hp,g.renown), eSkel(2600,400,s.dmg,s.hp,s.renown)],
      portals: [portal(3100,320,"DUNGEON F7")],
      obstacles: [new Obstacle(2800,300,50,50,"crystal_wall","CRYSTAL WALL","A pulsating crystal barrier.",5,null,25)],
    };
  }
  private buildFloor7(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const w = stat("wraith"), s = stat("skeleton"), g = stat("golem");
    return { id: "dungeon_7", name: "DUNGEON FLOOR 7", theme: "dungeon_7",
      platforms: [ground(), p(150,480,60), p(380,390,80), p(600,480,60), p(850,370,80), p(1080,460,60), p(1300,350,90), p(1550,460,60), p(1800,370,80), p(2050,460,60), p(2300,360,80), p(2550,460,60), p(2800,350,300)],
      npcs: [], enemies: [eWraith(400,530,w.dmg,w.hp,w.renown), eWraith(900,530,w.dmg,w.hp,w.renown), eSkel(1400,530,s.dmg,s.hp,s.renown), eGolem(1900,530,g.dmg,g.hp,g.renown), eSkel(2400,400,s.dmg,s.hp,s.renown), eWraith(2800,380,w.dmg,w.hp,w.renown)],
      portals: [portal(3100,320,"DUNGEON F8")], obstacles: [],
    };
  }
  private buildFloor8(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const b = stat("bat"), s = stat("skeleton"), w = stat("wraith"), g = stat("golem");
    return { id: "dungeon_8", name: "DUNGEON FLOOR 8", theme: "dungeon_8",
      platforms: [ground(), p(80,510,50), p(250,420,70), p(450,510,50), p(650,400,70), p(880,500,50), p(1100,380,80), p(1350,490,50), p(1600,370,80), p(1850,480,50), p(2100,370,80), p(2350,480,50), p(2600,370,80), p(2850,350,300)],
      npcs: [], enemies: [eBat(150,530,b.dmg,b.hp,b.renown), eBat(600,530,b.dmg,b.hp,b.renown), eSkel(1000,530,s.dmg,s.hp,s.renown), eWraith(1500,530,w.dmg,w.hp,w.renown), eGolem(2000,530,g.dmg,g.hp,g.renown), eGolem(2600,400,g.dmg,g.hp,g.renown)],
      portals: [portal(3100,320,"DUNGEON F9")],
      obstacles: [new Obstacle(2900,300,50,50,"shadow_gate","SHADOW GATE","A gate of pure darkness.",6,null,30)],
    };
  }
  private buildFloor9(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const s = stat("skeleton"), w = stat("wraith"), g = stat("golem");
    return { id: "dungeon_9", name: "DUNGEON FLOOR 9", theme: "dungeon_9",
      platforms: [ground(), p(120,470,50), p(320,380,70), p(550,470,50), p(780,370,70), p(1020,470,50), p(1250,360,80), p(1480,460,50), p(1720,350,80), p(1950,460,50), p(2180,360,80), p(2420,460,50), p(2650,360,80), p(2900,340,300)],
      npcs: [], enemies: [eSkel(300,530,s.dmg,s.hp,s.renown), eWraith(700,530,w.dmg,w.hp,w.renown), eSkel(1100,530,s.dmg,s.hp,s.renown), eGolem(1600,530,g.dmg,g.hp,g.renown), eWraith(2100,530,w.dmg,w.hp,w.renown), eSkel(2600,400,s.dmg,s.hp,s.renown)],
      portals: [portal(3100,320,"DUNGEON F10")], obstacles: [],
    };
  }
  private buildFloor10(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const w = stat("wraith"), g = stat("golem");
    return { id: "dungeon_10", name: "DUNGEON FLOOR 10", theme: "dungeon_10",
      platforms: [ground(), p(100,500,40), p(280,410,60), p(480,500,40), p(680,400,60), p(880,490,40), p(1100,380,70), p(1350,480,40), p(1580,370,70), p(1820,480,40), p(2050,370,70), p(2280,480,40), p(2520,370,70), p(2780,350,300)],
      npcs: [], enemies: [eWraith(300,530,w.dmg,w.hp,w.renown), eWraith(800,530,w.dmg,w.hp,w.renown), eGolem(1300,530,g.dmg,g.hp,g.renown), eWraith(1800,530,w.dmg,w.hp,w.renown), eGolem(2300,530,g.dmg,g.hp,g.renown), eWraith(2700,400,w.dmg,w.hp,w.renown)],
      portals: [portal(3100,320,"DUNGEON F11")],
      obstacles: [new Obstacle(2900,290,50,50,"inferno_gate","INFERNO GATE","A burning portal of damnation.",7,null,35)],
    };
  }
  private buildFloor11(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const s = stat("skeleton"), g = stat("golem"), w = stat("wraith");
    return { id: "dungeon_11", name: "DUNGEON FLOOR 11", theme: "dungeon_11",
      platforms: [ground(), p(80,480,40), p(250,390,60), p(450,480,40), p(650,390,60), p(850,480,40), p(1050,380,70), p(1280,480,40), p(1500,370,70), p(1720,480,40), p(1950,370,70), p(2180,480,40), p(2420,360,70), p(2680,480,40), p(2900,340,300)],
      npcs: [], enemies: [eSkel(200,530,s.dmg,s.hp,s.renown), eGolem(600,530,g.dmg,g.hp,g.renown), eWraith(1100,530,w.dmg,w.hp,w.renown), eGolem(1600,530,g.dmg,g.hp,g.renown), eSkel(2100,530,s.dmg,s.hp,s.renown), eWraith(2600,400,w.dmg,w.hp,w.renown)],
      portals: [portal(3100,320,"DUNGEON F12")], obstacles: [],
    };
  }
  private buildFloor12(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const w = stat("wraith"), g = stat("golem"), b = stat("bat");
    return { id: "dungeon_12", name: "DUNGEON FLOOR 12", theme: "dungeon_12",
      platforms: [ground(), p(60,480,40), p(200,390,50), p(380,480,40), p(560,380,50), p(780,480,40), p(980,370,60), p(1200,480,40), p(1420,370,60), p(1640,480,40), p(1860,370,60), p(2080,480,40), p(2300,370,60), p(2540,480,40), p(2780,360,300)],
      npcs: [], enemies: [eWraith(300,530,w.dmg,w.hp,w.renown), eGolem(800,530,g.dmg,g.hp,g.renown), eWraith(1400,530,w.dmg,w.hp,w.renown), eGolem(2000,530,g.dmg,g.hp,g.renown), eBat(500,530,b.dmg,b.hp,b.renown), eBat(1600,530,b.dmg,b.hp,b.renown)],
      portals: [portal(3100,320,"DUNGEON F13")],
      obstacles: [new Obstacle(3000,290,50,50,"doom_barrier","DOOM BARRIER","The final seal.",8,null,40)],
    };
  }
  private buildFloor13(stat: (t: string) => { hp: number; dmg: number; renown: number }): FloorData {
    const g = stat("golem"), w = stat("wraith");
    return { id: "dungeon_13", name: "DUNGEON FLOOR 13", theme: "dungeon_13",
      platforms: [ground(), p(50,480,30), p(180,380,50), p(350,480,30), p(500,380,50), p(680,480,30), p(850,370,50), p(1050,480,30), p(1250,370,50), p(1450,480,30), p(1650,370,50), p(1850,480,30), p(2050,370,50), p(2250,480,30), p(2450,370,50), p(2650,480,30), p(2850,350,300)],
      npcs: [], enemies: [eGolem(300,530,g.dmg,g.hp,g.renown), eGolem(800,530,g.dmg,g.hp,g.renown), eWraith(1200,530,w.dmg,w.hp,w.renown), eGolem(1700,530,g.dmg,g.hp,g.renown), eWraith(2200,530,w.dmg,w.hp,w.renown), eGolem(2700,400,g.dmg,g.hp,g.renown)],
      portals: [portal(3100,320,"ASCEND")], obstacles: [],
    };
  }

  getTownNPCs(): NPC[] {
    const npcConfigs: NPCConfig[] = [
      { id: "gatekeeper", name: "GATEKEEPER", title: "Town Gate", position: new Vector2(400,390), dialog: ["Halt, stranger.", "100 credits credited.", "Spend wisely."], interactionRange: 80, type: "gatekeeper", patrolRange: 20, patrolSpeed: 30 },
      { id: "registrar", name: "REGISTRAR", title: "Identity Keeper", position: new Vector2(700,310), dialog: ["Welcome, wanderer.", "Your name will be etched in the ledger.", "Your wallet is registered on Monad."], interactionRange: 80, type: "registrar", patrolRange: 15, patrolSpeed: 25 },
      { id: "teo_merchant", name: "TEO", title: "Traveling Merchant", position: new Vector2(900,500), dialog: ["Psst! Over here.", "The gateway brambles block the path.", "Bring me 5 glow berries for my Rusty Axe."], interactionRange: 80, type: "merchant", patrolRange: 25, patrolSpeed: 35 },
      { id: "durin_blacksmith", name: "DURIN", title: "Blacksmith", position: new Vector2(1200,290), dialog: ["Ah, fresh blood.", "I can forge you a blade for 50 credits."], interactionRange: 80, type: "blacksmith", patrolRange: 10, patrolSpeed: 20 },
      { id: "lyra_mage", name: "LYRA", title: "Mage of the Arcane", position: new Vector2(1500,370), dialog: ["The threads of fate weave tight.", "A health potion costs 30 credits."], interactionRange: 80, type: "mage", patrolRange: 20, patrolSpeed: 28 },
      { id: "aldric_manager", name: "ALDRIC", title: "Town Manager", position: new Vector2(1800,290), dialog: ["I oversee all transactions.", "The economy runs itself now."], interactionRange: 80, type: "manager", patrolRange: 12, patrolSpeed: 22 },
      { id: "reaver_bounty", name: "REAVER", title: "Bounty Admin", position: new Vector2(2200,390), dialog: ["Bounties. You want them?", "Clear floors. Get proof. Get paid."], interactionRange: 80, type: "bounty", patrolRange: 18, patrolSpeed: 25 },
    ];
    return npcConfigs.map((cfg) => new NPC(cfg));
  }

  get currentFloor(): FloorData {
    return this.floors[this.currentFloorIndex];
  }

  advanceFloor(): FloorData {
    if (this.currentFloorIndex < this.floors.length - 1) {
      this.currentFloorIndex++;
    }
    return this.currentFloor;
  }

  resetToTown(): void {
    this.currentFloorIndex = 0;
  }
}
