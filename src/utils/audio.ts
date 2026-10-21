class SoundSystem {
  // Add future combo callouts here; voice playback is isolated from synthesized SFX/BGM.
  private readonly comboVoiceUrls = [
    '/assets/voice/checkpoint.wav',
    '/assets/voice/brilliant.wav'
  ];
  private lastComboVoiceIndex = -1;
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  // MP3 BGM 관리를 위한 오디오 객체
  private bgmAudio: HTMLAudioElement | null = null;

  constructor() {
    // Initialized lazily on first user interaction
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) this.stopBgm();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playComboVoice() {
    if (typeof window === 'undefined' || this.comboVoiceUrls.length === 0) return;
    let index = Math.floor(Math.random() * this.comboVoiceUrls.length);
    if (this.comboVoiceUrls.length > 1 && index === this.lastComboVoiceIndex) {
      index = (index + 1 + Math.floor(Math.random() * (this.comboVoiceUrls.length - 1))) % this.comboVoiceUrls.length;
    }
    this.lastComboVoiceIndex = index;
    try {
      const voice = new Audio(this.comboVoiceUrls[index]);
      voice.volume = 0.9;
      void voice.play().catch(() => {});
    } catch {
      // Voice callouts must not interfere with existing game audio.
    }
  }

  // 파일 기반 BGM 재생 (생성된 음원 활용)
  public startBgm() {
    if (!this.enabled) return;

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/assets/audio/bgm_waltz.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.35;
    }

    if (this.bgmAudio.paused) {
      void this.bgmAudio.play().catch(() => {});
    }
  }

  public stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Swift mark pen / chalk sound
  public playMark() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore audio errors
    }
  }

  // Wooden chess piece placement sound
  public playPlace() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore audio errors
    }
  }

  // Deductive thread chime (golden bell tone)
  public playThread() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
      });
    } catch {
      // Ignore
    }
  }

  // Incorrect blunder / strike
  public playWrong() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }

  // Hint revealed
  public playHint() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  // Victory fanfare (중후하고 웅장한 추리 완성 클래식 팬파레)
  public playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      const chordSteps = [
        { time: 0, duration: 0.28, notes: [146.83, 293.66, 349.23], type: 'sawtooth' as OscillatorType, vol: 0.12 },
        { time: 0.22, duration: 0.28, notes: [116.54, 233.08, 349.23, 466.16], type: 'sawtooth' as OscillatorType, vol: 0.14 },
        { time: 0.44, duration: 0.35, notes: [110.00, 220.00, 277.18, 329.63, 440.00], type: 'sawtooth' as OscillatorType, vol: 0.16 },
        { time: 0.72, duration: 1.5, notes: [73.42, 146.83, 220.00, 293.66, 370.00, 587.33], type: 'triangle' as OscillatorType, vol: 0.22 }
      ];

      chordSteps.forEach(step => {
        step.notes.forEach(freq => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = step.type;
          osc.frequency.setValueAtTime(freq, now + step.time);

          gain.gain.setValueAtTime(0.001, now + step.time);
          gain.gain.linearRampToValueAtTime(step.vol, now + step.time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + step.time + step.duration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + step.time);
          osc.stop(now + step.time + step.duration + 0.05);
        });
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundSystem();