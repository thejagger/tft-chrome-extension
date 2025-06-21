/**
 * Computer Vision Processor
 * Handles OpenCV.js operations for TFT element detection
 */

/**
 * CV Processor class for TFT element recognition
 */
class CvProcessor {
  constructor() {
    this.isOpencvReady = false;
    this.processingQueue = [];
    this.isProcessing = false;
    this.templates = new Map();
    this.lastProcessTime = 0;
    
    this.initializeOpenCV();
  }

  /**
   * Initialize OpenCV.js
   */
  async initializeOpenCV() {
    try {
      logger.info('Initializing OpenCV.js...');
      
      // Wait for OpenCV to be ready
      await this.waitForOpenCV();
      
      this.isOpencvReady = true;
      logger.info('OpenCV.js initialized successfully', {
        version: cv.getBuildInformation ? cv.getBuildInformation() : 'Unknown'
      });
      
      // Load TFT templates
      await this.loadTemplates();
      
    } catch (error) {
      logger.error('Failed to initialize OpenCV.js', error);
      this.isOpencvReady = false;
    }
  }

  /**
   * Wait for OpenCV to be loaded
   * @returns {Promise} Promise that resolves when OpenCV is ready
   */
  waitForOpenCV() {
    return new Promise((resolve, reject) => {
      logger.debug('Checking for OpenCV availability...');
      
      if (typeof cv !== 'undefined' && cv.Mat) {
        logger.debug('OpenCV already available');
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 100; // 10 seconds total (100ms * 100)
      
      // Check periodically for OpenCV
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof cv !== 'undefined') {
          logger.debug('OpenCV object found, checking for Mat...', { 
            hasMat: !!cv.Mat,
            attempt: attempts 
          });
          
          if (cv.Mat) {
            clearInterval(checkInterval);
            logger.debug('OpenCV fully loaded', { attempts, timeSeconds: attempts * 0.1 });
            resolve();
            return;
          }
        }
        
        if (attempts % 50 === 0) { // Log every 5 seconds
          logger.debug('Still waiting for OpenCV...', { 
            attempts, 
            timeSeconds: attempts * 0.1,
            cvExists: typeof cv !== 'undefined'
          });
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          logger.error('OpenCV load timeout reached', { 
            attempts, 
            timeSeconds: attempts * 0.1,
            cvExists: typeof cv !== 'undefined',
            cvMat: typeof cv !== 'undefined' ? !!cv.Mat : 'N/A'
          });
          reject(new Error(`OpenCV.js failed to load within ${maxAttempts * 0.1} seconds`));
        }
      }, 100);
    });
  }

  /**
   * Load TFT template images for matching
   */
  async loadTemplates() {
    try {
      logger.info('Loading TFT templates...');
      
      // For now, we'll start with basic template placeholders
      // In a full implementation, these would be actual TFT images
      const templateConfigs = [
        { name: 'augment_slot', path: 'templates/augment-slot.png' },
        { name: 'champion_1_cost', path: 'templates/champion-1-cost.png' },
        { name: 'champion_2_cost', path: 'templates/champion-2-cost.png' },
        { name: 'champion_3_cost', path: 'templates/champion-3-cost.png' },
        { name: 'gold_indicator', path: 'templates/gold-indicator.png' },
        { name: 'shop_area', path: 'templates/shop-area.png' }
      ];

      // Load each template
      for (const config of templateConfigs) {
        try {
          const template = await this.loadTemplate(config.name, config.path);
          if (template) {
            this.templates.set(config.name, template);
            logger.debug('Template loaded', { name: config.name });
          }
        } catch (error) {
          logger.warn('Failed to load template', { 
            name: config.name, 
            error: error.message 
          });
        }
      }

      logger.info('Template loading completed', { 
        loaded: this.templates.size,
        total: templateConfigs.length 
      });
      
    } catch (error) {
      logger.error('Error loading templates', error);
    }
  }

  /**
   * Load a single template image
   * @param {string} name - Template name
   * @param {string} path - Template image path
   * @returns {Promise<cv.Mat|null>} Template matrix or null
   */
  async loadTemplate(name, path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const mat = cv.matFromImageData(imageData);
          
          canvas.remove();
          resolve(mat);
        } catch (error) {
          logger.error('Error processing template image', { name, error });
          resolve(null);
        }
      };
      
      img.onerror = () => {
        logger.warn('Template image not found', { name, path });
        resolve(null);
      };
      
      // For now, resolve with null since we don't have actual template files
      // In production, this would load from chrome-extension:// URLs
      resolve(null);
    });
  }

  /**
   * Process video frame for TFT elements
   * @param {HTMLVideoElement} videoElement - Video element to process
   * @returns {Promise<object>} Processing results
   */
  async processFrame(videoElement) {
    // Check if OpenCV is ready
    if (!this.isOpencvReady) {
      logger.debug('OpenCV not ready, skipping frame processing');
      return { elements: [], processingTime: 0 };
    }

    if (this.isProcessing) {
      logger.debug('Frame processing already in progress, skipping');
      return { elements: [], processingTime: 0 };
    }

    const startTime = performance.now();
    this.isProcessing = true;

    try {
      // Extract frame from video
      const frameMat = this.extractVideoFrame(videoElement);
      if (!frameMat) {
        return { elements: [], processingTime: 0 };
      }

      // Process frame for TFT elements
      const results = await this.detectTftElements(frameMat);
      
      // Clean up
      frameMat.delete();
      
      const processingTime = performance.now() - startTime;
      this.lastProcessTime = processingTime;
      
      logger.debug('Frame processing completed', {
        elements: results.length,
        processingTime: Math.round(processingTime)
      });

      return {
        elements: results,
        processingTime: processingTime,
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Error processing frame', error);
      return { elements: [], processingTime: 0 };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract frame from video element as OpenCV Mat
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {cv.Mat|null} Frame matrix
   */
  extractVideoFrame(videoElement) {
    try {
      // Create canvas for frame extraction
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Convert to OpenCV Mat
      const mat = cv.matFromImageData(imageData);
      
      // Clean up canvas
      canvas.remove();
      
      return mat;
    } catch (error) {
      logger.error('Error extracting video frame', error);
      return null;
    }
  }

  /**
   * Detect TFT elements in frame
   * @param {cv.Mat} frameMat - Frame matrix
   * @returns {Promise<Array>} Detected elements
   */
  async detectTftElements(frameMat) {
    const elements = [];

    try {
      // Convert to grayscale for better template matching
      const grayMat = new cv.Mat();
      cv.cvtColor(frameMat, grayMat, cv.COLOR_RGBA2GRAY);

      // Detect different TFT elements
      const augmentElements = await this.detectAugments(grayMat);
      const championElements = await this.detectChampions(grayMat);
      const shopElements = await this.detectShopArea(grayMat);

      elements.push(...augmentElements);
      elements.push(...championElements);
      elements.push(...shopElements);

      grayMat.delete();
      
    } catch (error) {
      logger.error('Error detecting TFT elements', error);
    }

    return elements;
  }

  /**
   * Detect augment elements
   * @param {cv.Mat} grayMat - Grayscale frame
   * @returns {Promise<Array>} Augment elements
   */
  async detectAugments(grayMat) {
    const elements = [];
    
    // For now, return mock augment positions
    // In full implementation, this would use template matching
    const mockAugments = [
      { type: 'augment', x: 100, y: 200, width: 50, height: 50, confidence: 0.85 },
      { type: 'augment', x: 200, y: 200, width: 50, height: 50, confidence: 0.92 }
    ];

    return mockAugments;
  }

  /**
   * Detect champion elements
   * @param {cv.Mat} grayMat - Grayscale frame  
   * @returns {Promise<Array>} Champion elements
   */
  async detectChampions(grayMat) {
    const elements = [];
    
    // Mock champion positions
    const mockChampions = [
      { type: 'champion', x: 300, y: 400, width: 60, height: 60, confidence: 0.78, cost: 1 },
      { type: 'champion', x: 380, y: 400, width: 60, height: 60, confidence: 0.83, cost: 2 }
    ];

    return mockChampions;
  }

  /**
   * Detect shop area
   * @param {cv.Mat} grayMat - Grayscale frame
   * @returns {Promise<Array>} Shop elements
   */
  async detectShopArea(grayMat) {
    const elements = [];
    
    // Mock shop area
    const mockShop = [
      { type: 'shop', x: 50, y: 500, width: 500, height: 100, confidence: 0.95 }
    ];

    return mockShop;
  }

  /**
   * Check if processor is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isOpencvReady;
  }

  /**
   * Get processing performance stats
   * @returns {object} Performance stats
   */
  getStats() {
    return {
      isReady: this.isOpencvReady,
      templatesLoaded: this.templates.size,
      lastProcessTime: this.lastProcessTime,
      queueLength: this.processingQueue.length
    };
  }

  /**
   * Clean up OpenCV resources
   */
  cleanup() {
    try {
      // Clean up template matrices
      for (const [name, template] of this.templates) {
        if (template && template.delete) {
          template.delete();
        }
      }
      this.templates.clear();
      
      logger.info('CV processor cleanup completed');
    } catch (error) {
      logger.error('Error during CV processor cleanup', error);
    }
  }
} 