interface BackgroundTheme {
  skyTop: string;
  skyBottom: string;
  mountains: string;
  buildings: string;
  moonColor: string;
  fogColor: string;
}

const THEMES: Record<string, BackgroundTheme> = {
  town: {
    skyTop: "#0a0a1a",
    skyBottom: "#1a0a2e",
    mountains: "#15101a",
    buildings: "#1a1520",
    moonColor: "rgba(200, 180, 255, 0.3)",
    fogColor: "rgba(15, 10, 25, 0.3)",
  },
  dungeon_1: {
    skyTop: "#050308",
    skyBottom: "#0f0518",
    mountains: "#0a0610",
    buildings: "#120a1a",
    moonColor: "rgba(255, 100, 150, 0.15)",
    fogColor: "rgba(10, 5, 15, 0.4)",
  },
  dungeon_2: {
    skyTop: "#08050a",
    skyBottom: "#14081a",
    mountains: "#0e0814",
    buildings: "#160c1e",
    moonColor: "rgba(100, 200, 255, 0.15)",
    fogColor: "rgba(8, 4, 12, 0.4)",
  },
  dungeon_3: {
    skyTop: "#0a0005",
    skyBottom: "#18051a",
    mountains: "#100814",
    buildings: "#180a20",
    moonColor: "rgba(255, 50, 50, 0.12)",
    fogColor: "rgba(10, 4, 8, 0.5)",
  },
  dungeon_4: {
    skyTop: "#050005",
    skyBottom: "#0f0518",
    mountains: "#08040e",
    buildings: "#100818",
    moonColor: "rgba(200, 100, 50, 0.1)",
    fogColor: "rgba(8, 2, 6, 0.45)",
  },
  dungeon_5: {
    skyTop: "#030005",
    skyBottom: "#0c0315",
    mountains: "#06030c",
    buildings: "#0e0614",
    moonColor: "rgba(100, 255, 200, 0.08)",
    fogColor: "rgba(6, 2, 8, 0.5)",
  },
  dungeon_6: {
    skyTop: "#080008",
    skyBottom: "#120420",
    mountains: "#0a0612",
    buildings: "#140a1c",
    moonColor: "rgba(255, 150, 200, 0.1)",
    fogColor: "rgba(10, 4, 10, 0.5)",
  },
  dungeon_7: {
    skyTop: "#04000a",
    skyBottom: "#0e0420",
    mountains: "#080614",
    buildings: "#100a1c",
    moonColor: "rgba(150, 100, 255, 0.12)",
    fogColor: "rgba(8, 4, 12, 0.55)",
  },
  dungeon_8: {
    skyTop: "#020006",
    skyBottom: "#0a0320",
    mountains: "#050410",
    buildings: "#0c081a",
    moonColor: "rgba(255, 50, 100, 0.1)",
    fogColor: "rgba(5, 2, 10, 0.6)",
  },
  dungeon_9: {
    skyTop: "#060006",
    skyBottom: "#100430",
    mountains: "#0a0616",
    buildings: "#120a20",
    moonColor: "rgba(200, 50, 255, 0.1)",
    fogColor: "rgba(8, 3, 12, 0.6)",
  },
  dungeon_10: {
    skyTop: "#010002",
    skyBottom: "#080220",
    mountains: "#04030e",
    buildings: "#0a0616",
    moonColor: "rgba(255, 0, 50, 0.08)",
    fogColor: "rgba(4, 2, 8, 0.65)",
  },
  dungeon_11: {
    skyTop: "#000001",
    skyBottom: "#050220",
    mountains: "#03030c",
    buildings: "#080612",
    moonColor: "rgba(255, 200, 0, 0.06)",
    fogColor: "rgba(3, 2, 6, 0.7)",
  },
  dungeon_12: {
    skyTop: "#000002",
    skyBottom: "#040228",
    mountains: "#02030a",
    buildings: "#060410",
    moonColor: "rgba(255, 100, 0, 0.08)",
    fogColor: "rgba(3, 1, 6, 0.75)",
  },
  dungeon_13: {
    skyTop: "#000003",
    skyBottom: "#030230",
    mountains: "#010208",
    buildings: "#04030e",
    moonColor: "rgba(200, 0, 0, 0.1)",
    fogColor: "rgba(2, 1, 4, 0.8)",
  },
};

export class ParallaxBackground {
  private theme: BackgroundTheme = THEMES.town;
  private starPositions: { x: number; y: number; size: number; brightness: number }[] = [];
  private fireflies: { x: number; y: number; phase: number; speed: number; drift: number; size: number }[] = [];

