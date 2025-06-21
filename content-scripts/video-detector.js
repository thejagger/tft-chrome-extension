/**
 * Video Detection Utility
 * Handles finding and validating Twitch video elements
 */

/**
 * Video detector class for managing Twitch video element detection
 */
class VideoDetector {
  constructor() {
    this.currentVideo = null;
    this.retryCount = 0;
    this.isMonitoring = false;
    this.lastTftStatus = false;
    this.lastStreamTitle = '';
    this.tftCheckInterval = null;
  }

  /**
   * Find the main video element on Twitch
   * @returns {HTMLVideoElement|null} Video element or null if not found
   */
  findVideoElement() {
    try {
      logger.debug('Searching for video element with multiple selectors...');
      
      // Try multiple selectors
      for (const selector of CONFIG.TWITCH.VIDEO_SELECTORS) {
        const videoElement = document.querySelector(selector);
        logger.debug('Trying selector', { selector, found: !!videoElement });
        
        if (videoElement && videoElement instanceof HTMLVideoElement) {
          logger.debug('Video element found', { 
            selector, 
            tagName: videoElement.tagName,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            readyState: videoElement.readyState
          });
          
          // Found a video element, now validate it
          if (this.isVideoValid(videoElement)) {
            return videoElement;
          } else {
            logger.debug('Video element found but not valid yet', { selector });
          }
        }
      }
      
      // Log all video elements on page for debugging
      const allVideos = document.querySelectorAll('video');
      logger.debug('All video elements found on page', { 
        count: allVideos.length,
        videos: Array.from(allVideos).map(v => ({
          tagName: v.tagName,
          className: v.className,
          id: v.id,
          datAttributes: Object.fromEntries(
            Array.from(v.attributes)
              .filter(attr => attr.name.startsWith('data-'))
              .map(attr => [attr.name, attr.value])
          ),
          videoWidth: v.videoWidth,
          videoHeight: v.videoHeight,
          readyState: v.readyState
        }))
      });
      
      return null;
    } catch (error) {
      logger.error('Error finding video element', error);
      return null;
    }
  }

  /**
   * Validate video element meets minimum requirements
   * @param {HTMLVideoElement} video - Video element to validate
   * @returns {boolean} Whether video is valid for processing
   */
  isVideoValid(video) {
    if (!video || !(video instanceof HTMLVideoElement)) {
      logger.debug('Video validation failed: not a video element');
      return false;
    }

    // Check video dimensions (allow zero initially as video might be loading)
    const hasValidDimensions = 
      video.videoWidth >= CONFIG.VIDEO.MIN_WIDTH &&
      video.videoHeight >= CONFIG.VIDEO.MIN_HEIGHT;

    // Check if video is loaded and playable (be more lenient for initial detection)
    const isPlayable = video.readyState >= HTMLMediaElement.HAVE_METADATA;

    logger.debug('Video validation', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      hasValidDimensions,
      isPlayable,
      minWidth: CONFIG.VIDEO.MIN_WIDTH,
      minHeight: CONFIG.VIDEO.MIN_HEIGHT
    });

