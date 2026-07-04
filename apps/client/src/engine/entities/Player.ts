import type { InputManager } from "../InputManager";
import { Vector2 } from "../Vector2";
import type { SilhouetteRenderer } from "../rendering/SilhouetteRenderer";
import { useGameStore } from "../../state/gameStore";
import type { Platform } from "./Platform";

export class Player {
  position: Vector2;
  velocity: Vector2 = new Vector2(0, 0);
  size: Vector2 = new Vector2(32, 64);
  facingRight = true;
  credits = 0;
  isGrounded = false;
  isJumping = false;
  isAttacking = false;
  isClimbing = false;
  currentWeapon: string | null = null;

  private animTimer = 0;
  private animFrame = 0;
  private attackTimer = 0;
  private invulnTimer = 0;
  private readonly SPEED = 280;
  private readonly JUMP_FORCE = -520;
  private readonly GRAVITY = 1400;
  private readonly GROUND_Y = 520;
  private readonly WEAPON_DAMAGE = 25;
  private readonly CLIMB_SPEED = 180;
  private readonly MAX_JUMPS = 2;
  private readonly COLLISION_H = 12;
  private jumpsRemaining = this.MAX_JUMPS;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;

  constructor(position: Vector2) {
    this.position = position;
  }

  update(dt: number, input: InputManager, platforms: Platform[]): void {
    let moveX = 0;
    if (input.isDown("ArrowLeft") || input.isDown("KeyA")) moveX = -1;
    if (input.isDown("ArrowRight") || input.isDown("KeyD")) moveX = 1;

    if (moveX !== 0) {
      this.facingRight = moveX > 0;
    }

    const len = Math.sqrt(moveX * moveX);
    if (len > 0) {
      moveX /= len;
    }

    this.isClimbing = false;

    const onWallLeft = this.isTouchingWall(platforms, -1);
    const onWallRight = this.isTouchingWall(platforms, 1);
    const onWall = (moveX < 0 && onWallLeft) || (moveX > 0 && onWallRight);

    if (onWall && !this.isGrounded && (input.isDown("ArrowUp") || input.isDown("KeyW"))) {
      this.isClimbing = true;
      this.velocity.y = -this.CLIMB_SPEED;
      this.velocity.x = moveX * this.SPEED * 0.3;
      this.jumpsRemaining = this.MAX_JUMPS;
    }

    if (this.isClimbing) {
      if (input.isDown("ArrowDown") || input.isDown("KeyS")) {
        this.velocity.y = this.CLIMB_SPEED;
      } else if (!(input.isDown("ArrowUp") || input.isDown("KeyW"))) {
        this.velocity.y = 0;
      }
    } else {
      if (this.isGrounded) {
        this.jumpsRemaining = this.MAX_JUMPS;
        this.coyoteTimer = 0.08;
      } else {
        this.coyoteTimer -= dt;
      }

      if (input.justPressed("ArrowUp") || input.justPressed("KeyW") || input.justPressed("Space")) {
        this.jumpBufferTimer = 0.1;
      } else {
        this.jumpBufferTimer -= dt;
      }

      if (this.jumpBufferTimer > 0 && this.jumpsRemaining > 0 && (this.isGrounded || this.coyoteTimer > 0 || this.jumpsRemaining < this.MAX_JUMPS)) {
        this.velocity.y = this.JUMP_FORCE;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpsRemaining--;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
      }

      this.velocity.y += this.GRAVITY * dt;
    }

    if (!this.isClimbing) {
      this.velocity.x = moveX * this.SPEED;
    }

    this.position.x += this.velocity.x * dt;
    this.checkHorizontalCollisions(platforms);

    this.position.y += this.velocity.y * dt;
    this.checkVerticalCollisions(platforms);

    if (this.position.y > 800) {
      this.position.y = 300;
      this.position.x = 100;
      this.velocity.y = 0;
      const store = useGameStore.getState();
      store.damagePlayer(25);
    }

    this.animTimer += dt;
    if (this.animTimer > 0.12) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    if (input.justPressed("KeyF")) {
      this.isAttacking = true;
      this.attackTimer = 0.3;
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
  }

  isInvulnerable(): boolean {
    return this.invulnTimer > 0;
  }

  takeDamage(amount: number): void {
    if (this.invulnTimer > 0) return;
    this.invulnTimer = 0.5;
    const store = useGameStore.getState();
    store.damagePlayer(amount);
  }

  getAttackHitbox(): { x: number; y: number; w: number; h: number } | null {
    if (!this.isAttacking) return null;
    const reach = 30;
    const offsetX = this.facingRight ? this.size.x : -reach;
    const c = this.getCollisionRect();
    return {
      x: this.position.x + offsetX,
      y: c.y,
      w: reach,
      h: c.h,
    };
  }

  getWeaponDamage(): number {
    return this.WEAPON_DAMAGE;
  }

  private isTouchingWall(platforms: Platform[], dir: number): boolean {
    const c = this.getCollisionRect();
    const testX = c.x + (dir > 0 ? c.w : -2);
    const margin = 4;
    for (const plat of platforms) {
      if (
        testX >= plat.x - margin && testX <= plat.x + plat.width + margin &&
        c.y + c.h > plat.y + 4 &&
        c.y < plat.y + plat.height - 4
      ) {
        return true;
      }
    }
    return false;
  }

  private getCollisionRect(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.position.x,
      y: this.position.y + this.size.y - this.COLLISION_H,
      w: this.size.x,
      h: this.COLLISION_H,
    };
  }

