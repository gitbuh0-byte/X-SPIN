
class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private playPromises: Record<string, Promise<void> | null> = {};
  private muted: boolean = false;
  private bgmPlaying: boolean = false;
  private hasInteracted: boolean = false;

  constructor() {
    this.sounds = {
      bgm: new Audio('https://ia800605.us.archive.org/8/items/DavidKBD_Cyberpunk_Pack/01_Cyberpunk_City_No_Drum.mp3'),
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
    };

    this.sounds.bgm.loop = true;
    this.sounds.bgm.volume = 0.15;
    this.sounds.spin.loop = true;
    this.sounds.spin.volume = 0.5;
  }

  play(key: string) {
    if (this.muted) return;
    this.hasInteracted = true;
    
    const sound = this.sounds[key];
    if (sound) {
      if (key === 'bgm') {
        if (!this.bgmPlaying) {
          const p = sound.play();
          this.playPromises[key] = p;
          p.then(() => { this.bgmPlaying = true; })
           .catch(() => { /* Silent fail */ });
        }
        return;
      }
      
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
    const sound = this.sounds[key];
    const promise = this.playPromises[key];
    if (sound) {
      if (promise) {
        // Only pause after the play promise has resolved to avoid interruption error
        promise.then(() => {
          sound.pause();
          sound.currentTime = 0;
        }).catch(() => {});
      } else {
        sound.pause();
        sound.currentTime = 0;
      }
      if (key === 'bgm') this.bgmPlaying = false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    Object.values(this.sounds).forEach(s => s.pause());
    if (!this.muted && this.hasInteracted) {
      this.play('bgm');
    } else {
      this.bgmPlaying = false;
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const soundManager = new SoundManager();
