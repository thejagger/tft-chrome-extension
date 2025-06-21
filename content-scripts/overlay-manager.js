/**
 * Overlay Manager
 * Handles creating, positioning, and managing UI overlays on Twitch video
 */

/**
 * Overlay manager class for handling video overlay UI
 */
class OverlayManager {
  constructor() {
    this.overlayContainer = null;
    this.videoElement = null;
    this.isVisible = false;
    this.repositionDebounced = this.debounce(
      this.repositionOverlay.bind(this), 
      CONFIG.PERFORMANCE.DEBOUNCE_DELAY
    );
  }

  /**
   * Initialize overlay system with video element
   * @param {HTMLVideoElement} videoElement - Video element to overlay
   */
  initialize(videoElement) {
    if (!videoElement) {
      logger.error('Cannot initialize overlay without video element');
      return false;
    }

    this.videoElement = videoElement;
    
    try {
      this.createOverlayContainer();
      this.setupEventListeners();
      this.positionOverlay();
      
      logger.info('Overlay manager initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize overlay manager', error);
      return false;
    }
  }

  /**
   * Create the main overlay container element
   */
  createOverlayContainer() {
    // Remove existing overlay if present
    this.cleanup();

    // Create overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = CONFIG.OVERLAY.CONTAINER_ID;
    this.overlayContainer.className = 'tft-overlay-container';
    
    // Apply base styles
    Object.assign(this.overlayContainer.style, {
      position: 'absolute',
      zIndex: CONFIG.OVERLAY.Z_INDEX,
      pointerEvents: 'none', // Allow clicks to pass through
      opacity: '0',
      transition: `opacity ${CONFIG.OVERLAY.FADE_DURATION}ms ease-in-out`,
      maxWidth: `${CONFIG.OVERLAY.MAX_WIDTH}px`,
      borderRadius: CONFIG.OVERLAY.BORDER_RADIUS,
      backgroundColor: CONFIG.OVERLAY.BACKGROUND_COLOR,
      display: 'none'
    });

    // Insert overlay into DOM relative to video
    const videoContainer = this.findVideoContainer();
    if (videoContainer) {
      videoContainer.appendChild(this.overlayContainer);
      logger.debug('Overlay container created and positioned');
    } else {
      logger.error('Could not find video container for overlay placement');
    }
  }

  /**
   * Find the appropriate container for overlay placement
   * @returns {HTMLElement|null} Container element
   */
  findVideoContainer() {
    // Try to find the video player container
    const containers = [
      '[data-a-target="video-player"]',
      '.video-player',
      '.player-video'
    ];

    for (const selector of containers) {
      const container = document.querySelector(selector);
      if (container) {
        // Ensure container has relative positioning for absolute overlay
        const computedStyle = getComputedStyle(container);
        if (computedStyle.position === 'static') {
          container.style.position = 'relative';
        }
        return container;
      }
    }

    // Fallback to video element's parent
    return this.videoElement?.parentElement || document.body;
  }

  /**
   * Position overlay relative to video element
   */
  positionOverlay() {
    if (!this.overlayContainer || !this.videoElement) {
      return;
    }

    try {
      const videoRect = this.videoElement.getBoundingClientRect();
      const containerRect = this.overlayContainer.parentElement.getBoundingClientRect();
      
      // Calculate position relative to container
      const left = videoRect.left - containerRect.left + CONFIG.OVERLAY.POSITION_OFFSET.x;
      const top = videoRect.top - containerRect.top + CONFIG.OVERLAY.POSITION_OFFSET.y;

      Object.assign(this.overlayContainer.style, {
        left: `${left}px`,
        top: `${top}px`
      });

      logger.debug('Overlay positioned', { left, top });
    } catch (error) {
      logger.error('Error positioning overlay', error);
    }
  }

  /**
   * Reposition overlay (debounced version)
   */
  repositionOverlay() {
    this.positionOverlay();
  }

  /**
   * Set up event listeners for overlay management
   */
  setupEventListeners() {
    // Reposition overlay on window resize
    window.addEventListener('resize', this.repositionDebounced);
    
    // Reposition on scroll
    window.addEventListener('scroll', this.repositionDebounced);
    
    // Monitor video element size changes
    if (this.videoElement) {
      const resizeObserver = new ResizeObserver(() => {
        this.repositionDebounced();
      });
      resizeObserver.observe(this.videoElement);
      this.resizeObserver = resizeObserver;
    }
  }

  /**
   * Show overlay with fade-in animation
   */
  show() {
    if (!this.overlayContainer || this.isVisible) {
      return;
    }

    this.overlayContainer.style.display = 'block';
    
    // Trigger reflow before opacity change for smooth transition
    this.overlayContainer.offsetHeight;
    
    this.overlayContainer.style.opacity = '1';
    this.isVisible = true;
    
    logger.debug('Overlay shown');
  }

  /**
   * Hide overlay with fade-out animation
   */
  hide() {
    if (!this.overlayContainer || !this.isVisible) {
      return;
    }

    this.overlayContainer.style.opacity = '0';
    
    // Hide element after transition
    setTimeout(() => {
      if (this.overlayContainer) {
        this.overlayContainer.style.display = 'none';
      }
    }, CONFIG.OVERLAY.FADE_DURATION);
    
    this.isVisible = false;
    logger.debug('Overlay hidden');
  }

  /**
   * Update overlay content
   * @param {string} content - HTML content to display
   */
  updateContent(content) {
    if (!this.overlayContainer) {
      logger.warn('Cannot update content - overlay not initialized');
      return;
    }

    this.overlayContainer.innerHTML = content;
    logger.debug('Overlay content updated');
  }

  /**
   * Create test overlay content for verification
   */
  showTestOverlay() {
    const testContent = `
      <div style="padding: 12px; color: white; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #00ff00;">TFT Extension Active</h3>
        <p style="margin: 0; font-size: 14px;">Video detected successfully!</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">
          Video: ${this.videoElement?.videoWidth}x${this.videoElement?.videoHeight}
        </p>
      </div>
    `;
    
    this.updateContent(testContent);
    this.show();
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Clean up overlay and event listeners
   */
  cleanup() {
    // Remove event listeners
    window.removeEventListener('resize', this.repositionDebounced);
    window.removeEventListener('scroll', this.repositionDebounced);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove overlay element
    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = null;
    }

    this.isVisible = false;
    logger.debug('Overlay cleanup completed');
  }

  /**
   * Debounce utility function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get overlay visibility status
   * @returns {boolean} Whether overlay is visible
   */
  isOverlayVisible() {
    return this.isVisible;
  }

  /**
   * Get overlay container element
   * @returns {HTMLElement|null} Overlay container
   */
  getOverlayContainer() {
    return this.overlayContainer;
  }
} 