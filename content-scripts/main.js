/**
 * TFT Chrome Extension - Main Content Script
 * Entry point that coordinates video detection and overlay management
 */

/**
 * Main extension controller class
 */
class TftExtension {
  constructor() {
    this.videoDetector = new VideoDetector();
    this.overlayManager = new OverlayManager();
    this.isActive = false;
    this.cleanupTasks = [];
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
   * Clean up extension resources
   */
  cleanup() {
    if (!this.isActive) return;
    
    logger.info('Cleaning up TFT Extension...');
    
    try {
      // Stop video detection
      this.videoDetector.stopMonitoring();
      
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
      isTftStream: this.videoDetector.isTftStream()
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
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async response
}); 