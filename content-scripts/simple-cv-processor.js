/**
 * Simple Computer Vision Processor
 * Pure JavaScript implementation without OpenCV dependency
 * Uses Canvas API for image processing
 */

class SimpleCvProcessor {
  constructor() {
    // Note: No this.isReady property - we use the isReady() method instead
    this.processingQueue = [];
    this.isProcessing = false;
    this.lastProcessTime = 0;
    this.detectionCache = new Map();
    
    logger.info('Simple CV Processor initialized - no external dependencies');
  }

  /**
   * Process video frame for TFT elements
   * @param {HTMLVideoElement} videoElement - Video element to process
   * @returns {Promise<object>} Processing results
   */
  async processFrame(videoElement) {
    if (this.isProcessing) {
      logger.debug('Frame processing already in progress, skipping');
      return { elements: [], processingTime: 0 };
    }

    const startTime = performance.now();
    this.isProcessing = true;

    try {
      // Extract frame from video
      const frameData = this.extractVideoFrame(videoElement);
      if (!frameData) {
        return { elements: [], processingTime: 0 };
      }

      // Process frame for TFT elements using simple CV techniques
      const results = await this.detectTftElements(frameData);
      
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
   * Extract frame from video element
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {object|null} Frame data with canvas and context
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
      
      return {
        canvas,
        context: ctx,
        imageData,
        width: canvas.width,
        height: canvas.height
      };
      
    } catch (error) {
      logger.error('Error extracting video frame', error);
      return null;
    }
  }

  /**
   * Detect TFT elements using simple image processing
   * @param {object} frameData - Frame data from extractVideoFrame
   * @returns {Promise<Array>} Detected elements
   */
  async detectTftElements(frameData) {
    const elements = [];
    const { imageData, width, height } = frameData;

    try {
      // Convert to grayscale for processing
      const grayData = this.convertToGrayscale(imageData);
      
      // Detect different TFT elements using color/pattern analysis
      const augmentElements = this.detectAugmentSlots(grayData, width, height);
      const championElements = this.detectChampionSlots(grayData, width, height);
      const shopElements = this.detectShopArea(grayData, width, height);
      const goldElements = this.detectGoldIndicator(grayData, width, height);

      elements.push(...augmentElements);
      elements.push(...championElements);
      elements.push(...shopElements);
      elements.push(...goldElements);

    } catch (error) {
      logger.error('Error detecting TFT elements', error);
    }

    // Clean up canvas
    if (frameData.canvas) {
      frameData.canvas.remove();
    }

    return elements;
  }

  /**
   * Convert image data to grayscale
   * @param {ImageData} imageData - Original image data
   * @returns {Uint8Array} Grayscale data
   */
  convertToGrayscale(imageData) {
    const data = imageData.data;
    const grayData = new Uint8Array(data.length / 4);
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert RGB to grayscale using luminance formula
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayData[i / 4] = gray;
    }
    
