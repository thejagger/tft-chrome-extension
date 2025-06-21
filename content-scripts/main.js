/**
 * TFT Chrome Extension - Main Content Script
 * Entry point that coordinates video detection and overlay management
 */

// Debug: Log that main.js is loading
console.log('[DEBUG] main.js file loaded, SimpleCvProcessor available:', typeof SimpleCvProcessor);

/**
 * Main extension controller class
 */
class TftExtension {
  constructor() {
    this.videoDetector = new VideoDetector();
    this.overlayManager = new OverlayManager();
    
    // Debug: Check if SimpleCvProcessor class exists
    logger.debug('SimpleCvProcessor class available:', typeof SimpleCvProcessor);
    
    this.cvProcessor = new SimpleCvProcessor(); // Using simple CV to avoid OpenCV CSP issues
    
    // Debug: Check cvProcessor object
    logger.debug('cvProcessor created:', {
      type: typeof this.cvProcessor,
      constructor: this.cvProcessor.constructor.name,
      hasIsReady: typeof this.cvProcessor.isReady,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.cvProcessor))
    });
    
    this.templateMatcher = new TemplateMatcher(this.cvProcessor);
    this.isActive = false;
    this.cleanupTasks = [];
    this.cvProcessingInterval = null;
    this.detectedElements = [];
  }

  /**
   * Initialize the extension
   */
  async initialize() {
    try {
      logger.info('TFT Chrome Extension starting...');
      
      // Check if we're on a supported page
      if (!this.isValidPage()) {
        logger.info('Not on a supported Twitch page, extension inactive');
        return;
      }

      // Wait for page to be fully loaded
      if (document.readyState === 'loading') {
        await this.waitForDomReady();
      }

      // Start video detection
      this.startVideoDetection();
      
      // Set up cleanup on page unload
      this.setupCleanup();
      
      this.isActive = true;
      logger.info('TFT Extension initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize TFT Extension', error);
    }
  }

  /**
   * Check if current page supports the extension
   * @returns {boolean} Whether page is supported
   */
  isValidPage() {
    const url = window.location.href;
    const isTwitchPage = url.includes('twitch.tv');
    const isVideoPage = url.includes('/videos/') || document.querySelector('video');
    
    logger.debug('Page validation', {
      url: url,
      isTwitchPage: isTwitchPage,
      isVideoPage: isVideoPage
    });

    return isTwitchPage && isVideoPage;
  }

  /**
   * Wait for DOM to be ready
   * @returns {Promise} Promise that resolves when DOM is ready
   */
  waitForDomReady() {
    return new Promise((resolve) => {
      if (document.readyState !== 'loading') {
        resolve();
        return;
      }

      const handler = () => {
        document.removeEventListener('DOMContentLoaded', handler);
        resolve();
      };

      document.addEventListener('DOMContentLoaded', handler);
    });
  }

  /**
   * Start video detection process
   */
  startVideoDetection() {
    logger.info('Starting video detection...');
    
    // Start monitoring for video elements
    this.videoDetector.startMonitoring((videoElement) => {
      this.handleVideoChange(videoElement);
    });
  }

  /**
   * Handle video element changes
   * @param {HTMLVideoElement|null} videoElement - New video element
   * @param {object} options - Additional options
   */
  handleVideoChange(videoElement, options = {}) {
    if (videoElement) {
      // Only setup overlay if it's a new video element
      if (!options.tftStatusChanged) {
        logger.info('Video element detected, setting up overlay');
        this.setupOverlay(videoElement);
      }
      
      // Check TFT status (could be initial check or periodic update)
      const isTftStream = this.videoDetector.isTftStream();
      
      if (isTftStream) {
        if (options.tftStatusChanged) {
          logger.info('TFT stream detected after status change (ad likely ended)');
        } else {
          logger.info('TFT stream detected');
        }
        this.overlayManager.showTestOverlay();
      } else {
        if (options.tftStatusChanged) {
          logger.info('Non-TFT stream detected after status change');
        } else {
          logger.info('Non-TFT stream detected, overlay ready but hidden');
        }
        this.overlayManager.hide();
      }
    } else {
      logger.info('Video element lost, cleaning up overlay');
      this.overlayManager.cleanup();
    }
  }

  /**
   * Set up overlay for video element
   * @param {HTMLVideoElement} videoElement - Video element
   */
  setupOverlay(videoElement) {
    try {
      const success = this.overlayManager.initialize(videoElement);
      
      if (success) {
        logger.info('Overlay initialized successfully');
        
        // Test frame extraction capability
        this.testFrameExtraction(videoElement);
        
        // Start computer vision processing
        this.startCvProcessing(videoElement);
      } else {
        logger.error('Failed to initialize overlay');
      }
    } catch (error) {
      logger.error('Error setting up overlay', error);
    }
  }

  /**
   * Test video frame extraction capability
   * @param {HTMLVideoElement} videoElement - Video element to test
   */
  testFrameExtraction(videoElement) {
    try {
      // Create canvas for frame extraction
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0);
      
      // Get frame data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      logger.info('Frame extraction test successful', {
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        frameDataLength: imageData.data.length
      });
      
      // Clean up test canvas
      canvas.remove();
      
    } catch (error) {
      logger.error('Frame extraction test failed', error);
    }
  }

  /**
   * Set up cleanup handlers
   */
  setupCleanup() {
    // Clean up on page unload
    const cleanup = () => {
      this.cleanup();
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Store cleanup task
    this.cleanupTasks.push(() => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('unload', cleanup);
    });
  }

  /**
   * Start computer vision processing
   * @param {HTMLVideoElement} videoElement - Video element to process
   */
  startCvProcessing(videoElement) {
    if (!this.cvProcessor.isReady()) {
      logger.info('OpenCV not ready yet, will start CV processing when available');
      
      // Check periodically for OpenCV readiness
      const checkReadiness = setInterval(() => {
        if (this.cvProcessor.isReady()) {
          clearInterval(checkReadiness);
          this.startCvProcessing(videoElement);
        }
      }, 1000);
      
      return;
    }

    logger.info('Starting computer vision processing...');
    
    // Start periodic CV processing
    this.cvProcessingInterval = setInterval(async () => {
      await this.processVideoFrame(videoElement);
    }, CONFIG.CV.PROCESSING_INTERVAL);
  }

  /**
   * Process a single video frame for TFT elements
   * @param {HTMLVideoElement} videoElement - Video element
   */
  async processVideoFrame(videoElement) {
    try {
      if (!videoElement || !this.cvProcessor.isReady()) {
        return;
      }

      logger.debug('Processing video frame for TFT elements...');
      
      // Process frame
      const results = await this.cvProcessor.processFrame(videoElement);
      
      if (results.elements.length > 0) {
        this.detectedElements = results.elements;
        logger.info('TFT elements detected', {
          count: results.elements.length,
          processingTime: Math.round(results.processingTime),
          elements: results.elements.map(e => ({ type: e.type, confidence: e.confidence }))
        });
        
        // Update overlay with detected elements
        this.updateOverlayWithElements(results.elements);
      } else {
        logger.debug('No TFT elements detected in frame');
      }
      
    } catch (error) {
      logger.error('Error processing video frame', error);
    }
  }

  /**
   * Update overlay with detected TFT elements
   * @param {Array} elements - Detected elements
   */
  updateOverlayWithElements(elements) {
    if (!this.overlayManager || elements.length === 0) {
      return;
    }

    // Create overlay content showing detected elements
    const elementSummary = elements.reduce((acc, element) => {
      acc[element.type] = (acc[element.type] || 0) + 1;
      return acc;
    }, {});

    const overlayContent = `
      <div style="padding: 12px; color: white; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #00ff00;">TFT Elements Detected</h3>
        ${Object.entries(elementSummary).map(([type, count]) => 
          `<p style="margin: 2px 0; font-size: 13px;">${type}: ${count}</p>`
        ).join('')}
        <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.8;">
          Total: ${elements.length} elements
        </p>
        ${CONFIG.CV.ENABLE_VISUALIZATION ? 
          '<p style="font-size: 10px; color: #ffa500;">Visualization enabled</p>' : ''
        }
      </div>
    `;

    this.overlayManager.updateContent(overlayContent);
    this.overlayManager.show();

    // Hide overlay after 3 seconds to avoid cluttering
    setTimeout(() => {
      if (this.overlayManager) {
        this.overlayManager.hide();
      }
    }, 3000);
  }

  /**
   * Stop computer vision processing
   */
  stopCvProcessing() {
    if (this.cvProcessingInterval) {
      clearInterval(this.cvProcessingInterval);
      this.cvProcessingInterval = null;
      logger.info('Computer vision processing stopped');
    }
  }

  /**
   * Clean up extension resources
   */
  cleanup() {
    if (!this.isActive) return;
    
    logger.info('Cleaning up TFT Extension...');
    
    try {
      // Stop video detection
      this.videoDetector.stopMonitoring();
      
      // Stop CV processing
      this.stopCvProcessing();
      
      // Clean up CV processor
      this.cvProcessor.cleanup();
      
      // Clean up overlay
      this.overlayManager.cleanup();
      
      // Run all cleanup tasks
      this.cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          logger.error('Error in cleanup task', error);
        }
      });
      
      this.cleanupTasks = [];
      this.isActive = false;
      
      logger.info('TFT Extension cleanup completed');
    } catch (error) {
      logger.error('Error during extension cleanup', error);
    }
  }

  /**
   * Get extension status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      isActive: this.isActive,
      hasVideo: !!this.videoDetector.getCurrentVideo(),
      isOverlayVisible: this.overlayManager.isOverlayVisible(),
      isTftStream: this.videoDetector.isTftStream(),
      cvReady: this.cvProcessor.isReady(),
      cvStats: this.cvProcessor.getStats(),
      detectedElements: this.detectedElements.length,
      lastDetection: this.detectedElements.length > 0 ? 
        this.detectedElements.map(e => e.type).join(', ') : 'None'
    };
  }
}

// Initialize extension when script loads
const tftExtension = new TftExtension();

// Start extension
tftExtension.initialize();

// Expose to global scope for debugging
window.tftExtension = tftExtension;

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getStatus':
      const status = tftExtension.getStatus();
      const video = tftExtension.videoDetector.getCurrentVideo();
      
      sendResponse({
        ...status,
        videoInfo: video ? {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration
        } : null
      });
      break;
      
    case 'testOverlay':
      if (tftExtension.overlayManager) {
        tftExtension.overlayManager.showTestOverlay();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Overlay not initialized' });
      }
      break;
      
    case 'testCvProcessing':
      if (tftExtension.cvProcessor.isReady()) {
        const video = tftExtension.videoDetector.getCurrentVideo();
        if (video) {
          tftExtension.processVideoFrame(video);
          sendResponse({ success: true, message: 'CV processing triggered' });
        } else {
          sendResponse({ success: false, error: 'No video available' });
        }
      } else {
        sendResponse({ success: false, error: 'OpenCV not ready' });
      }
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async response
}); 