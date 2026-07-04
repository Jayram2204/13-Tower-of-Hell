import type { InputManager } from "../InputManager";
import { Vector2 } from "../Vector2";
import type { SilhouetteRenderer } from "../rendering/SilhouetteRenderer";
import type { Player } from "./Player";

export interface NPCConfig {
  id: string;
  name: string;
  title: string;
  position: Vector2;
  dialog: string[];
  interactionRange: number;
  type:
    | "blacksmith"
    | "mage"
    | "manager"
    | "registrar"
    | "bounty"
    | "gatekeeper"
    | "merchant"
    | "quest_giver"
    | "teo_merchant";
  patrolRange?: number;
  patrolSpeed?: number;
}

export class NPC {
  config: NPCConfig;
  interacted = false;
  private bobTimer = 0;
  private playerInRange = false;
  private dialogIndex = 0;
  private dialogTimer = 0;
  private showingDialog = false;

  private patrolDir = 1;
  private patrolOrigin: number;
  private patrolTimer = 0;
  private moveX = 0;
  private facingRight = true;

  constructor(config: NPCConfig) {
    this.config = config;
    this.patrolOrigin = config.position.x;
  }

  update(dt: number): void {
    this.bobTimer += dt;

    if (this.config.patrolRange && this.config.patrolRange > 0) {
      this.patrolTimer += dt;
      const range = this.config.patrolRange;
      const speed = this.config.patrolSpeed ?? 40;
      const wander = Math.sin(this.patrolTimer * 0.5) * range;
      this.config.position.x = this.patrolOrigin + wander;

      const prevDir = this.facingRight;
      const wanderDelta = Math.cos(this.patrolTimer * 0.5) * range * 0.5;
      this.facingRight = wanderDelta >= 0;
      this.moveX = Math.abs(wanderDelta) > 0.5 ? (this.facingRight ? 1 : -1) : 0;
    }
  }

  updateInteraction(player: Player, input: InputManager): void {
    const dist = player.position.distanceTo(this.config.position);
    this.playerInRange = dist < this.config.interactionRange;

    if (this.playerInRange && input.justPressed("KeyE")) {
      this.interacted = true;
      this.showingDialog = true;
      this.dialogIndex = 0;
      this.dialogTimer = 0;
    }

    if (this.showingDialog) {
      this.dialogTimer += 1 / 60;
      if (this.dialogTimer > 2.5) {
        this.dialogTimer = 0;
        this.dialogIndex++;
        if (this.dialogIndex >= this.config.dialog.length) {
          this.showingDialog = false;
        }
      }
    }
  }

  get inRange(): boolean {
    return this.playerInRange;
  }

  render(ctx: CanvasRenderingContext2D, renderer: SilhouetteRenderer): void {
    const npcW = 48;
    const npcH = 80;
    const bob = Math.sin(this.bobTimer * 1.5) * 3;
    const cx = this.config.position.x + npcW / 2;
    const cy = this.config.position.y + npcH + bob;

    renderer.drawNPC(ctx, cx, cy, this.config.type, this.config.name);

    if (this.playerInRange) {
      const labelY = cy - npcH - 18;
      const name = `${this.config.name}`;
      const title = this.config.title;

      ctx.save();
      ctx.font = 'bold 10px "Courier New", monospace';
      const nw = ctx.measureText(name).width;
      ctx.font = '8px "Courier New", monospace';
      const tw = ctx.measureText(title).width;
      const boxW = Math.max(nw, tw) + 16;
      const boxH = 26;
      const bx = cx - boxW / 2;

      ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
      ctx.beginPath();
      ctx.roundRect(bx, labelY, boxW, boxH, 4);
      ctx.fill();

      ctx.strokeStyle = "#f0c040";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, labelY, boxW, boxH, 4);
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(name, cx, labelY + 16);

      ctx.fillStyle = "rgba(240, 192, 64, 0.7)";
      ctx.font = '8px "Courier New", monospace';
      ctx.textBaseline = "top";
      ctx.fillText(`[${title}]`, cx, labelY + 16);
      ctx.restore();
    }

    if (this.showingDialog) {
      this.renderDialog(ctx, cx, cy);
    }
  }

  private renderDialog(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const text = this.config.dialog[this.dialogIndex] || "";
    const pad = 12;
    const lineH = 20;
    const lines = this.wrapText(text, 280);
    const boxW = 320;
    const boxH = lines.length * lineH + pad * 2;
    const bx = Math.max(10, Math.min(cx - boxW / 2, ctx.canvas.width - boxW - 10));
    const by = cy - 80 - boxH - 40;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.strokeStyle = "rgba(240, 192, 64, 0.4)";
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = "#e0d8c8";
    ctx.font = '13px "Courier New", monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + pad, by + pad + (i + 1) * lineH - 4);
    });
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (test.length * 8 > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
}
