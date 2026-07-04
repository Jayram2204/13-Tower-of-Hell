export class InputManager {
  keys: Set<string> = new Set();
  keysJustPressed: Set<string> = new Set();
  private prevKeys: Set<string> = new Set();
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
    };
    this.handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  update(): void {
    this.keysJustPressed.clear();
    for (const key of this.keys) {
      if (!this.prevKeys.has(key)) {
        this.keysJustPressed.add(key);
      }
    }
    this.prevKeys = new Set(this.keys);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  justPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