  private readonly HUD_ZONE = { x: 0, y: 0, w: 200, h: 100 };
  private readonly MOON_X = 300;
  private readonly MOON_Y = 120;

  constructor() {
    this.generateStars();
    this.generateFireflies();
  }

  private generateStars(): void {
    for (let i = 0; i < 180; i++) {
      let x: number, y: number;
      do {
        x = Math.random() * 4000;
        y = Math.random() * 400;
      } while (x < this.HUD_ZONE.w && y < this.HUD_ZONE.h);

      const distFromMoon = Math.sqrt(
        (x - this.MOON_X) ** 2 + (y - this.MOON_Y) ** 2,
      );
      const moonWeight = Math.max(0, 1 - distFromMoon / 600);
      const brightness = Math.random() * 0.3 + 0.1 + moonWeight * 0.6;
      const size = brightness > 0.6 ? Math.random() * 1.2 + 0.8 : Math.random() * 0.8 + 0.4;

      this.starPositions.push({ x, y, size, brightness });
    }

    this.starPositions.sort((a, b) => a.brightness - b.brightness);
  }

  private generateFireflies(): void {
    for (let i = 0; i < 12; i++) {
      this.fireflies.push({
        x: Math.random() * 3200,
        y: 300 + Math.random() * 250,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        drift: Math.random() * 40 + 10,
        size: Math.random() * 2 + 1.5,
      });
    }
  }

  setTheme(themeName: string): void {
    this.theme = THEMES[themeName] || THEMES.town;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, camY: number): void {
    this.drawSky(ctx, w, h);
    this.drawStars(ctx, w, h, camX);
    this.drawMoon(ctx, w, h, camX);
    this.drawMoonLightGlow(ctx, w, h, camX);

    this.drawLayer(ctx, w, h, camX, 0.02, () => {
      this.drawMountainSilhouettes(ctx, w, h, camX);
    });

    this.drawLayer(ctx, w, h, camX, 0.05, () => {
      this.drawDistantBuildings(ctx, w, h, camX);
    });

    this.drawLayer(ctx, w, h, camX, 0.1, () => {
      this.drawMidBuildings(ctx, w, h, camX);
    });

    this.drawLayer(ctx, w, h, camX, 0.15, () => {
      this.drawForegroundBuildings(ctx, w, h, camX);
    });

    this.drawFireflies(ctx, w, h, camX);
    this.drawFog(ctx, w, h, camX);
  }

  getMoonX(camX: number): number {
    return this.MOON_X - camX * 0.02;
  }

  getMoonY(): number {
    return this.MOON_Y;
  }

