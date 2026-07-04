export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnimationDef {
  frames: SpriteFrame[];
  frameDuration: number;
  loop: boolean;
}

export class SpriteManager {
  private cache = new Map<string, HTMLImageElement>();
  private pending = new Map<string, Promise<HTMLImageElement>>();

  async load(url: string): Promise<HTMLImageElement> {
    const existing = this.cache.get(url);
    if (existing) return existing;

    const pending = this.pending.get(url);
    if (pending) return pending;

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        this.pending.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.pending.delete(url);
        reject(new Error(`Failed to load: ${url}`));
      };
      img.src = url;
    });

    this.pending.set(url, promise);
    return promise;
  }

  get(url: string): HTMLImageElement | undefined {
    return this.cache.get(url);
  }

  isLoaded(url: string): boolean {
    return this.cache.has(url);
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    frame: SpriteFrame,
    dx: number,
    dy: number,
    flipX = false,
    scale = 1,
    alpha = 1,
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flipX) {
      ctx.translate(dx + frame.w * scale, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        frame.x, frame.y, frame.w, frame.h,
        0, dy, frame.w * scale, frame.h * scale,
      );
    } else {
      ctx.drawImage(
        image,
        frame.x, frame.y, frame.w, frame.h,
        dx, dy, frame.w * scale, frame.h * scale,
      );
    }
    ctx.restore();
  }
}

export function createSimpleAnim(
  imgW: number,
  imgH: number,
  cols: number,
  rows: number,
  frameW: number,
  frameH: number,
  frameDuration: number,
  loop = true,
  startFrame = 0,
  endFrame?: number,
): AnimationDef {
  const frames: SpriteFrame[] = [];
  const total = endFrame ?? cols * rows;
  for (let i = startFrame; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    frames.push({ x: col * frameW, y: row * frameH, w: frameW, h: frameH });
  }
  return { frames, frameDuration, loop };
}
