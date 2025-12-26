/* ============================================
   RETRO TV PORTFOLIO - TV Controller
   Main TV state and channel management
   ============================================ */

/**
 * TVController Class
 * Manages TV power state, channels, and display
 */
class TVController {
  constructor() {
    // State
    this.isOn = false;
    this.currentChannel = 1;
    this.isTransitioning = false;
    this.volume = 50;

    // DOM Elements
    this.elements = {
      screen: null,
      screenContent: null,
      screenOff: null,
      channelNumber: null,
      projectTitle: null,
      projectDescription: null,
      projectThumbnail: null,
      projectIcon: null,
      projectUrl: null,
      powerIndicator: null,
      antennaLeft: null,
      antennaRight: null,
      previewContainer: null,
      previewFrame: null,
      projectDisplay: null
    };

    // Preview state tracking
    this.previewLoaded = false;

    // Components
    this.staticEffect = null;
    this.channelKnob = null;
    this.volumeKnob = null;

    // Transition effects
    this.transitionEffects = ['static', 'roll', 'glitch', 'fade'];
    this.currentEffect = 'static';
  }

  /**
   * Initialize the TV controller
   */
  init() {
    // Get DOM elements
    this.elements.screen = document.getElementById('tvScreen');
    this.elements.screenContent = document.getElementById('screenContent');
    this.elements.screenOff = document.getElementById('screenOff');
    this.elements.channelNumber = document.getElementById('channelNumber');
    this.elements.projectTitle = document.getElementById('projectTitle');
    this.elements.projectDescription = document.getElementById('projectDescription');
    this.elements.projectThumbnail = document.getElementById('projectThumbnail');
    this.elements.projectIcon = document.getElementById('projectIcon');
    this.elements.projectUrl = document.getElementById('projectUrl');
    this.elements.powerIndicator = document.getElementById('powerIndicator');
    this.elements.antennaLeft = document.querySelector('.antenna-left');
    this.elements.antennaRight = document.querySelector('.antenna-right');
    this.elements.previewContainer = document.getElementById('previewContainer');
    this.elements.previewFrame = document.getElementById('previewFrame');
    this.elements.projectDisplay = document.getElementById('projectDisplay');

    // Initialize static effect
    this.staticEffect = new StaticEffect('staticCanvas');

    // Initialize knobs
    this.initKnobs();

    // Bind button events
    this.bindEvents();

    // Start in off state
    this.updateDisplay();
  }

  /**
   * Initialize rotatable knobs
   */
  initKnobs() {
    const totalChannels = window.ProjectData.getTotalChannels();

    // Channel knob - snaps to channel positions
    const channelElement = document.getElementById('channelKnob');
    if (channelElement) {
      // Calculate snap positions for each channel
      const angleRange = 270; // -135 to +135
      const angleStep = angleRange / (totalChannels - 1);
      const snapPositions = [];
      for (let i = 0; i < totalChannels; i++) {
        snapPositions.push(-135 + (i * angleStep));
      }

      this.channelKnob = new KnobControl(channelElement, {
        minValue: 1,
        maxValue: totalChannels,
        step: 1,
        initialValue: 1,
        snap: true,
        snapPositions: snapPositions,
        onChange: (value, oldValue) => {
          if (this.isOn && value !== oldValue) {
            this.setChannel(value);
          }
        }
      });
    }

    // Volume knob - smooth rotation
    const volumeElement = document.getElementById('volumeKnob');
    if (volumeElement) {
      this.volumeKnob = new KnobControl(volumeElement, {
        minValue: 0,
        maxValue: 100,
        step: 5,
        initialValue: 50,
        onChange: (value) => {
          this.volume = value;
          if (window.audioManager) {
            window.audioManager.setVolume(value / 100);
          }
        }
      });
    }
  }

