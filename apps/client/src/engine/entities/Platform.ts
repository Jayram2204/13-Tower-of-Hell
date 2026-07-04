export class Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "ground" | "wall" | "ledge" | "floor";

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    type: "ground" | "wall" | "ledge" | "floor" = "ground",
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    switch (this.type) {
      case "ground":
        gradient.addColorStop(0, "rgba(60, 50, 70, 0.95)");
        gradient.addColorStop(0.3, "rgba(40, 35, 50, 0.95)");
        gradient.addColorStop(1, "rgba(20, 18, 28, 0.98)");
        break;
      case "ledge":
        gradient.addColorStop(0, "rgba(70, 58, 80, 0.95)");
        gradient.addColorStop(0.3, "rgba(50, 42, 60, 0.95)");
        gradient.addColorStop(1, "rgba(25, 22, 32, 0.98)");
        break;
      case "floor":
        gradient.addColorStop(0, "rgba(55, 45, 65, 0.9)");
        gradient.addColorStop(0.3, "rgba(35, 30, 45, 0.95)");
        gradient.addColorStop(1, "rgba(15, 12, 22, 0.98)");
        break;
      default:
        gradient.addColorStop(0, "rgba(50, 42, 60, 0.95)");
        gradient.addColorStop(0.3, "rgba(30, 25, 40, 0.95)");
        gradient.addColorStop(1, "rgba(15, 12, 22, 0.98)");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = "rgba(80, 70, 100, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    const topEdge = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 4);
    topEdge.addColorStop(0, "rgba(100, 85, 130, 0.5)");
    topEdge.addColorStop(1, "rgba(80, 70, 100, 0)");
    ctx.fillStyle = topEdge;
    ctx.fillRect(this.x, this.y, this.width, 4);
  }
}
