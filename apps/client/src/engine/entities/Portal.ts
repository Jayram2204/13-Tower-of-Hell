import type { Vector2 } from "../Vector2";

export class Portal {
  x: number;
  y: number;
  width: number;
  height: number;
  targetFloor: string;
  private pulseTimer = 0;
  private activated = false;
  private onTrigger: (() => void) | null = null;

  constructor(x: number, y: number, width: number, height: number, targetFloor: string) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.targetFloor = targetFloor;
  }

  update(dt: number): void {
    this.pulseTimer += dt;
  }

  checkTrigger(playerPos: Vector2, onTrigger: () => void): void {
    if (this.activated) return;
    if (
      playerPos.x + 32 > this.x &&
      playerPos.x < this.x + this.width &&
      playerPos.y + 64 > this.y &&
      playerPos.y < this.y + this.height
    ) {
      this.activated = true;
      this.onTrigger = onTrigger;
      onTrigger();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(this.pulseTimer * 3) * 0.3 + 0.7;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.width * 0.6);
    gradient.addColorStop(0, `rgba(100, 60, 200, ${pulse * 0.3})`);
    gradient.addColorStop(0.5, `rgba(60, 30, 150, ${pulse * 0.15})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x - 20, this.y - 10, this.width + 40, this.height + 20);

    ctx.strokeStyle = `rgba(140, 100, 220, ${pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(140, 100, 220, ${pulse * 0.6})`;
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(`>> ${this.targetFloor} >>`, cx, cy + 4);
  }

  reset(): void {
    this.activated = false;
  }
}
