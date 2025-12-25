/* ============================================
   RETRO TV PORTFOLIO - Audio Manager
   Handles all sound effects
   ============================================ */

/**
 * AudioManager Class
 * Manages TV sound effects with user interaction requirement
 */
class AudioManager {
  constructor() {
    this.enabled = false;
    this.initialized = false;
    this.volume = 0.5;

    // Audio elements
    this.sounds = {
      click: null,
      static: null,
      powerOn: null,
      powerOff: null
    };

    // Fallback: Generate sounds programmatically if files not found
    this.audioContext = null;
  }

  /**
   * Initialize audio (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;

    // Get audio elements from DOM
    this.sounds.click = document.getElementById('audioClick');
    this.sounds.static = document.getElementById('audioStatic');
    this.sounds.powerOn = document.getElementById('audioPowerOn');
    this.sounds.powerOff = document.getElementById('audioPowerOff');

    // Set volumes
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = this.volume;
      }
    });

    // Create AudioContext for generated sounds
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }

    this.initialized = true;
    this.enabled = true;
  }

  /**
   * Enable/disable sounds
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Set master volume
   * @param {number} vol - Volume 0-1
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = this.volume;
      }
    });
  }

  /**
   * Play click sound
   */
  playClick() {
    if (!this.enabled) return;

    if (this.sounds.click) {
      this.sounds.click.currentTime = 0;
      this.sounds.click.play().catch(() => this.generateClick());
    } else {
      this.generateClick();
    }
  }

  /**
   * Play/stop static noise
   * @param {boolean} play - Start or stop
   */
  playStatic(play = true) {
    if (!this.enabled) return;

    if (this.sounds.static) {
      if (play) {
        this.sounds.static.currentTime = 0;
        this.sounds.static.play().catch(() => {});
      } else {
        this.sounds.static.pause();
        this.sounds.static.currentTime = 0;
      }
    } else if (play) {
      this.generateStatic();
    }
  }

  /**
   * Play power on sound
   */
  playPowerOn() {
    if (!this.enabled) return;

    if (this.sounds.powerOn) {
      this.sounds.powerOn.currentTime = 0;
      this.sounds.powerOn.play().catch(() => this.generatePowerOn());
    } else {
      this.generatePowerOn();
    }
  }

  /**
   * Play power off sound
   */
  playPowerOff() {
    if (!this.enabled) return;

    if (this.sounds.powerOff) {
      this.sounds.powerOff.currentTime = 0;
      this.sounds.powerOff.play().catch(() => this.generatePowerOff());
    } else {
      this.generatePowerOff();
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    });
  }

  // ======= GENERATED SOUNDS (Fallback) =======

  /**
   * Generate mechanical TV button click sound
   */
  generateClick() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create noise burst for the "clunk" attack
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filter for that plastic "thunk" sound
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // Low thump for mechanical weight
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(150, now);
    thump.frequency.exponentialRampToValueAtTime(60, now + 0.04);
    thumpGain.gain.setValueAtTime(this.volume * 0.3, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.05);

    // High click for the switch contact
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(2500, now);
    click.frequency.exponentialRampToValueAtTime(1200, now + 0.008);
    clickGain.gain.setValueAtTime(this.volume * 0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.015);
  }

  /**
   * Generate static noise burst
   */
  generateStatic() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const duration = 0.3;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // White noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.start(ctx.currentTime);
  }

  /**
   * Generate power on sound (rising tone + static)
   */
  generatePowerOn() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Rising hum
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(50, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, ctx.currentTime + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    // Add static burst
    setTimeout(() => this.generateStatic(), 200);
  }

  /**
   * Generate power off sound (falling tone + click)
   */
  generatePowerOff() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Falling hum + degauss-like sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }
}

// Create global instance
window.audioManager = new AudioManager();
