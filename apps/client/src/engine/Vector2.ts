export class Vector2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  addMut(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subMut(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scaleMut(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  lerpMut(target: Vector2, t: number): this {
    this.x += (target.x - this.x) * t;
    this.y += (target.y - this.y) * t;
    return this;
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }
  lerp(target: Vector2, t: number): Vector2 {
    return new Vector2(this.x + (target.x - this.x) * t, this.y + (target.y - this.y) * t);
  }

  copy(): Vector2 {
    return new Vector2(this.x, this.y);
  }
  copyTo(out: Vector2): void {
    out.x = this.x;
    out.y = this.y;
  }
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  distanceTo(v: Vector2): number {
    return this.sub(v).magnitude();
  }
}
