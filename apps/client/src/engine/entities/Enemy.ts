import { Vector2 } from "../Vector2";
import type { SilhouetteRenderer } from "../rendering/SilhouetteRenderer";
import type { Platform } from "./Platform";

export type EnemyType = "skeleton" | "wraith" | "golem" | "bat";
export type EnemyState = "idle" | "patrol" | "chase" | "attack";

export interface EnemyConfig {
  x: number;
  y: number;
  enemyType: EnemyType;
  patrolRange: number;
  detectionRange: number;
  attackRange: number;
  attackDamage: number;
  attackCooldown: number;
  attackWindup: number;
  maxHp: number;
  speed: number;
  renownReward: number;
}

export class Enemy {
  x: number;
  y: number;
  w = 40;
  h = 60;
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  patrolRange: number;
  detectionRange: number;
  attackRange: number;
  attackDamage: number;
  attackCooldown: number;
  attackWindup: number;
  renownReward: number;

  private spawnX: number;
  private spawnY: number;
  private state: EnemyState = "idle";
  private patrolDir = 1;
  private idleTimer = 0;
  private idleDuration: number;
  private giveUpTimer = 0;
  private chaseTargetX = 0;
  private chaseTargetY = 0;
  private detectCounter = 0;
  private readonly DETECT_INTERVAL = 5;
  private readonly GIVE_UP_DURATION = 3;
  private attackWindupTimer = 0;
  private cooldownTimer = 0;
  private damageDealt = false;
  private animTimer = 0;
  private animFrame = 0;
  private dead = false;
  private deathTimer = 0;
  private hitFlashTimer = 0;
  private readonly GRAVITY = 1400;
  private readonly COLLISION_H = 12;

  velocity = new Vector2(0, 0);
  isGrounded = false;

  constructor(config: EnemyConfig) {
    this.x = config.x;
    this.y = config.y;
    this.enemyType = config.enemyType;
    this.patrolRange = config.patrolRange;
    this.detectionRange = config.detectionRange;
    this.attackRange = config.attackRange;
    this.attackDamage = config.attackDamage;
    this.attackCooldown = config.attackCooldown;
    this.attackWindup = config.attackWindup;
    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.speed = config.speed;
    this.renownReward = config.renownReward;
    this.spawnX = config.x;
    this.spawnY = config.y;
    this.idleDuration = 2 + Math.random() * 3;
  }

  update(dt: number, playerX: number, playerY: number, platforms: Platform[]): void {
    if (this.dead) {
      this.deathTimer += dt;
      return;
    }

    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    switch (this.state) {
      case "idle":
        this.updateIdle(dt, playerX, playerY, platforms);
        break;
      case "patrol":
        this.updatePatrol(dt, playerX, playerY, platforms);
        break;
      case "chase":
        this.updateChase(dt, playerX, playerY, platforms);
        break;
      case "attack":
        this.updateAttack(dt, playerX, playerY);
        break;
    }

    this.velocity.y += this.GRAVITY * dt;
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    if (this.y > 800) {
      this.y = this.spawnY;
      this.x = this.spawnX;
      this.velocity.y = 0;
    }
  }

  private updateIdle(dt: number, playerX: number, playerY: number, platforms: Platform[]): void {
    this.velocity.x = 0;
    this.idleTimer += dt;
    if (this.idleTimer >= this.idleDuration) {
      this.state = "patrol";
      this.idleTimer = 0;
      this.patrolDir = Math.random() > 0.5 ? 1 : -1;
    }
    this.detect(playerX, playerY, platforms);
  }

  private updatePatrol(dt: number, playerX: number, playerY: number, platforms: Platform[]): void {
    const patrolDx = this.x - this.spawnX;
    if (Math.abs(patrolDx) > this.patrolRange) {
      this.patrolDir *= -1;
    }
    this.velocity.x = this.patrolDir * this.speed * 0.4;
    this.detect(playerX, playerY, platforms);
  }