  private checkHorizontalCollisions(platforms: Platform[]): void {
    for (const plat of platforms) {
      if (this.overlaps(plat)) {
        if (this.velocity.x > 0) {
          this.position.x = plat.x - this.size.x;
        } else if (this.velocity.x < 0) {
          this.position.x = plat.x + plat.width;
        }
        this.velocity.x = 0;
      }
    }
  }

  private checkVerticalCollisions(platforms: Platform[]): void {
    this.isGrounded = false;
    for (const plat of platforms) {
      if (this.overlaps(plat)) {
        if (this.velocity.y > 0) {
          this.position.y = plat.y - this.size.y;
          this.velocity.y = 0;
          this.isGrounded = true;
          this.isJumping = false;
          this.jumpsRemaining = this.MAX_JUMPS;
        } else if (this.velocity.y < 0) {
          this.position.y = plat.y + plat.height;
          this.velocity.y = 0;
        }
      }
    }
  }

  private overlaps(plat: Platform): boolean {
    const c = this.getCollisionRect();
    return (
      c.x < plat.x + plat.width &&
      c.x + c.w > plat.x &&
      c.y < plat.y + plat.height &&
      c.y + c.h > plat.y
    );
  }

  render(ctx: CanvasRenderingContext2D, renderer: SilhouetteRenderer): void {
    const isMoving = Math.abs(this.velocity.x) > 10;
    const isJumping = !this.isGrounded && !this.isClimbing;
    const flash = this.invulnTimer > 0 && Math.sin(this.invulnTimer * 30) > 0;
    const cx = this.position.x + this.size.x / 2;
    const cy = this.position.y + this.size.y;
    renderer.drawPlayer(
      ctx,
      cx,
      cy,
      this.size.x,
      this.size.y,
      this.facingRight,
      isMoving,
      isJumping,
      this.animFrame,
      this.isAttacking,
      flash,
    );

    if (this.isClimbing) {
      ctx.fillStyle = "rgba(180, 200, 255, 0.15)";
      ctx.fillRect(cx - this.size.x / 2 - 2, cy - this.size.y - 4, this.size.x + 4, this.size.y + 8);
      ctx.strokeStyle = "rgba(180, 200, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - this.size.x / 2 - 2, cy - this.size.y - 4, this.size.x + 4, this.size.y + 8);
    }
  }
}
