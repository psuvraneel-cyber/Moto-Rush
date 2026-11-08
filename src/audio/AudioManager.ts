export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine synthesizer nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Music sequencer state
  private isMusicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private currentStep: number = 0;
  private bpm: number = 126;

  private sfxVolume: number = 0.85;
  private musicVolume: number = 0.7;
  private isMuted: boolean = false;

  constructor() {
    this.setupVisibilityListener();
  }

  private initContext(): void {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);
  }

  public ensureContext(): void {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSettings(sfxVol: number, musicVol: number, mute: boolean): void {
    this.sfxVolume = sfxVol;
    this.musicVolume = musicVol;
    this.isMuted = mute;

    if (this.ctx && this.masterGain && this.sfxGain && this.musicGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVolume * 0.45, this.ctx.currentTime); // keep music pleasant
    }
  }

  // --- MOTORCYCLE ENGINE SYNTHESIS ---
  public startEngine(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isEngineRunning) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'sawtooth';
    this.engineOsc2.frequency.setValueAtTime(55.8, this.ctx.currentTime); // slight detune

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.isEngineRunning = true;
  }

  public updateEnginePitch(speedRatio: number, isTurbo: boolean = false): void {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.isEngineRunning) return;

    const basePitch = 55;
    const turboBoost = isTurbo ? 1.6 : 1.0;
    const freq = (basePitch + speedRatio * 85) * turboBoost;

    this.engineOsc1.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(freq * 1.015, this.ctx.currentTime, 0.08);

    const filterCutoff = (300 + speedRatio * 800) * turboBoost;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.08);
  }

  public stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
        this.engineOsc1 = null;
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
        this.engineOsc2 = null;
      }
      if (this.engineFilter) {
        this.engineFilter.disconnect();
        this.engineFilter = null;
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
    } catch (e) {
      // Ignored
    }
    this.isEngineRunning = false;
  }

  // --- SOUND EFFECTS ---
  public playPositiveGate(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Harmonic arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.2, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.28);
    });
  }

  public playNegativeGate(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playMultiplierChime(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const freqs = [659.25, 830.61, 987.77, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.48);
    });
  }

  public playCoin(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.04); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCrash(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // 1. Noise burst
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.28);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.32);

    // 2. Low impact punch
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 0.24);
  }

  public playShield(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playTurbo(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playClick(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playVictory(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Fanfare: C4, G4, C5, E5, G5
    const notes = [
      { f: 523.25, t: 0.0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.3, d: 0.15 },
      { f: 1046.5, t: 0.45, d: 0.55 },
    ];

    for (const n of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.3, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  }

  // --- PROCEDURAL SYNTHWAVE MUSIC SEQUENCER ---
  public startMusic(tempo: number = 126): void {
    this.ensureContext();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.bpm = tempo;
    this.currentStep = 0;

    const stepDurationMs = (60 / this.bpm / 4) * 1000; // 16th notes
    this.musicIntervalId = window.setInterval(() => {
      this.playMusicStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % 32;
    }, stepDurationMs);
  }

  public stopMusic(): void {
    if (!this.isMusicPlaying) return;
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  private playMusicStep(step: number): void {
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Kick on steps 0, 4, 8, 12, 16, 20, 24, 28 (4-on-the-floor)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(130, now);
      kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      kickGain.gain.setValueAtTime(0.22, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);

      kickOsc.start(now);
      kickOsc.stop(now + 0.12);
    }

    // 2. Offbeat Hi-hat on steps 2, 6, 10, 14, 18, 22, 26, 30
    if (step % 4 === 2) {
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(4200, now);

      hatGain.gain.setValueAtTime(0.04, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      hatOsc.connect(hatGain);
      hatGain.connect(this.musicGain);

      hatOsc.start(now);
      hatOsc.stop(now + 0.05);
    }

    // 3. Synth Arpeggio sequence
    const bassScale = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
    const leadScale = [440, 523.25, 659.25, 523.25, 587.33, 659.25, 783.99, 659.25];

    if (step % 2 === 0) {
      const noteIdx = Math.floor(step / 2) % leadScale.length;
      const freq = leadScale[noteIdx];

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(freq, now);

      leadGain.gain.setValueAtTime(0.08, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(now);
      leadOsc.stop(now + 0.14);
    }
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend();
        }
      } else {
        if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
          this.ctx.resume();
        }
      }
    });
  }
}