    return grayData;
  }

  /**
   * Detect augment slots using color patterns
   * @param {Uint8Array} grayData - Grayscale image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array} Detected augment elements
   */
  detectAugmentSlots(grayData, width, height) {
    const elements = [];
    
    // Look for augment slots in typical TFT UI positions
    // Augments usually appear in the center-top area
    const searchArea = {
      x: Math.round(width * 0.3),
      y: Math.round(height * 0.1),
      width: Math.round(width * 0.4),
      height: Math.round(height * 0.2)
    };

    // Simple pattern detection for rectangular augment slots
    const candidates = this.findRectangularRegions(grayData, width, height, searchArea, {
      minWidth: 80,
      maxWidth: 120,
      minHeight: 80,
      maxHeight: 120,
      threshold: 0.7
    });

    candidates.forEach((candidate, index) => {
      elements.push({
        type: 'augment',
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
        confidence: candidate.confidence,
        id: `augment_${index}`
      });
    });

    return elements;
  }

  /**
   * Detect champion slots in shop area
   * @param {Uint8Array} grayData - Grayscale image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array} Detected champion elements
   */
  detectChampionSlots(grayData, width, height) {
    const elements = [];
    
    // Champions typically appear in bottom area (shop)
    const searchArea = {
      x: Math.round(width * 0.2),
      y: Math.round(height * 0.7),
      width: Math.round(width * 0.6),
      height: Math.round(height * 0.25)
    };

    // Look for champion-sized rectangular regions
    const candidates = this.findRectangularRegions(grayData, width, height, searchArea, {
      minWidth: 50,
      maxWidth: 80,
      minHeight: 50,
      maxHeight: 80,
      threshold: 0.6
    });

    candidates.forEach((candidate, index) => {
      elements.push({
        type: 'champion',
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
        confidence: candidate.confidence,
        cost: this.estimateChampionCost(candidate),
        id: `champion_${index}`
      });
    });

    return elements;
  }

  /**
   * Detect shop area
   * @param {Uint8Array} grayData - Grayscale image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array} Detected shop elements
   */
  detectShopArea(grayData, width, height) {
    const elements = [];
    
    // Shop area is typically at the bottom of the screen
    const shopArea = {
      x: Math.round(width * 0.15),
      y: Math.round(height * 0.75),
      width: Math.round(width * 0.7),
      height: Math.round(height * 0.2)
    };

    // Check if this area has the characteristic shop pattern
    const confidence = this.analyzeShopPattern(grayData, width, height, shopArea);
    
    if (confidence > 0.5) {
      elements.push({
        type: 'shop',
        x: shopArea.x,
        y: shopArea.y,
        width: shopArea.width,
        height: shopArea.height,
        confidence: confidence,
        id: 'shop_area'
      });
    }

    return elements;
  }

  /**
   * Detect gold indicator
   * @param {Uint8Array} grayData - Grayscale image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array} Detected gold elements
   */
  detectGoldIndicator(grayData, width, height) {
    const elements = [];
    
    // Gold indicator typically in top-left or bottom-left
    const searchAreas = [
      { x: 0, y: 0, width: Math.round(width * 0.3), height: Math.round(height * 0.2) },
      { x: 0, y: Math.round(height * 0.8), width: Math.round(width * 0.3), height: Math.round(height * 0.2) }
    ];

    searchAreas.forEach((area, areaIndex) => {
      const goldRegions = this.findBrightRegions(grayData, width, height, area);
      
      goldRegions.forEach((region, index) => {
        elements.push({
          type: 'gold',
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          confidence: region.confidence,
          id: `gold_${areaIndex}_${index}`
        });
      });
    });

    return elements;
  }

  /**
   * Find rectangular regions in image
   * @param {Uint8Array} grayData - Grayscale data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {object} searchArea - Area to search in
   * @param {object} params - Detection parameters
   * @returns {Array} Found regions
   */
  findRectangularRegions(grayData, width, height, searchArea, params) {
    const regions = [];
    const { minWidth, maxWidth, minHeight, maxHeight, threshold } = params;
    
    // Simple edge detection and region finding
    // This is a basic implementation - in production you'd use more sophisticated algorithms
    
    for (let y = searchArea.y; y < searchArea.y + searchArea.height - minHeight; y += 10) {
      for (let x = searchArea.x; x < searchArea.x + searchArea.width - minWidth; x += 10) {
        
        // Check for rectangular patterns
        const region = this.analyzeRegion(grayData, width, height, x, y, minWidth, minHeight);
        
        if (region.confidence > threshold) {
          regions.push({
            x: x,
            y: y,
            width: minWidth,
            height: minHeight,
            confidence: region.confidence
          });
        }
      }
    }
    
    return regions;
  }

  /**
   * Analyze a specific region for patterns
   * @param {Uint8Array} grayData - Grayscale data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} x - Region x
   * @param {number} y - Region y
   * @param {number} w - Region width
   * @param {number} h - Region height
   * @returns {object} Analysis result
   */
  analyzeRegion(grayData, width, height, x, y, w, h) {
    let edgeCount = 0;
    let totalPixels = 0;
    
    // Simple edge detection
    for (let ry = y; ry < y + h && ry < height - 1; ry++) {
      for (let rx = x; rx < x + w && rx < width - 1; rx++) {
        const currentPixel = grayData[ry * width + rx];
        const rightPixel = grayData[ry * width + rx + 1];
        const bottomPixel = grayData[(ry + 1) * width + rx];
        
        // Check for edges
        if (Math.abs(currentPixel - rightPixel) > 30 || Math.abs(currentPixel - bottomPixel) > 30) {
          edgeCount++;
        }
        totalPixels++;
      }
    }
    
    const edgeRatio = totalPixels > 0 ? edgeCount / totalPixels : 0;
    
    return {
      confidence: Math.min(edgeRatio * 2, 1.0) // Normalize to 0-1
    };
  }

  /**
   * Analyze shop pattern
   * @param {Uint8Array} grayData - Grayscale data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {object} area - Area to analyze
   * @returns {number} Confidence score
   */
  analyzeShopPattern(grayData, width, height, area) {
    // Look for horizontal patterns typical of TFT shop
    let horizontalEdges = 0;
    let totalChecks = 0;
    
    for (let y = area.y; y < area.y + area.height && y < height - 1; y += 5) {
      for (let x = area.x; x < area.x + area.width && x < width - 1; x += 5) {
        const currentPixel = grayData[y * width + x];
        const rightPixel = grayData[y * width + x + 1];
        
        if (Math.abs(currentPixel - rightPixel) > 25) {
          horizontalEdges++;
        }
        totalChecks++;
      }
    }
    
    return totalChecks > 0 ? Math.min((horizontalEdges / totalChecks) * 1.5, 1.0) : 0;
  }

  /**
   * Find bright regions (for gold detection)
   * @param {Uint8Array} grayData - Grayscale data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {object} area - Search area
   * @returns {Array} Bright regions
   */
  findBrightRegions(grayData, width, height, area) {
    const regions = [];
    
    for (let y = area.y; y < area.y + area.height - 20; y += 10) {
      for (let x = area.x; x < area.x + area.width - 20; x += 10) {
        
        // Check brightness in small region
        let brightness = 0;
        let pixels = 0;
        
        for (let ry = y; ry < y + 20 && ry < height; ry++) {
          for (let rx = x; rx < x + 20 && rx < width; rx++) {
            brightness += grayData[ry * width + rx];
            pixels++;
          }
        }
        
        const avgBrightness = pixels > 0 ? brightness / pixels : 0;
        
        // Gold indicators are typically bright yellow/white
        if (avgBrightness > 200) {
          regions.push({
            x: x,
            y: y,
            width: 20,
            height: 20,
            confidence: Math.min(avgBrightness / 255, 1.0)
          });
        }
      }
    }
    
    return regions;
  }

  /**
   * Estimate champion cost based on visual features
   * @param {object} candidate - Champion candidate
   * @returns {number} Estimated cost (1-5)
   */
  estimateChampionCost(candidate) {
    // Simple heuristic based on position and confidence
    // In a real implementation, this would analyze color patterns
    
    if (candidate.confidence > 0.9) return 5;
    if (candidate.confidence > 0.8) return 4;
    if (candidate.confidence > 0.7) return 3;
    if (candidate.confidence > 0.6) return 2;
    return 1;
  }

  /**
   * Check if processor is ready
   * @returns {boolean} Always true for simple processor
   */
  isReady() {
    return true;
  }

  /**
   * Get processing stats
   * @returns {object} Performance stats
   */
  getStats() {
    return {
      isReady: this.isReady(),
      lastProcessTime: this.lastProcessTime,
      cacheSize: this.detectionCache.size,
      type: 'Simple CV Processor'
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.detectionCache.clear();
    logger.info('Simple CV Processor cleaned up');
  }
} 