/* ============================================
   RETRO TV PORTFOLIO - Knob Control
   Drag-to-rotate knob interactions
   ============================================ */

/**
 * KnobControl Class
 * Handles rotatable knob interactions with mouse/touch
 */
class KnobControl {
  constructor(element, options = {}) {
    this.element = element;
    if (!this.element) {
      console.error('Knob element not found');
      return;
    }

    // Configuration
    this.options = {
      minValue: options.minValue ?? 0,
      maxValue: options.maxValue ?? 100,
      step: options.step ?? 1,
      minAngle: options.minAngle ?? -135,
      maxAngle: options.maxAngle ?? 135,
      snap: options.snap ?? false,        // Snap to steps
      snapPositions: options.snapPositions ?? null, // Array of snap angles
      onChange: options.onChange ?? (() => {}),
      onRelease: options.onRelease ?? (() => {})
    };

    // State
    this.value = options.initialValue ?? this.options.minValue;
    this.currentAngle = this.valueToAngle(this.value);
    this.isDragging = false;
    this.startAngle = 0;
    this.startValue = 0;

    // Bind methods
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    // Initialize
    this.init();
  }

  /**
   * Initialize event listeners
   */
  init() {
    // Mouse events
    this.element.addEventListener('mousedown', this.onMouseDown);

    // Touch events
    this.element.addEventListener('touchstart', this.onTouchStart, { passive: false });

    // Set initial rotation
    this.updateRotation();

    // Make focusable for accessibility
    this.element.setAttribute('tabindex', '0');
    this.element.setAttribute('role', 'slider');
    this.element.setAttribute('aria-valuemin', this.options.minValue);
    this.element.setAttribute('aria-valuemax', this.options.maxValue);
    this.element.setAttribute('aria-valuenow', this.value);

    // Keyboard controls
    this.element.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  /**
   * Convert value to angle
   */
  valueToAngle(value) {
    const range = this.options.maxValue - this.options.minValue;
    const angleRange = this.options.maxAngle - this.options.minAngle;
    const normalized = (value - this.options.minValue) / range;
    return this.options.minAngle + (normalized * angleRange);
  }

  /**
   * Convert angle to value
   */
  angleToValue(angle) {
    const angleRange = this.options.maxAngle - this.options.minAngle;
    const range = this.options.maxValue - this.options.minValue;
    const normalized = (angle - this.options.minAngle) / angleRange;
    let value = this.options.minValue + (normalized * range);

    // Apply step
    if (this.options.step > 0) {
      value = Math.round(value / this.options.step) * this.options.step;
    }

    return Math.max(this.options.minValue, Math.min(this.options.maxValue, value));
  }

  /**
   * Calculate angle from center of element to point
   */
  getAngleFromCenter(clientX, clientY) {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // Calculate angle in degrees (0 = top, clockwise positive)
    let angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);

    return angle;
  }

  /**
   * Update visual rotation
   */
  updateRotation() {
    this.element.style.transform = `rotate(${this.currentAngle}deg)`;
    this.element.setAttribute('aria-valuenow', this.value);
  }

  /**
   * Set value programmatically
   */
  setValue(value, triggerCallback = true) {
    const oldValue = this.value;
    this.value = Math.max(this.options.minValue, Math.min(this.options.maxValue, value));
    this.currentAngle = this.valueToAngle(this.value);
    this.updateRotation();

    if (triggerCallback && oldValue !== this.value) {
      this.options.onChange(this.value, oldValue);
    }
  }

  /**
   * Get current value
   */
  getValue() {
    return this.value;
  }

  // ======= MOUSE EVENTS =======

  onMouseDown(e) {
    e.preventDefault();
    this.startDrag(e.clientX, e.clientY);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    this.updateDrag(e.clientX, e.clientY);
  }

  onMouseUp(e) {
    this.endDrag();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  // ======= TOUCH EVENTS =======

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.startDrag(touch.clientX, touch.clientY);

    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
  }

  onTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.updateDrag(touch.clientX, touch.clientY);
  }

  onTouchEnd(e) {
    this.endDrag();
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }

  // ======= DRAG LOGIC =======

  startDrag(clientX, clientY) {
    this.isDragging = true;
    this.element.classList.add('dragging');
    this.startAngle = this.getAngleFromCenter(clientX, clientY);
    this.startValue = this.value;

    // Play click sound
    if (window.audioManager) {
      window.audioManager.playClick();
    }
  }

  updateDrag(clientX, clientY) {
    const currentPointerAngle = this.getAngleFromCenter(clientX, clientY);
    let deltaAngle = currentPointerAngle - this.startAngle;

    // Handle wrap-around at 180/-180
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    // Calculate new angle
    let newAngle = this.valueToAngle(this.startValue) + deltaAngle;

    // Clamp to limits
    newAngle = Math.max(this.options.minAngle, Math.min(this.options.maxAngle, newAngle));

    // Snap to positions if defined
    if (this.options.snapPositions) {
      newAngle = this.snapToNearest(newAngle, this.options.snapPositions);
    }

    // Update state
    const oldValue = this.value;
    this.currentAngle = newAngle;
    this.value = this.angleToValue(newAngle);
    this.updateRotation();

    // Trigger callback if value changed
    if (oldValue !== this.value) {
      this.options.onChange(this.value, oldValue);

      // Click feedback for stepped changes
      if (this.options.snap && window.audioManager) {
        window.audioManager.playClick();
      }
    }
  }

  endDrag() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.element.classList.remove('dragging');

    // Snap to nearest step if enabled
    if (this.options.snap) {
      this.setValue(this.value);
    }

    this.options.onRelease(this.value);
  }

  /**
   * Snap angle to nearest position in array
   */
  snapToNearest(angle, positions) {
    let nearest = positions[0];
    let minDiff = Math.abs(angle - nearest);

    for (const pos of positions) {
      const diff = Math.abs(angle - pos);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = pos;
      }
    }

    return nearest;
  }

  // ======= KEYBOARD CONTROL =======

  onKeyDown(e) {
    let delta = 0;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        delta = this.options.step;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        delta = -this.options.step;
        break;
      case 'Home':
        this.setValue(this.options.minValue);
        return;
      case 'End':
        this.setValue(this.options.maxValue);
        return;
      default:
        return;
    }

    e.preventDefault();
    this.setValue(this.value + delta);

    if (window.audioManager) {
      window.audioManager.playClick();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.element.removeEventListener('mousedown', this.onMouseDown);
    this.element.removeEventListener('touchstart', this.onTouchStart);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }
}

// Export globally
window.KnobControl = KnobControl;
