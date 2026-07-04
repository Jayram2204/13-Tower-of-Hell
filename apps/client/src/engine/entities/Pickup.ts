const PIXEL = 2;

function drawItemIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  itemId: string,
): void {
  ctx.save();
  ctx.translate(cx - 8, cy - 8);

  const c = (r: number, g: number, b: number, a = 1) =>
    `rgba(${r},${g},${b},${a})`;

  switch (itemId) {
    case "glow_berry":
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = c(160, 220, 120, 0.15);
        ctx.fillRect(i * 4 + 1, 5, 3, 6);
      }
      ctx.fillStyle = c(120, 200, 80, 0.7);
      ctx.fillRect(2, 4, 12, 8);
      ctx.fillStyle = c(160, 240, 120, 0.9);
      ctx.fillRect(4, 5, 3, 6);
      ctx.fillRect(9, 5, 3, 6);
      ctx.fillStyle = c(20, 60, 20, 0.5);
      ctx.fillRect(6, 8, 4, 3);
      ctx.fillStyle = c(80, 180, 60, 0.4);
      ctx.fillRect(5, 2, 6, 2);
      ctx.fillRect(5, 12, 6, 2);
      break;

    case "rusty_axe":
      ctx.fillStyle = c(100, 90, 70, 0.8);
      ctx.fillRect(6, 2, 4, 12);
      ctx.fillStyle = c(60, 55, 40, 0.5);
      ctx.fillRect(7, 3, 2, 10);
      ctx.fillStyle = c(160, 140, 100, 0.7);
      ctx.fillRect(2, 0, 12, 4);
      ctx.fillRect(4, 3, 8, 3);
      ctx.fillStyle = c(200, 180, 130, 0.4);
      ctx.fillRect(4, 1, 3, 2);
      ctx.fillRect(9, 1, 3, 2);
      break;

    case "credit_pouch":
      ctx.fillStyle = c(160, 140, 80, 0.7);
      ctx.fillRect(1, 4, 14, 8);
      ctx.fillStyle = c(200, 180, 100, 0.9);
      ctx.fillRect(3, 5, 10, 6);
      ctx.fillStyle = c(120, 100, 50, 0.6);
      ctx.fillRect(5, 6, 6, 4);
      ctx.fillStyle = c(80, 70, 40, 0.5);
      ctx.fillRect(0, 5, 3, 6);
      ctx.fillRect(13, 5, 3, 6);
      break;

    default:
      ctx.fillStyle = c(140, 130, 150, 0.6);
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = c(180, 170, 190, 0.4);
      ctx.fillRect(4, 4, 8, 8);
      break;
  }
  ctx.restore();
}

export class Pickup {
  x: number;
  y: number;
  width: number;
  height: number;
  itemId: string;
  itemName: string;
  quantity: number;
  collected = false;

  private pulseTimer = 0;

  constructor(x: number, y: number, itemId: string, itemName: string, quantity = 1) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.itemId = itemId;
    this.itemName = itemName;
    this.quantity = quantity;
  }

  update(dt: number): void {
    this.pulseTimer += dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;
    const pulse = Math.sin(this.pulseTimer * 2.5) * 0.15 + 0.85;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();

    ctx.fillStyle = `rgba(120, 200, 100, ${pulse * 0.08})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    drawItemIcon(ctx, cx, cy, this.itemId);

    const glintAlpha = Math.max(0, Math.sin(this.pulseTimer * 4) * 0.5 + 0.5);
    ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha * 0.25})`;
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(180, 240, 160, ${pulse * 0.55})`;
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${this.itemName} x${this.quantity}`, cx, cy + 14);
    ctx.restore();
  }

  overlaps(px: number, py: number, pw: number, ph: number): boolean {
    return (
      px + pw > this.x && px < this.x + this.width && py + ph > this.y && py < this.y + this.height
    );
  }
}
