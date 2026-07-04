export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isPlaying = false;
  private _muted = false;
  private bgVolume = 0.12;
  private sfxVolume = 0.35;
  private currentBpm = 60;
  private beatTimer = 0;
  private bassPattern: number[] = [0, 3, 5, 7, 10, 12, 14, 17];
  private bassIndex = 0;
  private style: "town" | "dungeon" | "combat" = "town";
  private combatTimer = 0;

  get muted(): boolean {
    return this._muted;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgGain = this.ctx.createGain();
      this.bgGain.gain.value = this.bgVolume;
      this.bgGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setStyle(style: "town" | "dungeon" | "combat"): void {
    if (this.style === style) return;
    this.style = style;
    this.currentBpm = style === "town" ? 70 : style === "dungeon" ? 90 : 130;
    this.bassPattern = style === "town"
      ? [0, 3, 5, 7]
      : style === "dungeon"
      ? [0, 3, 5, 7, 10, 12, 14, 17]
      : [0, 3, 5, 7, 10, 12, 14, 17, 19, 21];
    if (style === "combat") {
      this.combatTimer = 3;
    }
  }

  toggleMute(): void {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : 1;
    }
  }

  startMusic(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.scheduleBeat();
  }

  stopMusic(): void {
    this.isPlaying = false;
  }

  private scheduleBeat(): void {
    if (!this.isPlaying || !this.bgGain) return;
    const ctx = this.getContext();
    const beatInterval = 60 / this.currentBpm;

    const playChord = () => {
      if (!this.isPlaying || !this.bgGain) return;

      const baseFreq = 55;
      const root = baseFreq * Math.pow(2, this.bassPattern[this.bassIndex % this.bassPattern.length] / 12);

      const chord = this.style === "combat"
        ? [root, root * 1.5, root * 2]
        : [root, root * 1.25, root * 1.5];

      for (const freq of chord) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = this.style === "combat" ? "square" : "sine";
        osc.frequency.value = freq;

        const sustain = this.style === "combat" ? 0.8 : 2;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.style === "combat" ? 0.1 : 0.08, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + sustain);

        osc.connect(gain);
        gain.connect(this.bgGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + sustain + 0.1);
      }

      if (this.style !== "town") {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = "triangle";
        bassOsc.frequency.value = root * 0.5;
        bassGain.gain.setValueAtTime(0.06, ctx.currentTime);
        bassGain.gain.linearRampToValueAtTime(0, ctx.currentTime + beatInterval * 0.6);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgGain);
        bassOsc.start(ctx.currentTime);
        bassOsc.stop(ctx.currentTime + beatInterval * 0.6);
      }

      if (this.style === "combat") {
        for (let i = 0; i < 2; i++) {
          const hit = ctx.createOscillator();
          const hitG = ctx.createGain();
          hit.type = "sawtooth";
          hit.frequency.value = 80 + Math.random() * 40;
          hitG.gain.setValueAtTime(0.04, ctx.currentTime + i * beatInterval * 0.5);
          hitG.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * beatInterval * 0.5 + 0.05);
          hit.connect(hitG);
          hitG.connect(this.bgGain);
          hit.start(ctx.currentTime + i * beatInterval * 0.5);
          hit.stop(ctx.currentTime + i * beatInterval * 0.5 + 0.06);
        }
      }

      this.bassIndex++;
    };

    const loop = () => {
      if (!this.isPlaying) return;
      playChord();
      const nextBeat = (60 / this.currentBpm) * 1000;
      this.beatTimer = window.setTimeout(loop, nextBeat);
    };

    loop();
  }

  playSwordSwing(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  playHit(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playPickup(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }

  playPlayerHit(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const noise = ctx.createOscillator();
    const gain = ctx.createGain();
    const noiseGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    noise.type = "sawtooth";
    noise.frequency.value = 100;
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.1);
  }

  playEnemyDeath(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  playPortalOpen(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  }

  playQuestComplete(): void {
    const ctx = this.getContext();
    if (!this.sfxGain) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  }
}