  private updateChase(dt: number, playerX: number, playerY: number, platforms: Platform[]): void {
    this.detectCounter++;
    let los = false;
    if (this.detectCounter >= this.DETECT_INTERVAL) {
      this.detectCounter = 0;
      los = this.hasLineOfSight(playerX, playerY, platforms);
    }

    if (los) {
      this.giveUpTimer = 0;
      this.chaseTargetX = playerX;
      this.chaseTargetY = playerY;
    } else {
      this.giveUpTimer += dt;
      if (this.giveUpTimer >= this.GIVE_UP_DURATION) {
        this.state = "patrol";
        this.giveUpTimer = 0;
        this.velocity.x = 0;
        return;
      }
    }

    if (this.cooldownTimer <= 0) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < this.attackRange * this.attackRange) {
        this.state = "attack";
        this.attackWindupTimer = this.attackWindup;
        this.damageDealt = false;
        this.velocity.x = 0;
        return;
      }
    }

    const tdx = this.chaseTargetX - this.x;
    const tdy = this.chaseTargetY - this.y;
    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
    this.velocity.x = tdist > 5 ? (tdx > 0 ? 1 : -1) * this.speed : 0;
  }

  private updateAttack(dt: number, playerX: number, playerY: number): void {
    this.velocity.x = 0;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > this.attackRange * this.attackRange * 1.5) {
      this.state = "chase";
      this.damageDealt = false;
      this.giveUpTimer = 0;
      return;
    }

    this.attackWindupTimer -= dt;
    if (this.attackWindupTimer <= 0 && !this.damageDealt) {
      this.damageDealt = true;
    }
  }

  canAttack(_playerX: number, _playerY: number): boolean {
    return !this.dead && this.state === "attack" && this.damageDealt && this.attackWindupTimer <= 0;
  }

  performAttack(): number {
    this.cooldownTimer = this.attackCooldown;
    this.state = "chase";
    this.damageDealt = false;
    this.giveUpTimer = 0;
    return this.attackDamage;
  }

  private detect(playerX: number, playerY: number, platforms: Platform[]): void {
    this.detectCounter++;
    if (this.detectCounter < this.DETECT_INTERVAL) return;
    this.detectCounter = 0;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > this.detectionRange * this.detectionRange) return;

    if (!this.hasLineOfSight(playerX, playerY, platforms)) return;

    this.state = "chase";
    this.chaseTargetX = playerX;
    this.chaseTargetY = playerY;
    this.giveUpTimer = 0;
  }

  private hasLineOfSight(tx: number, ty: number, platforms: Platform[]): boolean {
    const sx = this.x + this.w / 2;
    const sy = this.y + this.h / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(Math.floor(dist / 10), 1);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = sx + dx * t;
      const py = sy + dy * t;

      for (const p of platforms) {
        if (px >= p.x && px <= p.x + p.width && py >= p.y && py <= p.y + p.height) {
          return false;
        }
      }
    }
    return true;
  }

  takeDamage(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.hitFlashTimer = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      return true;
    }
    if (this.state === "idle" || this.state === "patrol") {
      this.state = "chase";
      this.giveUpTimer = 0;
    }
    return false;
  }

  get isDead(): boolean {
    return this.dead;
  }

  get deathAnimationComplete(): boolean {
    return this.deathTimer > 0.5;
  }

  overlapsPlayer(px: number, py: number, pw: number, ph: number): boolean {
    const cy = this.y + this.h - this.COLLISION_H;
    return (
      px < this.x + this.w &&
      px + pw > this.x &&
      py < cy + this.COLLISION_H &&
      py + ph > cy
    );
  }

  render(ctx: CanvasRenderingContext2D, renderer: SilhouetteRenderer): void {
    if (this.dead && this.deathTimer > 0.5) return;

    const alpha = this.dead ? Math.max(0, 1 - this.deathTimer * 2) : 1;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.hitFlashTimer > 0) {
      ctx.globalAlpha = 0.6 + Math.sin(this.hitFlashTimer * 40) * 0.4;
    }

    renderer.drawEnemy(ctx, cx, cy, this.enemyType, this.velocity.x > 0, this.animFrame);

    ctx.restore();

    if (!this.dead) {
      const barW = 36;
      const barH = 4;
      const bx = cx - barW / 2;
      const by = cy - this.h - 8;
      ctx.fillStyle = "rgba(40, 10, 10, 0.8)";
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = "rgba(200, 40, 40, 0.9)";
      ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
    }
  }

  getStateLabel(): string {
    return this.state.charAt(0).toUpperCase() + this.state.slice(1);
  }
}