    // For initial detection, just check if it's a video element and has some metadata
    // We'll be more strict later when actually processing frames
    return video.readyState >= HTMLMediaElement.HAVE_METADATA;
  }

  /**
   * Check if current page is a TFT stream
   * @returns {boolean} Whether this appears to be a TFT stream
   */
  isTftStream() {
    try {
      // Check stream title
      const titleElement = document.querySelector(CONFIG.TWITCH.STREAM_TITLE_SELECTOR);
      const title = titleElement?.textContent?.toLowerCase() || '';
      
      // Check if title contains TFT keywords
      const hasTftKeywords = CONFIG.TWITCH.TFT_KEYWORDS.some(keyword => 
        title.includes(keyword)
      );

      logger.debug('Checking if TFT stream', {
        title: title,
        hasTftKeywords: hasTftKeywords
      });

      return hasTftKeywords;
    } catch (error) {
      logger.error('Error checking TFT stream status', error);
      return false;
    }
  }

  /**
   * Start monitoring for video element changes
   * @param {Function} callback - Callback when video state changes
   */
  startMonitoring(callback) {
    if (this.isMonitoring) {
      logger.warn('Video monitoring already active');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting video monitoring');

    // Initial video detection
    this.detectVideo(callback);

    // Set up periodic checks for video changes
    this.monitoringInterval = setInterval(() => {
      this.detectVideo(callback);
    }, CONFIG.VIDEO.FRAME_CHECK_INTERVAL);

    // Set up DOM observer for dynamic content changes
    this.setupDomObserver(callback);

    // Start periodic TFT stream checking
    this.startTftMonitoring(callback);
  }

  /**
   * Stop video monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    logger.info('Stopping video monitoring');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    if (this.tftCheckInterval) {
      clearInterval(this.tftCheckInterval);
      this.tftCheckInterval = null;
    }

    this.currentVideo = null;
  }

  /**
   * Detect video and notify callback of changes
   * @param {Function} callback - Callback function
   */
  detectVideo(callback) {
    const video = this.findVideoElement();
    
    // Check if video changed
    if (video !== this.currentVideo) {
      this.currentVideo = video;
      this.retryCount = 0;
      
      if (callback && typeof callback === 'function') {
        callback(video);
      }
    } else if (!video && this.retryCount < CONFIG.PERFORMANCE.MAX_RETRY_ATTEMPTS) {
      // Retry finding video
      this.retryCount++;
      logger.debug('Retrying video detection', { 
        attempt: this.retryCount 
      });
    }
  }

  /**
   * Set up DOM observer to watch for video element changes
   * @param {Function} callback - Callback function
   */
  setupDomObserver(callback) {
    this.domObserver = new MutationObserver((mutations) => {
      // Check if any mutations affected video elements
      const hasVideoChanges = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
          return node.nodeType === Node.ELEMENT_NODE &&
                 (node.tagName === 'VIDEO' || node.querySelector('video'));
        });
      });

      if (hasVideoChanges) {
        logger.debug('DOM changes detected, checking video');
        this.detectVideo(callback);
      }
    });

    // Start observing
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Start periodic TFT stream monitoring
   * @param {Function} callback - Callback function for status changes
   */
  startTftMonitoring(callback) {
    logger.info('Starting periodic TFT stream monitoring');
    
    this.tftCheckInterval = setInterval(() => {
      this.checkTftStreamStatus(callback);
    }, CONFIG.STREAM_MONITORING.TFT_CHECK_INTERVAL);
  }

  /**
   * Check TFT stream status and notify if changed
   * @param {Function} callback - Callback function
   */
  checkTftStreamStatus(callback) {
    try {
      const currentTftStatus = this.isTftStream();
      const currentTitle = this.getCurrentStreamTitle();
      
      // Check if TFT status changed
      if (currentTftStatus !== this.lastTftStatus) {
        logger.info('TFT stream status changed', {
          was: this.lastTftStatus,
          now: currentTftStatus,
          title: currentTitle
        });
        
        this.lastTftStatus = currentTftStatus;
        
        // Notify the callback about the status change
        if (callback && typeof callback === 'function') {
          callback(this.currentVideo, { tftStatusChanged: true, isTft: currentTftStatus });
        }
      }
      
      // Check if stream title changed (might indicate ad ended)
      if (currentTitle !== this.lastStreamTitle) {
        logger.debug('Stream title changed', {
          was: this.lastStreamTitle,
          now: currentTitle
        });
        
        this.lastStreamTitle = currentTitle;
      }
      
    } catch (error) {
      logger.error('Error checking TFT stream status', error);
    }
  }

  /**
   * Get current stream title
   * @returns {string} Current stream title
   */
  getCurrentStreamTitle() {
    try {
      const titleElement = document.querySelector(CONFIG.TWITCH.STREAM_TITLE_SELECTOR);
      return titleElement?.textContent?.trim() || '';
    } catch (error) {
      logger.error('Error getting stream title', error);
      return '';
    }
  }

  /**
   * Get current video element
   * @returns {HTMLVideoElement|null} Current video element
   */
  getCurrentVideo() {
    return this.currentVideo;
  }
} 