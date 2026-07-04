export interface CharacterSprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

export class CharacterGenerator {
  private MIN_R = 0x2a;
  private MIN_G = 0x2a;
  private MIN_B = 0x38;

  private liftColor(hex: string): string {
    if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
    const r = Math.max(this.MIN_R, parseInt(hex.slice(1, 3), 16));
    const g = Math.max(this.MIN_G, parseInt(hex.slice(3, 5), 16));
    const b = Math.max(this.MIN_B, parseInt(hex.slice(5, 7), 16));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  private rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, outline?: string): void {
    ctx.fillStyle = this.liftColor(color);
    ctx.fillRect(x, y, w, h);
    if (outline) {
      ctx.strokeStyle = this.liftColor(outline);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    }
  }

  private applyRimLight(ctx: CanvasRenderingContext2D, w: number, h: number, hex: string): void {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const edge = new Uint8Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] > 0) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (d[(ny * w + nx) * 4 + 3] > 0) {
              edge[y * w + x] = 1;
              break;
            }
          }
          if (edge[y * w + x]) break;
        }
      }
    }

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    for (let i = 0; i < w * h; i++) {
      if (edge[i]) {
        d[i * 4] = r;
        d[i * 4 + 1] = g;
        d[i * 4 + 2] = b;
        d[i * 4 + 3] = 180;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  generateCharacter(type: string, w: number, h: number): CharacterSprite {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    switch (type) {
      case "player": this.drawPlayer(ctx, w, h); break;
      case "gatekeeper": this.drawGatekeeper(ctx, w, h); break;
      case "registrar": this.drawRegistrar(ctx, w, h); break;
      case "mage": this.drawMage(ctx, w, h); break;
      case "blacksmith": this.drawBlacksmith(ctx, w, h); break;
      case "manager": this.drawManager(ctx, w, h); break;
      case "bounty": this.drawBounty(ctx, w, h); break;
      case "merchant":
      case "teo_merchant": this.drawMerchant(ctx, w, h); break;
      case "skeleton": this.drawSkeleton(ctx, w, h); break;
      case "wraith": this.drawWraith(ctx, w, h); break;
      case "golem": this.drawGolem(ctx, w, h); break;
      case "bat": this.drawBat(ctx, w, h); break;
      default: this.drawGeneric(ctx, w, h); break;
    }

    this.applyRimLight(ctx, w, h, "#f0c040");

    return { canvas, w, h };
  }

  private outline(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.strokeStyle = "rgba(180, 160, 220, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  private head(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, outline?: string): void {
    ctx.fillStyle = this.liftColor(color);
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = this.liftColor(outline);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private eyes(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 3, 2);
    ctx.fillRect(x + 10, y, 3, 2);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 10, 0, 12, "#3a2a40", "#5a4a60");
    this.eyes(ctx, 11, 4, "#f0c040");
    this.rect(ctx, 8, 10, 16, 4, "#2a1a30", "#4a3a50");
    this.rect(ctx, 8, 14, 16, 16, "#1a1020", "#3a2a40");
    this.rect(ctx, 6, 14, 3, 14, "#1a1020");
    this.rect(ctx, 23, 14, 3, 14, "#1a1020");
    this.rect(ctx, 8, 30, 6, 10, "#1a1020", "#3a2a40");
    this.rect(ctx, 18, 30, 6, 10, "#1a1020", "#3a2a40");
    this.outline(ctx, w, h);
  }

  private drawGatekeeper(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 9, 0, 14, "#3a2a40", "#5a4a60");
    this.rect(ctx, 11, 2, 10, 4, "#4a3a50", "#6a5a70");
    this.eyes(ctx, 11, 4, "#d0b060");
    this.rect(ctx, 8, 12, 18, 18, "#2a1a30", "#4a3a50");
    this.rect(ctx, 6, 12, 3, 16, "#2a1a30");
    this.rect(ctx, 25, 12, 3, 16, "#2a1a30");
    this.rect(ctx, 10, 14, 14, 4, "#4a3a50");
    this.rect(ctx, 10, 20, 14, 4, "#4a3a50");
    this.rect(ctx, 8, 30, 6, 10, "#2a1a30", "#4a3a50");
    this.rect(ctx, 20, 30, 6, 10, "#2a1a30", "#4a3a50");
    this.outline(ctx, w, h);
  }

  private drawRegistrar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 11, 0, 10, "#3a3040", "#5a5060");
    this.eyes(ctx, 12, 3, "#80a0c0");
    this.rect(ctx, 9, 10, 14, 12, "#2a2030", "#4a3a50");
    this.rect(ctx, 7, 10, 3, 12, "#2a2030");
    this.rect(ctx, 22, 10, 3, 12, "#2a2030");
    this.rect(ctx, 12, 12, 8, 8, "#4a5060");
    this.rect(ctx, 14, 14, 4, 4, "#6a7080");
    this.rect(ctx, 8, 22, 16, 8, "#2a2030", "#4a3a50");
    this.rect(ctx, 9, 30, 6, 10, "#2a2030", "#4a3a50");
    this.rect(ctx, 17, 30, 6, 10, "#2a2030", "#4a3a50");
    this.outline(ctx, w, h);
  }

  private drawBlacksmith(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 10, 0, 12, "#4a3030", "#6a4a4a");
    this.eyes(ctx, 11, 3, "#c08040");
    this.rect(ctx, 8, 10, 16, 20, "#3a2020", "#5a3a3a");
    this.rect(ctx, 6, 10, 3, 18, "#3a2020");
    this.rect(ctx, 23, 10, 3, 18, "#3a2020");
    this.rect(ctx, 10, 12, 12, 4, "#5a3a3a");
    this.rect(ctx, 10, 22, 12, 4, "#5a3a3a");
    this.rect(ctx, 22, 14, 4, 10, "#6a5a4a");
    this.rect(ctx, 8, 30, 6, 10, "#3a2020", "#5a3a3a");
    this.rect(ctx, 18, 30, 6, 10, "#3a2020", "#5a3a3a");
    this.outline(ctx, w, h);
  }

  private drawMage(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.rect(ctx, 12, 0, 8, 6, "#2a2040", "#4a3a60");
    this.rect(ctx, 10, 6, 12, 4, "#2a2040", "#4a3a60");
    this.head(ctx, 11, 2, 10, "#2a2040", "#4a3a60");
    this.eyes(ctx, 12, 5, "#a080ff");
    this.rect(ctx, 10, 10, 12, 20, "#1a1030", "#3a2a50");
    this.rect(ctx, 8, 10, 3, 18, "#1a1030");
    this.rect(ctx, 21, 10, 3, 18, "#1a1030");
    this.rect(ctx, 12, 12, 8, 4, "#4a3a60");
    this.rect(ctx, 12, 18, 8, 4, "#4a3a60");
    this.rect(ctx, 12, 24, 8, 4, "#4a3a60");
    this.rect(ctx, 22, 12, 3, 10, "#6a5a80");
    this.rect(ctx, 10, 30, 5, 10, "#1a1030", "#3a2a50");
    this.rect(ctx, 17, 30, 5, 10, "#1a1030", "#3a2a50");
    this.outline(ctx, w, h);
  }

  private drawManager(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 10, 0, 12, "#3a3a30", "#5a5a4a");
    this.eyes(ctx, 11, 3, "#80a090");
    this.rect(ctx, 8, 10, 16, 10, "#2a2a20", "#4a4a3a");
    this.rect(ctx, 8, 20, 16, 10, "#3a3a30", "#5a5a4a");
    this.rect(ctx, 6, 10, 3, 18, "#2a2a20");
    this.rect(ctx, 23, 10, 3, 18, "#2a2a20");
    this.rect(ctx, 10, 12, 12, 6, "#4a4a3a");
    this.rect(ctx, 10, 22, 12, 6, "#4a4a3a");
    this.rect(ctx, 9, 30, 6, 10, "#2a2a20", "#4a4a3a");
    this.rect(ctx, 17, 30, 6, 10, "#2a2a20", "#4a4a3a");
    this.outline(ctx, w, h);
  }

  private drawBounty(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 9, 0, 14, "#4a3040", "#6a4a60");
    this.rect(ctx, 11, 2, 10, 4, "#5a4a50");
    this.eyes(ctx, 10, 4, "#e0a040");
    this.rect(ctx, 7, 12, 18, 18, "#3a2030", "#5a3a50");
    this.rect(ctx, 5, 12, 3, 16, "#3a2030");
    this.rect(ctx, 24, 12, 3, 16, "#3a2030");
    this.rect(ctx, 9, 14, 14, 4, "#6a5a40");
    this.rect(ctx, 9, 20, 14, 4, "#6a5a40");
    this.rect(ctx, 8, 30, 6, 10, "#3a2030", "#5a3a50");
    this.rect(ctx, 18, 30, 6, 10, "#3a2030", "#5a3a50");
    this.outline(ctx, w, h);
  }

  private drawMerchant(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 11, 0, 10, "#3a3a28", "#5a5a40");
    this.eyes(ctx, 12, 3, "#c0a060");
    this.rect(ctx, 9, 10, 14, 6, "#2a2a18", "#4a4a30");
    this.rect(ctx, 9, 16, 14, 14, "#2a2a18", "#4a4a30");
    this.rect(ctx, 7, 16, 3, 12, "#2a2a18");
    this.rect(ctx, 22, 16, 3, 12, "#2a2a18");
    this.rect(ctx, 11, 12, 10, 6, "#4a4a30");
    this.rect(ctx, 11, 18, 10, 4, "#4a4a30");
    this.rect(ctx, 11, 24, 10, 4, "#4a4a30");
    this.rect(ctx, 9, 30, 5, 10, "#2a2a18", "#4a4a30");
    this.rect(ctx, 18, 30, 5, 10, "#2a2a18", "#4a4a30");
    this.outline(ctx, w, h);
  }

  private drawSkeleton(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 10, 0, 12, "#3a3030", "#5a4040");
    this.eyes(ctx, 11, 3, "#cc3333");
    this.rect(ctx, 6, 12, 20, 18, "#2a2020", "#4a3030");
    this.rect(ctx, 4, 12, 3, 16, "#2a2020");
    this.rect(ctx, 25, 12, 3, 16, "#2a2020");
    this.rect(ctx, 8, 30, 6, 10, "#2a2020", "#4a3030");
    this.rect(ctx, 18, 30, 6, 10, "#2a2020", "#4a3030");
    this.outline(ctx, w, h);
  }

  private drawWraith(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 11, 0, 10, "#2a2040", "#4a3a60");
    this.eyes(ctx, 12, 3, "#9060ff");
    this.rect(ctx, 8, 10, 16, 20, "#1a1030", "#3a2a50");
    this.rect(ctx, 6, 10, 3, 18, "#1a1030");
    this.rect(ctx, 23, 10, 3, 18, "#1a1030");
    this.rect(ctx, 8, 30, 6, 10, "#1a1030", "#3a2a50");
    this.rect(ctx, 18, 30, 6, 10, "#1a1030", "#3a2a50");
    this.outline(ctx, w, h);
  }

  private drawGolem(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 8, 0, 16, "#3a3520", "#5a5040");
    this.eyes(ctx, 10, 4, "#ffc030");
    this.rect(ctx, 5, 14, 22, 18, "#2a2510", "#4a4030");
    this.rect(ctx, 3, 14, 3, 16, "#2a2510");
    this.rect(ctx, 26, 14, 3, 16, "#2a2510");
    this.rect(ctx, 6, 32, 8, 8, "#2a2510", "#4a4030");
    this.rect(ctx, 18, 32, 8, 8, "#2a2510", "#4a4030");
    this.outline(ctx, w, h);
  }

  private drawBat(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 13, 4, 8, "#2a2030", "#4a3040");
    this.eyes(ctx, 14, 6, "#cc3333");
    this.rect(ctx, 14, 10, 6, 8, "#1a1020");
    this.rect(ctx, 4, 8, 10, 4, "#1a1020", "#3a2a40");
    this.rect(ctx, 22, 8, 10, 4, "#1a1020", "#3a2a40");
    this.rect(ctx, 14, 18, 4, 6, "#1a1020");
    this.rect(ctx, 18, 18, 4, 6, "#1a1020");
    this.outline(ctx, w, h);
  }

  private drawGeneric(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.head(ctx, 10, 0, 12, "#2a2030", "#4a3a50");
    this.eyes(ctx, 11, 3, "#808080");
    this.rect(ctx, 8, 10, 16, 20, "#1a1020", "#3a2a40");
    this.rect(ctx, 6, 10, 3, 18, "#1a1020");
    this.rect(ctx, 23, 10, 3, 18, "#1a1020");
    this.rect(ctx, 9, 30, 5, 10, "#1a1020", "#3a2a40");
    this.rect(ctx, 18, 30, 5, 10, "#1a1020", "#3a2a40");
    this.outline(ctx, w, h);
  }
}
