import { Vector2 } from "../Vector2";

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  name: string;
  description: string;
  cleared = false;
  hitsRequired: number;
  hitsApplied = 0;
  requiredItem: string | null;
  renownReward: number;

  private pulseTimer = 0;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    name: string,
    description: string,
    hitsRequired = 3,
    requiredItem: string | null = null,
    renownReward = 10,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.id = id;
    this.name = name;
    this.description = description;
    this.hitsRequired = hitsRequired;
    this.requiredItem = requiredItem;
    this.renownReward = renownReward;
  }

  update(dt: number): void {
    this.pulseTimer += dt;
  }

  canInteract(hasRequiredItem: boolean): boolean {
    if (this.cleared) return false;
    if (this.requiredItem && !hasRequiredItem) return false;
    return true;
  }

  applyHit(): { cleared: boolean } {
    this.hitsApplied++;
    if (this.hitsApplied >= this.hitsRequired) {
      this.cleared = true;
      return { cleared: true };
    }
    return { cleared: false };
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.cleared) return;

    const pulse = Math.sin(this.pulseTimer * 2) * 0.15 + 0.85;

    ctx.save();

    ctx.fillStyle = `rgba(30, 50, 20, ${0.8 * pulse})`;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = `rgba(80, 120, 40, ${0.5 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = `rgba(60, 100, 30, ${0.6 * pulse})`;
    for (let i = 0; i < 5; i++) {
      const bx = this.x + 6 + i * 20;
      const by = this.y + 4 + (i % 3) * 12;
      ctx.fillRect(bx, by, 8, 8);
    }

    if (this.hitsApplied > 0) {
      ctx.fillStyle = "rgba(240, 192, 64, 0.6)";
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.fillText(
        `${this.hitsApplied}/${this.hitsRequired}`,
        this.x + this.width / 2,
        this.y + this.height + 16,
      );
    }

    ctx.fillStyle = `rgba(240, 192, 64, ${0.5 * pulse})`;
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x + this.width / 2, this.y - 6);

    ctx.restore();
  }

  playerOverlap(px: number, py: number, pw: number, ph: number): boolean {
    return (
      px + pw > this.x && px < this.x + this.width && py + ph > this.y && py < this.y + this.height
    );
  }
}
