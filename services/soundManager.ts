
class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private playPromises: Record<string, Promise<void> | null> = {};
  private muted: boolean = false;
  private bgmPlaying: boolean = false;
  private hasInteracted: boolean = false;
  private bgmVolume: number = 0.5; // Default 50% for better hearing
  private sfxVolume: number = 0.5;
  private autoplayAttempted: boolean = false;
  private audioContext: AudioContext | null = null;
  private bgmOscillators: OscillatorNode[] = [];

  constructor() {
    this.sounds = {
      bgm: new Audio(),
      spin: new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'),
      win: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
      lose: new Audio('https://assets.mixkit.co/active_storage/sfx/2022/2022-preview.mp3'),
      bet: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
      lock: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
      tick: new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'),
      message: new Audio('https://assets.mixkit.co/active_storage/sfx/2344/2344-preview.mp3'),
      start: new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'),
      hover: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
      click: new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'),
      beep: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
      warning: new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'),
      'spin-end': new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
      'grand-winner': new Audio('https://assets.mixkit.co/active_storage/sfx/2009/2009-preview.mp3'),
    };

    // Set SFX volumes
    Object.keys(this.sounds).forEach(key => {
      if (key !== 'bgm') {
        this.sounds[key].volume = this.sfxVolume;
      }
    });

    // Load saved volumes
    this.loadVolumes();
    
    // Set up click listener for autoplay
    this.setupAutoplayListener();
    
    console.log('🎵 SoundManager initialized - Web Audio BGM system ready');
  }

  private setupAutoplayListener() {
    // Listen for any user interaction to enable autoplay
    const enableAutoplay = () => {
      this.hasInteracted = true;
      if (!this.bgmPlaying && !this.muted) {
        this.play('bgm');
      }
      // Remove listener after first interaction
      document.removeEventListener('click', enableAutoplay);
      document.removeEventListener('keydown', enableAutoplay);
    };
    
    document.addEventListener('click', enableAutoplay);
    document.addEventListener('keydown', enableAutoplay);
  }

  private loadVolumes() {
    const savedSettings = localStorage.getItem('music-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.bgmVolume = settings.bgmVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.5;
        this.muted = settings.muted ?? false;
        this.applyVolumes();
      } catch (e) {
        console.warn('Failed to load saved music settings:', e);
      }
    }
  }

  private applyVolumes() {
    Object.keys(this.sounds).forEach(key => {
      if (key !== 'bgm') {
        this.sounds[key].volume = this.muted ? 0 : this.sfxVolume;
      }
    });
  }

  setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
    this.saveVolumes();
    
    // Apply to Web Audio if playing
    if (this.audioContext && this.bgmPlaying) {
      // Volume changes will take effect on next BGM start
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
    this.saveVolumes();
  }

  getBgmVolume() {
    return this.bgmVolume;
  }

  getSfxVolume() {
    return this.sfxVolume;
  }

  private saveVolumes() {
    localStorage.setItem('music-settings', JSON.stringify({
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
      muted: this.muted,
    }));
  }

  private generateFunkyMusic() {
    // Create Web Audio context if needed
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('🎵 Web Audio API not supported:', e);
        return;
      }
    }

    const ctx = this.audioContext;
    
    // Resume audio context if suspended (required after user gesture)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn('Could not resume AudioContext:', e));
    }

    // Create gainNode for volume control
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(this.muted ? 0 : this.bgmVolume * 0.3, ctx.currentTime);

    // Generate a funky looping pattern
    const playFunkyPattern = () => {
      if (!this.bgmPlaying || this.muted) return;

      // Create a funky bass line and melody
      const now = ctx.currentTime;
      
      // Bass line (low funky pulses)
      const bass = ctx.createOscillator();
      bass.type = 'square';
      bass.frequency.setValueAtTime(80, now);
      bass.frequency.setValueAtTime(90, now + 0.2);
      bass.frequency.setValueAtTime(110, now + 0.4);
      bass.frequency.setValueAtTime(80, now + 0.6);
      
      const bassGain = ctx.createGain();
      bass.connect(bassGain);
      bassGain.connect(gainNode);
      bassGain.gain.setValueAtTime(0.4, now);
      
      // Melody (high funky tones)
      const melody = ctx.createOscillator();
      melody.type = 'sine';
      const melodyNotes = [400, 500, 600, 500, 400, 450, 500, 450];
      
      for (let i = 0; i < melodyNotes.length; i++) {
        melody.frequency.setValueAtTime(melodyNotes[i], now + (i * 0.1));
      }
      
      const melodyGain = ctx.createGain();
      melody.connect(melodyGain);
      melodyGain.connect(gainNode);
      melodyGain.gain.setValueAtTime(0.3, now);
      
      // Start and stop
      const duration = 0.8;
      bass.start(now);
      bass.stop(now + duration);
      melody.start(now);
      melody.stop(now + duration);
      
      this.bgmOscillators.push(bass, melody);
      
      // Schedule next pattern
      if (this.bgmPlaying && !this.muted) {
        setTimeout(() => playFunkyPattern(), duration * 1000);
      }
    };

    // Start the pattern
    playFunkyPattern();
    this.bgmPlaying = true;
    console.log('🎵 Funky background music started (Web Audio)');
  }

  play(key: string) {
    this.hasInteracted = true;
    
    if (key === 'bgm') {
      if (!this.bgmPlaying && !this.muted) {
        this.generateFunkyMusic();
      }
      return;
    }

    // For SFX - respect muted state
    if (this.muted) return;
    
    const sound = this.sounds[key];
    if (sound) {
      if (!sound.loop) {
        sound.currentTime = 0;
      }
      
      const p = sound.play();
      this.playPromises[key] = p;
      if (p !== undefined) {
        p.catch(() => { /* Prevent uncaught interruptions */ });
      }
    }
  }

  stop(key: string) {
    if (key === 'bgm') {
      // Stop all oscillators
      this.bgmOscillators.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Already stopped
        }
      });
      this.bgmOscillators = [];
      this.bgmPlaying = false;
      console.log('🎵 Background music stopped');
      return;
    }

    const sound = this.sounds[key];
    const promise = this.playPromises[key];
    if (sound) {
      if (promise) {
        promise.then(() => {
          sound.pause();
          sound.currentTime = 0;
        }).catch(() => {});
      } else {
        sound.pause();
        sound.currentTime = 0;
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyVolumes();
    this.saveVolumes();
    
    // If unmuting, resume background music
    if (!this.muted && !this.bgmPlaying && this.hasInteracted) {
      this.play('bgm');
    } else if (this.muted && this.bgmPlaying) {
      this.stop('bgm');
    }
    
    console.log('🔊 Mute toggled:', this.muted ? 'MUTED' : 'UNMUTED');
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  isBgmPlaying() {
    return this.bgmPlaying;
  }

  autoPlayBgm() {
    // Attempt to start background music
    if (!this.bgmPlaying && !this.muted && this.hasInteracted) {
      console.log('🎵 Auto-starting background music...');
      this.play('bgm');
    } else if (this.hasInteracted) {
      console.log('🎵 BGM status - Playing:', this.bgmPlaying, 'Muted:', this.muted);
    }
  }

  forceBgmStart() {
    // For explicit user actions - forces music start after interaction
    console.log('🎵 Force starting BGM after user interaction');
    this.hasInteracted = true;
    if (!this.muted) {
      this.play('bgm');
    }
  }

  stopBgm() {
    this.stop('bgm');
  }
}

export const soundManager = new SoundManager();
