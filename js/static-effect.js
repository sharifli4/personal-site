/* ============================================
   RETRO TV PORTFOLIO - Static Effect
   Canvas-based TV noise/static generator
   ============================================ */

/**
 * StaticEffect Class
 * Generates realistic TV static noise on canvas
 */
class StaticEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas with id "${canvasId}" not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.animationId = null;
    this.intensity = 1; // 0-1

    // Performance settings
    this.fps = 30;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.fps;

    // Initialize canvas size
    this.resize();

    // Handle window resize
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Resize canvas to match parent
   */
  resize() {
    if (!this.canvas) return;

    const parent = this.canvas.parentElement;
    if (parent) {
      // Use lower resolution for performance
      const scale = 0.5;
      this.canvas.width = parent.offsetWidth * scale;
      this.canvas.height = parent.offsetHeight * scale;
    }
  }

  /**
   * Generate a single frame of static
   */
  generateFrame() {
    if (!this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Create image data
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // Generate high contrast B&W noise
    for (let i = 0; i < data.length; i += 4) {
      // Sharp black & white noise
      const rand = Math.random();
      const gray = rand > 0.5 ? 255 : (rand > 0.3 ? 180 : 0);

      data[i] = gray;       // R
      data[i + 1] = gray;   // G
      data[i + 2] = gray;   // B
      data[i + 3] = 255;    // A
    }

    // Add horizontal interference lines
    for (let line = 0; line < 3; line++) {
      if (Math.random() > 0.5) {
        const lineY = Math.floor(Math.random() * height);
        const lineHeight = Math.floor(Math.random() * 3) + 1;

        for (let y = lineY; y < Math.min(lineY + lineHeight, height); y++) {
          const lineStart = y * width * 4;
          const lineEnd = lineStart + width * 4;
          const brightness = Math.random() > 0.5 ? 255 : 200;

          for (let i = lineStart; i < lineEnd; i += 4) {
            data[i] = brightness;
            data[i + 1] = brightness;
            data[i + 2] = brightness;
          }
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Animation loop
   */
  animate(timestamp) {
    if (!this.isRunning) return;

    // Throttle to target FPS
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      this.generateFrame();
    }

    this.animationId = requestAnimationFrame((ts) => this.animate(ts));
  }

  /**
   * Start static animation
   * @param {number} duration - Optional auto-stop duration in ms
   */
  start(duration = null) {
    if (!this.canvas) return;

    this.isRunning = true;
    this.canvas.classList.add('active');
    this.lastFrameTime = 0;
    this.animate(0);

    // Play static sound
    if (window.audioManager) {
      window.audioManager.playStatic(true);
    }

    // Auto-stop after duration
    if (duration) {
      setTimeout(() => this.stop(), duration);
    }
  }

  /**
   * Stop static animation
   */
  stop() {
    this.isRunning = false;
    this.canvas?.classList.remove('active');

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Stop static sound
    if (window.audioManager) {
      window.audioManager.playStatic(false);
    }
  }

  /**
   * Set static intensity
   * @param {number} value - Intensity 0-1
   */
  setIntensity(value) {
    this.intensity = Math.max(0, Math.min(1, value));
  }

  /**
   * Play a burst of static (for channel switching)
   * @param {number} duration - Duration in ms
   * @returns {Promise} Resolves when complete
   */
  burst(duration = 300) {
    return new Promise(resolve => {
      this.start();
      setTimeout(() => {
        this.stop();
        resolve();
      }, duration);
    });
  }

  /**
   * Gradually fade out static
   * @param {number} duration - Fade duration in ms
   */
  fadeOut(duration = 500) {
    const startIntensity = this.intensity;
    const startTime = performance.now();

    const fade = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.intensity = startIntensity * (1 - progress);

      if (progress < 1 && this.isRunning) {
        requestAnimationFrame(fade);
      } else {
        this.stop();
        this.intensity = 1; // Reset
      }
    };

    requestAnimationFrame(fade);
  }
}

// Create global instance
window.StaticEffect = StaticEffect;
