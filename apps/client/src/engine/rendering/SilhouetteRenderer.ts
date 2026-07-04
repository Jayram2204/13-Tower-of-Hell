import type { EnemyType } from "../entities/Enemy";
import { CharacterGenerator, type CharacterSprite } from "./CharacterGenerator";

const SPRITE_W = 32;
const SPRITE_H = 40;

export class SilhouetteRenderer {
  private gen: CharacterGenerator;
  private spriteCache = new Map<string, CharacterSprite>();

  constructor() {
    this.gen = new CharacterGenerator();
  }

  private getSprite(type: string): CharacterSprite {
    let cached = this.spriteCache.get(type);
    if (!cached) {
      cached = this.gen.generateCharacter(type, SPRITE_W, SPRITE_H);
      this.spriteCache.set(type, cached);
    }
    return cached;
  }

  drawPlayer(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    w: number,
    h: number,
    facingRight: boolean,
    _isMoving: boolean,
    _isJumping: boolean,
    _animFrame: number,
    _isAttacking: boolean,
    flash: boolean,
  ): void {
    const sprite = this.getSprite("player");
    const scaleY = h / SPRITE_H;
    const scaleX = w / SPRITE_W;
    const sw = SPRITE_W * scaleX;
    const sh = SPRITE_H * scaleY;
    const dx = bx - sw / 2;
    const dy = by - sh;

    ctx.save();
    if (flash) {
      ctx.globalAlpha = 0.5;
    }

    if (!facingRight) {
      ctx.translate(dx + sw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite.canvas, 0, dy, sw, sh);
    } else {
      ctx.drawImage(sprite.canvas, dx, dy, sw, sh);
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "#f0c040";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#f0c040";
    ctx.lineWidth = 2;
    ctx.strokeRect(dx, dy, sw, sh);
    ctx.restore();

    ctx.fillStyle = "rgba(240, 192, 64, 0.8)";
    ctx.fillRect(dx + 8, dy + 3, 4, 2);
    ctx.fillRect(dx + sw - 12, dy + 3, 4, 2);
  }

  drawEnemy(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    type: EnemyType,
    facingRight: boolean,
    _animFrame: number,
  ): void {
    const enemyW = 40;
    const enemyH = 72;
    const sprite = this.getSprite(type);
    const scaleY = enemyH / SPRITE_H;
    const scaleX = enemyW / SPRITE_W;
    const sw = SPRITE_W * scaleX;
    const sh = SPRITE_H * scaleY;
    const dx = bx - sw / 2;
    const dy = by - sh;

    ctx.save();
    if (!facingRight) {
      ctx.translate(dx + sw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite.canvas, 0, dy, sw, sh);
    } else {
      ctx.drawImage(sprite.canvas, dx, dy, sw, sh);
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "#f0c040";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#f0c040";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(dx, dy, sw, sh);
    ctx.restore();
  }

  drawNPC(ctx: CanvasRenderingContext2D, bx: number, by: number, type: string, _name: string): void {
    const sprite = this.getSprite(type);
    const npcW = 48;
    const npcH = 80;
    const scaleY = npcH / SPRITE_H;
    const scaleX = npcW / SPRITE_W;
    const sw = SPRITE_W * scaleX;
    const sh = SPRITE_H * scaleY;
    const dx = bx - sw / 2;
    const dy = by - sh;

    ctx.drawImage(sprite.canvas, dx, dy, sw, sh);

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = "center";
    const tw = ctx.measureText(_name).width;
    const lx = bx - tw / 2 - 6;
    const ly = by + 4;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.beginPath();
    ctx.roundRect(lx, ly, tw + 12, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(_name, bx, by + 16);
  }
}
