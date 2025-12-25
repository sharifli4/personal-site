/* ============================================
   RETRO TV PORTFOLIO - Main Application
   Initialization and global event handling
   ============================================ */

/**
 * RetroTV Application
 * Main entry point
 */
class RetroTVApp {
  constructor() {
    this.tvController = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  init() {
    if (this.isInitialized) return;

    console.log('Retro TV Portfolio - Initializing...');

    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Setup all components
   */
  setup() {
    // Initialize TV Controller
    this.tvController = new TVController();
    this.tvController.init();

    // Auto turn on TV after short delay (without sound - browser blocks autoplay)
    setTimeout(() => {
      this.tvController.powerOnSilent();
    }, 500);

    // Initialize audio on first user interaction
    this.initAudioOnInteraction();

    // Handle visibility changes (pause when tab hidden)
    this.handleVisibility();

    // Add swipe gestures for mobile
    this.addSwipeGestures();

    this.isInitialized = true;
    console.log('Retro TV Portfolio - Ready!');
    console.log('Press SPACE to power on/off, Arrow keys to change channels');
  }

  /**
   * Initialize audio on first user interaction (required by browsers)
   */
  initAudioOnInteraction() {
    const initAudio = () => {
      if (window.audioManager && !window.audioManager.initialized) {
        window.audioManager.init();
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);
  }

  /**
   * Add visual hint for first interaction
   */
  addInteractionHint() {
    const powerBtn = document.getElementById('powerButton');
    if (!powerBtn) return;

    // Add pulsing hint
    powerBtn.classList.add('hint-pulse');

    // Remove after first click
    const removeHint = () => {
      powerBtn.classList.remove('hint-pulse');
      powerBtn.removeEventListener('click', removeHint);
    };
    powerBtn.addEventListener('click', removeHint);

    // Add CSS for hint animation
    const style = document.createElement('style');
    style.textContent = `
      .hint-pulse {
        animation: hintPulse 2s ease infinite;
      }
      @keyframes hintPulse {
        0%, 100% { box-shadow: 3px 4px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(255,100,100,0); }
        50% { box-shadow: 3px 4px 8px rgba(0,0,0,0.4), 0 0 0 10px rgba(255,100,100,0.3); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle page visibility changes
   */
  handleVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause audio when tab is hidden
        if (window.audioManager) {
          window.audioManager.stopAll();
        }
      }
    });
  }

  /**
   * Add swipe gestures for mobile channel switching
   */
  addSwipeGestures() {
    const screen = document.getElementById('tvScreen');
    if (!screen) return;

    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 50;

    screen.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    screen.addEventListener('touchend', (e) => {
      if (!this.tvController?.isOn) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Check if horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe right - previous channel
          this.tvController.prevChannel();
        } else {
          // Swipe left - next channel
          this.tvController.nextChannel();
        }
      }
      // Check if vertical swipe
      else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          // Swipe down - previous channel
          this.tvController.prevChannel();
        } else {
          // Swipe up - next channel
          this.tvController.nextChannel();
        }
      }
    }, { passive: true });
  }

  /**
   * Get TV controller instance
   */
  getController() {
    return this.tvController;
  }
}

// Create and initialize app
const app = new RetroTVApp();
app.init();

// Expose to global scope for debugging
window.retroTV = app;
