class SoundSystem {
  // Add future combo callouts here; voice playback is isolated from synthesized SFX/BGM.
  private readonly comboVoiceUrls = [
    '/assets/voice/checkpoint.wav',
    '/assets/voice/brilliant.wav'
  ];
  private lastComboVoiceIndex = -1;
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  // MP3 BGM 관리 및 덕킹(Ducking) 타이머
  private bgmAudio: HTMLAudioElement | null = null;
  private defaultBgmVolume = 0.20; // SFX와 밸런스를 위해 기본 볼륨을 0.35 -> 0.20으로 조정
  private bgmDuckingTimer: ReturnType<typeof setTimeout> | null = null;

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

  public startBgm() {
    if (!this.enabled) return;

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/assets/audio/bgm_waltz.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.defaultBgmVolume;
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
    if (this.bgmDuckingTimer) {
      clearTimeout(this.bgmDuckingTimer);
      this.bgmDuckingTimer = null;
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

  // Victory fanfare
  public playVictory() {
    if (!this.enabled) return;

    // 1. BGM 볼륨 덕킹: 승리 연출 시 BGM 볼륨을 0.05로 획기적으로 낮춤
    if (this.bgmAudio && !this.bgmAudio.paused) {
      if (this.bgmDuckingTimer) clearTimeout(this.bgmDuckingTimer);
      this.bgmAudio.volume = 0.05;

      // 승리 SFX 연출이 완료되는 약 2.1초 후 원래 BGM 볼륨으로 복구
      this.bgmDuckingTimer = setTimeout(() => {
        if (this.bgmAudio) {
          this.bgmAudio.volume = this.defaultBgmVolume;
        }
      }, 2100);
    }

    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. 깊은 첼로/베이스 울림
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(164.81, now);
      bassOsc.frequency.exponentialRampToValueAtTime(82.41, now + 1.2);
      bassGain.gain.setValueAtTime(0.22, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 1.2);

      // 2. 오르골/하프시코드 아르페지오
      const arpeggioNotes = [329.63, 392.00, 493.88, 659.25, 783.99, 987.77, 1318.51];
      arpeggioNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });

      // 3. 맑은 금빛 종소리 배음
      const bellFreqs = [1318.51, 1975.53, 2637.02];
      bellFreqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + 0.28;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15 / (idx + 1), startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.85);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

export const sound = new SoundSystem();