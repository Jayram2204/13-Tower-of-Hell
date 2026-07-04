import { Vector2 } from "./Vector2";

export class Camera {
  position: Vector2 = new Vector2(0, 0);
  target: Vector2 = new Vector2(0, 0);
  width: number;
  height: number;

  private readonly LERP_SPEED = 0.08;
  private readonly WORLD_HEIGHT = 720;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  follow(targetPos: Vector2): void {
    this.target.x = targetPos.x - this.width / 2;
    this.target.y = 0;
  }

  update(): void {
    this.position.lerpMut(this.target, this.LERP_SPEED);
    this.position.x = Math.max(0, this.position.x);
  }

  get offsetX(): number {
    return Math.floor(this.position.x);
  }

  get offsetY(): number {
    return 0;
  }

  worldToScreen(worldPos: Vector2): Vector2 {
    return new Vector2(worldPos.x - this.position.x, worldPos.y);
  }

  screenToWorld(screenPos: Vector2): Vector2 {
    return new Vector2(screenPos.x + this.position.x, screenPos.y);
  }

  isVisible(x: number, y: number, width = 0, height = 0, margin = 100): boolean {
    return (
      x + width >= this.position.x - margin &&
      x <= this.position.x + this.width + margin &&
      y + height >= -margin &&
      y <= this.height + margin
    );
  }
}
