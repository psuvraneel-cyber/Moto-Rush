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
  private currentGear: number = 1;

  // Wind noise synthesizer nodes
  private windNoise: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

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

    // Continuous dynamic high-speed wind noise generator
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 2);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      this.windNoise = this.ctx.createBufferSource();
      this.windNoise.buffer = noiseBuffer;
      this.windNoise.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(500, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.windNoise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.sfxGain);
      this.windNoise.start();
    } catch (_) {}
  }

  public updateEnginePitch(speedRatio: number, isTurbo: boolean = false): void {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.isEngineRunning) return;

    // 6-Speed motorcycle gearbox simulation
    const speedKmH = speedRatio * 72;
    let gear = 1;
    let gearMinSpeed = 0;
    let gearMaxSpeed = 42;

    if (speedKmH > 135) {
      gear = 6;
      gearMinSpeed = 130;
      gearMaxSpeed = 185;
    } else if (speedKmH > 105) {
      gear = 5;
      gearMinSpeed = 100;
      gearMaxSpeed = 145;
    } else if (speedKmH > 80) {
      gear = 4;
      gearMinSpeed = 75;
      gearMaxSpeed = 115;
    } else if (speedKmH > 55) {
      gear = 3;
      gearMinSpeed = 50;
      gearMaxSpeed = 90;
    } else if (speedKmH > 32) {
      gear = 2;
      gearMinSpeed = 28;
      gearMaxSpeed = 65;
    }

    // Gear shift acoustic trigger on gear transition
    if (this.isEngineRunning && gear !== this.currentGear) {
      this.playGearShift(gear > this.currentGear);
      this.currentGear = gear;
    }

    const gearProgress = Math.max(0, Math.min(1, (speedKmH - gearMinSpeed) / (gearMaxSpeed - gearMinSpeed)));
    const rpmPitch = 55 + (gearProgress * 95) + (gear * 6);
    const turboBoost = isTurbo ? 1.45 : 1.0;
    const freq = rpmPitch * turboBoost;

    this.engineOsc1.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.06);
    this.engineOsc2.frequency.setTargetAtTime(freq * 1.018, this.ctx.currentTime, 0.06);

    const filterCutoff = (320 + gearProgress * 750 + (gear * 50)) * turboBoost;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.06);

    // Wind noise dynamic scaling with motorcycle speed
    if (this.windGain && this.windFilter) {
      const windVol = Math.min(0.24, Math.max(0, (speedRatio - 0.45) * 0.18));
      const targetVol = this.isMuted ? 0 : windVol;
      const gainParam = this.windGain.gain;
      if (typeof gainParam.setTargetAtTime === 'function') {
        gainParam.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
      } else if (typeof gainParam.setValueAtTime === 'function') {
        gainParam.setValueAtTime(targetVol, this.ctx.currentTime);
      } else {
        gainParam.value = targetVol;
      }

      const filterParam = this.windFilter.frequency;
      const targetFreq = 500 + speedRatio * 900;
      if (typeof filterParam.setTargetAtTime === 'function') {
        filterParam.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
      } else if (typeof filterParam.setValueAtTime === 'function') {
        filterParam.setValueAtTime(targetFreq, this.ctx.currentTime);
      } else {
        filterParam.value = targetFreq;
      }
    }
  }

  public playGearShift(isUpshift: boolean = true): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isUpshift ? 200 : 130, now);
    osc.frequency.exponentialRampToValueAtTime(isUpshift ? 75 : 240, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playOvertakeWhoosh(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.28);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.29);
  }

  public playTrafficHorn(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(370, now); // F#4
    osc2.frequency.setValueAtTime(440, now); // A4 (dissonant car dual-tone)

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.setValueAtTime(0.15, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  public playTireSqueal(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playNitroRoar(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Low rumble + hiss
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.65);
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
      if (this.windNoise) {
        this.windNoise.stop();
        this.windNoise.disconnect();
        this.windNoise = null;
      }
      if (this.windFilter) {
        this.windFilter.disconnect();
        this.windFilter = null;
      }
      if (this.windGain) {
        this.windGain.disconnect();
        this.windGain = null;
      }
      this.currentGear = 1;
    } catch (e) {
      // Ignored
    }
    this.isEngineRunning = false;
  }

  // --- SOUND EFFECTS ---
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

  public playNearMiss(): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playComboUp(streak: number = 1): void {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const baseFreq = Math.min(1800, 523.25 + streak * 80);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.24);
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