  private drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, this.theme.skyTop);
    gradient.addColorStop(1, this.theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  private drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number): void {
    for (const star of this.starPositions) {
      const sx = star.x - camX * 0.01;
      if (sx > -10 && sx < w + 10 && star.y < 400) {
        const twinkle = Math.sin(performance.now() * (0.0008 + star.brightness * 0.002) + star.x) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        ctx.fillStyle = `rgba(220, 220, 255, ${alpha})`;
        ctx.fillRect(sx, star.y, star.size, star.size);
      }
    }
  }

  private drawMoon(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number): void {
    const mx = this.getMoonX(camX);
    const my = this.MOON_Y;

    ctx.fillStyle = this.theme.moonColor;
    ctx.beginPath();
    ctx.arc(mx, my, 60, 0, Math.PI * 2);
    ctx.fill();

    const glowColor = this.theme.moonColor;
    const glow = ctx.createRadialGradient(mx, my, 20, mx, my, 180);
    glow.addColorStop(0, glowColor.replace("0.3", "0.12").replace("0.15", "0.06").replace("0.12", "0.05"));
    glow.addColorStop(0.5, glowColor.replace("0.3", "0.04").replace("0.15", "0.02").replace("0.12", "0.015"));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, 180, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMoonLightGlow(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number): void {
    const mx = this.getMoonX(camX);
    const my = this.MOON_Y;
    const moonGlow = ctx.createRadialGradient(mx, my + 60, 40, mx, h, 250);
    moonGlow.addColorStop(0, "rgba(200, 180, 255, 0.08)");
    moonGlow.addColorStop(0.5, "rgba(200, 180, 255, 0.03)");
    moonGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, h - 400, w, 400);
  }

  private drawLayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
    speed: number,
    drawFn: () => void,
  ): void {
    ctx.save();
    ctx.translate(-camX * speed, 0);
    drawFn();
    ctx.restore();
  }

  private drawMountainSilhouettes(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
  ): void {
    ctx.fillStyle = this.theme.mountains;
    ctx.beginPath();
    ctx.moveTo(0, h);

    const peaks = [
      { x: 0, h: 200 }, { x: 150, h: 120 }, { x: 300, h: 280 },
      { x: 450, h: 180 }, { x: 600, h: 320 }, { x: 800, h: 220 },
      { x: 1000, h: 360 }, { x: 1200, h: 260 }, { x: 1400, h: 300 },
      { x: 1600, h: 200 }, { x: 1800, h: 340 }, { x: 2000, h: 240 },
      { x: 2200, h: 280 }, { x: 2400, h: 180 }, { x: 2600, h: 310 },
      { x: 2800, h: 220 }, { x: 3000, h: 360 },
    ];

    for (const m of peaks) {
      ctx.lineTo(m.x, h - m.h);
      ctx.lineTo(m.x + 40, h - m.h + 30);
    }
    ctx.lineTo(3200, h);
    ctx.closePath();
    ctx.fill();
  }

  private drawDistantBuildings(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
  ): void {
    ctx.fillStyle = this.theme.mountains;
    const buildings = [
      { x: 100, w: 60, h: 180 }, { x: 200, w: 40, h: 240 },
      { x: 280, w: 80, h: 160 }, { x: 400, w: 50, h: 220 },
      { x: 500, w: 70, h: 200 }, { x: 620, w: 45, h: 260 },
      { x: 720, w: 90, h: 190 }, { x: 860, w: 55, h: 230 },
      { x: 960, w: 65, h: 210 }, { x: 1100, w: 50, h: 250 },
      { x: 1200, w: 80, h: 180 }, { x: 1350, w: 60, h: 240 },
      { x: 1480, w: 45, h: 280 }, { x: 1580, w: 70, h: 200 },
      { x: 1700, w: 55, h: 230 }, { x: 1850, w: 85, h: 210 },
      { x: 2000, w: 50, h: 260 }, { x: 2100, w: 75, h: 190 },
      { x: 2250, w: 60, h: 250 }, { x: 2400, w: 90, h: 200 },
      { x: 2550, w: 50, h: 240 },
    ];

    for (const b of buildings) {
      ctx.fillRect(b.x, h - b.h - 60, b.w, b.h);
      if (b.w > 50) {
        ctx.fillRect(b.x + 5, h - b.h - 70, b.w - 10, 10);
      }
      const lit = Math.sin(b.x * 0.1) > 0.3;
      if (lit) {
        ctx.fillStyle = "rgba(200, 180, 150, 0.08)";
        ctx.fillRect(b.x + 10, h - b.h - 40, 8, 12);
        ctx.fillRect(b.x + b.w - 18, h - b.h - 40, 8, 12);
        ctx.fillStyle = this.theme.mountains;
      }
    }
  }

  private drawMidBuildings(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
  ): void {
    ctx.fillStyle = this.theme.buildings;
    this.drawBuildingCluster(ctx, h, 50, 40, 80, 3);
    this.drawBuildingCluster(ctx, h, 180, 60, 140, 5);
    this.drawBuildingCluster(ctx, h, 310, 45, 100, 3);
    this.drawBuildingCluster(ctx, h, 440, 80, 160, 6);
    this.drawBuildingCluster(ctx, h, 600, 50, 110, 3);
    this.drawBuildingCluster(ctx, h, 730, 70, 130, 5);
    this.drawBuildingCluster(ctx, h, 880, 55, 90, 4);
    this.drawBuildingCluster(ctx, h, 1020, 90, 150, 7);
    this.drawBuildingCluster(ctx, h, 1190, 45, 120, 3);
    this.drawBuildingCluster(ctx, h, 1310, 65, 100, 4);
    this.drawBuildingCluster(ctx, h, 1460, 50, 140, 5);
    this.drawBuildingCluster(ctx, h, 1590, 75, 110, 4);
    this.drawBuildingCluster(ctx, h, 1740, 60, 130, 5);
    this.drawBuildingCluster(ctx, h, 1880, 80, 90, 6);
    this.drawBuildingCluster(ctx, h, 2040, 45, 150, 3);
    this.drawBuildingCluster(ctx, h, 2170, 70, 120, 5);
    this.drawBuildingCluster(ctx, h, 2320, 55, 100, 4);
    this.drawBuildingCluster(ctx, h, 2460, 85, 140, 6);
    this.drawBuildingCluster(ctx, h, 2620, 50, 110, 3);
  }

  private drawForegroundBuildings(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
  ): void {
    ctx.fillStyle = "#0a0810";
    this.drawBuildingCluster(ctx, h, 0, 90, 100, 4);
    this.drawBuildingCluster(ctx, h, 160, 55, 70, 2);
    this.drawBuildingCluster(ctx, h, 280, 110, 120, 5);
    this.drawBuildingCluster(ctx, h, 460, 65, 90, 3);
    this.drawBuildingCluster(ctx, h, 590, 80, 110, 4);
    this.drawBuildingCluster(ctx, h, 750, 50, 80, 2);
    this.drawBuildingCluster(ctx, h, 870, 95, 130, 6);
    this.drawBuildingCluster(ctx, h, 1040, 60, 90, 3);
    this.drawBuildingCluster(ctx, h, 1170, 75, 110, 4);
    this.drawBuildingCluster(ctx, h, 1330, 100, 100, 5);
    this.drawBuildingCluster(ctx, h, 1500, 55, 120, 3);
    this.drawBuildingCluster(ctx, h, 1630, 85, 90, 4);
    this.drawBuildingCluster(ctx, h, 1790, 65, 110, 3);
    this.drawBuildingCluster(ctx, h, 1930, 90, 100, 5);
    this.drawBuildingCluster(ctx, h, 2090, 50, 130, 2);
    this.drawBuildingCluster(ctx, h, 2220, 75, 90, 4);
    this.drawBuildingCluster(ctx, h, 2370, 60, 120, 3);
    this.drawBuildingCluster(ctx, h, 2510, 80, 100, 4);
    this.drawBuildingCluster(ctx, h, 2670, 70, 90, 3);
  }

  private drawBuildingCluster(
    ctx: CanvasRenderingContext2D,
    h: number,
    x: number,
    bw: number,
    bh: number,
    windowCount: number,
  ): void {
    const baseY = h - bh - 60;
    ctx.fillRect(x, baseY, bw, bh);
    ctx.fillRect(x - 4, baseY - 8, bw + 8, 8);
    ctx.fillRect(x + 4, baseY - 16, bw - 8, 8);

    if (bw > 40) {
      const winCols = windowCount > 4 ? 2 : 1;
      const winRows = Math.ceil(windowCount / winCols);
      const winW = 8;
      const winH = 10;
      const gapX = (bw - winCols * winW) / (winCols + 1);
      const gapY = (bh - 40 - winRows * winH) / (winRows + 1);

      for (let row = 0; row < winRows; row++) {
        for (let col = 0; col < winCols; col++) {
          const lit = Math.sin((x + col * 40 + row * 30) * 0.5) > 0.2;
          ctx.fillStyle = lit
            ? "rgba(255, 200, 100, 0.25)"
            : "rgba(40, 30, 50, 0.4)";
          const wx = x + gapX + col * (winW + gapX);
          const wy = baseY + 30 + row * (winH + gapY);
          ctx.fillRect(wx, wy, winW, winH);
        }
      }
    }
  }

  private drawFireflies(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number): void {
    const now = performance.now();
    for (const ff of this.fireflies) {
      const sx = ff.x - camX * 0.03;
      if (sx > -20 && sx < w + 20) {
        const pulse = Math.sin(now * 0.002 * ff.speed + ff.phase) * 0.4 + 0.6;
        const driftY = Math.sin(now * 0.001 * ff.speed * 0.7 + ff.phase) * ff.drift;
        const glow = ctx.createRadialGradient(sx, ff.y + driftY, 0, sx, ff.y + driftY, 20);
        glow.addColorStop(0, `rgba(200, 220, 100, ${pulse * 0.5})`);
        glow.addColorStop(0.5, `rgba(200, 220, 100, ${pulse * 0.15})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, ff.y + driftY, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(200, 255, 150, ${pulse * 0.9})`;
        ctx.beginPath();
        ctx.arc(sx, ff.y + driftY, ff.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawFog(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number): void {
    this.drawLayer(ctx, w, h, camX, 0.03, () => {
      ctx.fillStyle = this.theme.fogColor;
      ctx.fillRect(0, h - 80, 3200, 80);

      for (let i = 0; i < 5; i++) {
        const fx = i * 200 + Math.sin(performance.now() * 0.0005 + i * 1.5) * 30;
        const fy = h - 60 + Math.sin(performance.now() * 0.0008 + i * 2) * 10;
        const fogGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120);
        fogGrad.addColorStop(0, "rgba(40, 30, 50, 0.08)");
        fogGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, 120, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}