  /**
   * Bind button events
   */
  bindEvents() {
    // Power button
    const powerBtn = document.getElementById('powerButton');
    if (powerBtn) {
      powerBtn.addEventListener('click', () => this.togglePower());
    }

    // Channel up/down buttons
    const channelUp = document.getElementById('channelUp');
    const channelDown = document.getElementById('channelDown');

    if (channelUp) {
      channelUp.addEventListener('click', () => {
        if (this.isOn) this.nextChannel();
      });
    }

    if (channelDown) {
      channelDown.addEventListener('click', () => {
        if (this.isOn) this.prevChannel();
      });
    }

    // Screen click - open project URL or turn on TV
    const openProjectUrl = () => {
      if (this.isOn && !this.isTransitioning) {
        const project = window.ProjectData.getProject(this.currentChannel);
        if (project?.url) {
          window.open(project.url, '_blank');
        }
      }
    };

    if (this.elements.screenContent) {
      this.elements.screenContent.addEventListener('click', openProjectUrl);
    }

    // Also handle click on preview container
    if (this.elements.previewContainer) {
      this.elements.previewContainer.addEventListener('click', openProjectUrl);
      this.elements.previewContainer.style.cursor = 'pointer';
    }

    // Click screen-off area to turn on TV
    if (this.elements.screenOff) {
      this.elements.screenOff.addEventListener('click', () => {
        if (!this.isOn && !this.isTransitioning) {
          this.togglePower();
        }
      });
      this.elements.screenOff.style.cursor = 'pointer';
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Mouse wheel on screen to change channels
    if (this.elements.screen) {
      this.elements.screen.addEventListener('wheel', (e) => {
        if (!this.isOn || this.isTransitioning) return;
        e.preventDefault();
        if (e.deltaY < 0) {
          this.nextChannel();
        } else if (e.deltaY > 0) {
          this.prevChannel();
        }
      }, { passive: false });
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(e) {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePower();
        break;
      case 'ArrowUp':
      case 'w':
        if (this.isOn) {
          e.preventDefault();
          this.nextChannel();
        }
        break;
      case 'ArrowDown':
      case 's':
        if (this.isOn) {
          e.preventDefault();
          this.prevChannel();
        }
        break;
      case 'Enter':
        if (this.isOn) {
          const project = window.ProjectData.getProject(this.currentChannel);
          if (project?.url) {
            window.open(project.url, '_blank');
          }
        }
        break;
    }
  }

  /**
   * Toggle TV power
   */
  async togglePower() {
    if (this.isTransitioning) return;

    // Initialize audio on first interaction
    if (window.audioManager && !window.audioManager.initialized) {
      window.audioManager.init();
    }

    if (this.isOn) {
      await this.powerOff();
    } else {
      await this.powerOn();
    }
  }

  /**
   * Power on the TV
   */
  async powerOn() {
    if (this.isOn || this.isTransitioning) return;
    this.isTransitioning = true;

    // Play power on sound
    if (window.audioManager) {
      window.audioManager.playPowerOn();
    }

    // Update indicator
    this.elements.powerIndicator?.classList.add('on');

    // Animate screen on
    this.elements.screen?.classList.add('powering-on');
    this.elements.screenOff?.classList.add('hidden');

    // Show static during warmup
    this.staticEffect?.start();

    // Wait for warmup
    await this.delay(800);

    // Stop static, show content
    this.staticEffect?.stop();
    this.elements.screen?.classList.remove('powering-on');
    this.elements.screen?.classList.add('on', 'warming-up');

    this.isOn = true;
    this.updateDisplay();

    // Show content with fade
    this.elements.screenContent?.classList.add('visible');

    // Remove warming-up class after animation
    await this.delay(1000);
    this.elements.screen?.classList.remove('warming-up');

    this.isTransitioning = false;
  }

  /**
   * Power on the TV silently (for auto-start, no audio due to browser restrictions)
   */
  async powerOnSilent() {
    if (this.isOn || this.isTransitioning) return;
    this.isTransitioning = true;

    // Update indicator
    this.elements.powerIndicator?.classList.add('on');

    // Animate screen on
    this.elements.screen?.classList.add('powering-on');
    this.elements.screenOff?.classList.add('hidden');

    // Show static during warmup (visual only, no sound)
    if (this.staticEffect) {
      this.staticEffect.isRunning = true;
      this.staticEffect.canvas?.classList.add('active');
      this.staticEffect.lastFrameTime = 0;
      this.staticEffect.animate(0);
    }

    // Wait for warmup
    await this.delay(800);

    // Stop static, show content
    if (this.staticEffect) {
      this.staticEffect.isRunning = false;
      this.staticEffect.canvas?.classList.remove('active');
      if (this.staticEffect.animationId) {
        cancelAnimationFrame(this.staticEffect.animationId);
      }
      if (this.staticEffect.ctx) {
        this.staticEffect.ctx.clearRect(0, 0, this.staticEffect.canvas.width, this.staticEffect.canvas.height);
      }
    }

    this.elements.screen?.classList.remove('powering-on');
    this.elements.screen?.classList.add('on', 'warming-up');

    this.isOn = true;
    this.updateDisplay();

    // Show content with fade
    this.elements.screenContent?.classList.add('visible');

    // Remove warming-up class after animation
    await this.delay(1000);
    this.elements.screen?.classList.remove('warming-up');

    this.isTransitioning = false;
  }

  /**
   * Power off the TV
   */
  async powerOff() {
    if (!this.isOn || this.isTransitioning) return;
    this.isTransitioning = true;

    // Play power off sound
    if (window.audioManager) {
      window.audioManager.playPowerOff();
    }

    // Hide content
    this.elements.screenContent?.classList.remove('visible');

    // Animate power off
    this.elements.screen?.classList.add('powering-off');

    await this.delay(500);

    // Update state
    this.isOn = false;
    this.elements.screen?.classList.remove('on', 'powering-off');
    this.elements.screenOff?.classList.remove('hidden');
    this.elements.powerIndicator?.classList.remove('on');

    this.isTransitioning = false;
  }

  /**
   * Set channel
   */
  async setChannel(channel, effect = null) {
    if (!this.isOn || this.isTransitioning) return;
    if (channel === this.currentChannel) return;

    this.isTransitioning = true;
    const useEffect = effect || this.getRandomEffect();

    // Animate antennas
    this.animateAntennas();

    // Play transition based on effect
    await this.playTransition(useEffect);

    // Update channel
    this.currentChannel = channel;
    this.updateDisplay();

    // Update knob position if changed via buttons
    if (this.channelKnob) {
      this.channelKnob.setValue(channel, false);
    }

    // Show channel number briefly
    this.flashChannelNumber();

    this.isTransitioning = false;
  }

  /**
   * Next channel
   */
  nextChannel() {
    const next = window.ProjectData.getNextChannel(this.currentChannel);
    this.setChannel(next);
  }

  /**
   * Previous channel
   */
  prevChannel() {
    const prev = window.ProjectData.getPrevChannel(this.currentChannel);
    this.setChannel(prev);
  }

  /**
   * Play channel transition effect
   */
  async playTransition(effect) {
    // Add switching class for CSS animations
    this.elements.screen?.classList.add('switching');

    // Show static burst with timeout safety
    try {
      await Promise.race([
        this.staticEffect?.burst(400) || Promise.resolve(),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
    } catch (e) {
      // Ignore errors
    }

    // Remove switching class
    this.elements.screen?.classList.remove('switching');
  }

  /**
   * Get random transition effect
   */
  getRandomEffect() {
    const index = Math.floor(Math.random() * this.transitionEffects.length);
    return this.transitionEffects[index];
  }

  /**
   * Update screen display with current channel
   */
  updateDisplay() {
    const project = window.ProjectData.getProject(this.currentChannel);

    if (!project) return;

    // Update channel number
    if (this.elements.channelNumber) {
      this.elements.channelNumber.textContent = String(project.id).padStart(2, '0');
    }

    // Update project info (for fallback display)
    if (this.elements.projectTitle) {
      this.elements.projectTitle.textContent = project.title;
    }

    if (this.elements.projectDescription) {
      this.elements.projectDescription.textContent = project.description;
    }

    // Update thumbnail/background
    if (this.elements.projectThumbnail) {
      if (project.thumbnail.startsWith('linear-gradient') || project.thumbnail.startsWith('#')) {
        this.elements.projectThumbnail.style.background = project.thumbnail;
        this.elements.projectThumbnail.style.backgroundImage = 'none';
      } else {
        this.elements.projectThumbnail.style.backgroundImage = `url(${project.thumbnail})`;
      }
    }

    // Update project icon
    if (this.elements.projectIcon) {
      this.elements.projectIcon.textContent = project.icon || '';
    }

    // Update project URL display
    if (this.elements.projectUrl) {
      const displayUrl = project.url
        .replace('https://', '')
        .replace('http://', '')
        .replace('www.', '');
      this.elements.projectUrl.textContent = displayUrl;
    }

    // Try to load live preview
    this.loadPreview(project);
  }

  /**
   * Load preview - icon fallback, screenshot, or live proxy
   */
  loadPreview(project) {
    if (!this.elements.previewContainer) return;

    // Reset iframe src to stop any pending loads
    if (this.elements.previewFrame) {
      this.elements.previewFrame.src = 'about:blank';
    }

    // Use icon fallback - hide preview, show default display
    if (project.useIcon) {
      this.elements.previewContainer.classList.remove('active');
      return;
    }

    // Get or create screenshot image element
    let img = this.elements.previewContainer.querySelector('.preview-screenshot');
    if (!img) {
      img = document.createElement('img');
      img.className = 'preview-screenshot';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:top;';
      this.elements.previewContainer.appendChild(img);
    }

    if (project.screenshot) {
      // Use static screenshot
      this.elements.previewFrame.style.display = 'none';
      img.style.display = 'block';
      img.src = project.screenshot;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'top';
      this.elements.previewContainer.classList.add('active');
    } else {
      // Use live proxy
      const PROXY_URL = 'https://tv-proxy.shariflii.workers.dev';
      const proxyUrl = `${PROXY_URL}/?url=${encodeURIComponent(project.url)}`;

      img.style.display = 'none';
      this.elements.previewFrame.style.display = 'block';
      this.elements.previewFrame.src = proxyUrl;
      this.elements.previewContainer.classList.add('active');
    }
  }

  /**
   * Flash channel number on screen
   */
  flashChannelNumber() {
    if (!this.elements.channelNumber) return;

    this.elements.channelNumber.classList.remove('show');
    // Force reflow
    void this.elements.channelNumber.offsetWidth;
    this.elements.channelNumber.classList.add('show');

    // Play click
    if (window.audioManager) {
      window.audioManager.playClick();
    }
  }

  /**
   * Animate antennas on channel change
   */
  animateAntennas() {
    this.elements.antennaLeft?.classList.add('receiving');
    this.elements.antennaRight?.classList.add('receiving');

    setTimeout(() => {
      this.elements.antennaLeft?.classList.remove('receiving');
      this.elements.antennaRight?.classList.remove('receiving');
    }, 500);
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export globally
window.TVController = TVController;
