import { Vector2 } from "../Vector2";

interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(position: Vector2, count: number, color = "#f0c040"): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        position: position.copy(),
        velocity: new Vector2((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300 - 100),
        life: Math.random() * 0.5 + 0.5,
        maxLife: Math.random() * 0.5 + 0.5,
        size: Math.random() * 4 + 2,
        color,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.velocity.y += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife) * 0.9;
      const size = p.size * (0.5 + 0.5 * (p.life / p.maxLife));

      ctx.save();
      ctx.globalAlpha = alpha;

      const glow = ctx.createRadialGradient(
        p.position.x, p.position.y, 0,
        p.position.x, p.position.y, size * 5,
      );
      glow.addColorStop(0, hexToRgba(p.color, 0.5));
      glow.addColorStop(0.5, hexToRgba(p.color, 0.15));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, size * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hexToRgba(p.color, 1);
      ctx.fillRect(p.position.x - size / 2, p.position.y - size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
