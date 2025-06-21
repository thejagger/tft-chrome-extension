/**
 * Template Matcher
 * Specialized template matching for TFT elements using OpenCV.js
 */

/**
 * Template matcher class for TFT-specific element detection
 */
class TemplateMatcher {
  constructor(cvProcessor) {
    this.cvProcessor = cvProcessor;
    this.matchingThreshold = CONFIG.CV.MATCHING_THRESHOLD;
    this.scaleFactors = CONFIG.CV.SCALE_FACTORS;
    this.matchCache = new Map();
  }

  /**
   * Find all matches for a template in the frame
   * @param {cv.Mat} frameMat - Frame to search in
   * @param {cv.Mat} templateMat - Template to find
   * @param {number} threshold - Matching threshold (0-1)
   * @returns {Array} Array of match results
   */
  findMatches(frameMat, templateMat, threshold = 0.8) {
    const matches = [];
    
    try {
      if (!frameMat || !templateMat) {
        return matches;
      }

      // Perform template matching at different scales
      for (const scale of this.scaleFactors) {
        const scaledMatches = this.matchAtScale(frameMat, templateMat, scale, threshold);
        matches.push(...scaledMatches);
      }

      // Remove duplicate matches (non-maximum suppression)
      const filteredMatches = this.nonMaximumSuppression(matches);
      
      return filteredMatches;
    } catch (error) {
      logger.error('Error in template matching', error);
      return matches;
    }
  }

  /**
   * Perform template matching at a specific scale
   * @param {cv.Mat} frameMat - Frame matrix
   * @param {cv.Mat} templateMat - Template matrix
   * @param {number} scale - Scale factor
   * @param {number} threshold - Matching threshold
   * @returns {Array} Matches at this scale
   */
  matchAtScale(frameMat, templateMat, scale, threshold) {
    const matches = [];
    
    try {
      // Scale the template
      const scaledTemplate = new cv.Mat();
      const scaledSize = new cv.Size(
        Math.round(templateMat.cols * scale),
        Math.round(templateMat.rows * scale)
      );
      
      cv.resize(templateMat, scaledTemplate, scaledSize);
      
      // Perform template matching
      const result = new cv.Mat();
      cv.matchTemplate(frameMat, scaledTemplate, result, cv.TM_CCOEFF_NORMED);
      
      // Find matches above threshold
      const minMaxLoc = cv.minMaxLoc(result);
      let matchFound = true;
      
      while (matchFound && minMaxLoc.maxVal >= threshold) {
        matches.push({
          x: minMaxLoc.maxLoc.x,
          y: minMaxLoc.maxLoc.y,
          width: scaledTemplate.cols,
          height: scaledTemplate.rows,
          confidence: minMaxLoc.maxVal,
          scale: scale
        });
        
        // Mask the found area and look for more matches
        const maskRect = new cv.Rect(
          Math.max(0, minMaxLoc.maxLoc.x - scaledTemplate.cols / 2),
          Math.max(0, minMaxLoc.maxLoc.y - scaledTemplate.rows / 2),
          scaledTemplate.cols,
          scaledTemplate.rows
        );
        
        const mask = cv.Mat.zeros(result.rows, result.cols, cv.CV_8UC1);
        cv.rectangle(mask, maskRect, new cv.Scalar(255), -1);
        result.setTo(new cv.Scalar(0), mask);
        
        const newMinMaxLoc = cv.minMaxLoc(result);
        if (newMinMaxLoc.maxVal < threshold) {
          matchFound = false;
        } else {
          minMaxLoc.maxVal = newMinMaxLoc.maxVal;
          minMaxLoc.maxLoc = newMinMaxLoc.maxLoc;
        }
        
        mask.delete();
      }
      
      // Clean up
      scaledTemplate.delete();
      result.delete();
      
    } catch (error) {
      logger.error('Error in scale-specific matching', { scale, error });
    }
    
    return matches;
  }

  /**
   * Remove overlapping matches using non-maximum suppression
   * @param {Array} matches - Array of match results
   * @returns {Array} Filtered matches
   */
  nonMaximumSuppression(matches) {
    if (matches.length <= 1) return matches;
    
    // Sort by confidence (descending)
    matches.sort((a, b) => b.confidence - a.confidence);
    
    const filteredMatches = [];
    
    for (const match of matches) {
      let shouldKeep = true;
      
      // Check overlap with already selected matches
      for (const selectedMatch of filteredMatches) {
        const overlap = this.calculateOverlap(match, selectedMatch);
        if (overlap > CONFIG.CV.NMS_OVERLAP_THRESHOLD) {
          shouldKeep = false;
          break;
        }
      }
      
      if (shouldKeep) {
        filteredMatches.push(match);
      }
    }
    
    return filteredMatches;
  }

  /**
   * Calculate overlap between two rectangles
   * @param {object} rect1 - First rectangle
   * @param {object} rect2 - Second rectangle
   * @returns {number} Overlap ratio (0-1)
   */
  calculateOverlap(rect1, rect2) {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersectionArea = (x2 - x1) * (y2 - y1);
    const rect1Area = rect1.width * rect1.height;
    const rect2Area = rect2.width * rect2.height;
    const unionArea = rect1Area + rect2Area - intersectionArea;
    
    return intersectionArea / unionArea;
  }

  /**
   * Match TFT augment elements
   * @param {cv.Mat} frameMat - Frame matrix
   * @returns {Promise<Array>} Augment matches
   */
  async matchAugments(frameMat) {
    const matches = [];
    
    try {
      // Define augment matching regions (typical TFT augment positions)
      const augmentRegions = [
        { x: 50, y: 150, width: 300, height: 100 },   // Top augment area
        { x: 400, y: 150, width: 300, height: 100 },  // Top right augment area
        { x: 200, y: 250, width: 400, height: 50 }    // Middle augment area
      ];
      
      for (const region of augmentRegions) {
        const regionMat = frameMat.roi(new cv.Rect(region.x, region.y, region.width, region.height));
        
        // Look for augment-like patterns
        const augmentMatches = await this.detectAugmentPattern(regionMat);
        
        // Adjust coordinates to full frame
        augmentMatches.forEach(match => {
          match.x += region.x;
          match.y += region.y;
          match.type = 'augment';
        });
        
        matches.push(...augmentMatches);
        regionMat.delete();
      }
      
    } catch (error) {
      logger.error('Error matching augments', error);
    }
    
    return matches;
  }

  /**
   * Detect augment patterns using morphological operations
   * @param {cv.Mat} regionMat - Region to search
   * @returns {Promise<Array>} Detected augment patterns
   */
  async detectAugmentPattern(regionMat) {
    try {
      // Convert to grayscale if needed
      let grayMat = regionMat;
      if (regionMat.channels() > 1) {
        grayMat = new cv.Mat();
        cv.cvtColor(regionMat, grayMat, cv.COLOR_RGBA2GRAY);
      }
      
      // Apply threshold to find bright regions (typical for TFT UI)
      const threshMat = new cv.Mat();
      cv.threshold(grayMat, threshMat, 200, 255, cv.THRESH_BINARY);
      
      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(threshMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      const matches = [];
      
      // Analyze contours for augment-like shapes
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const rect = cv.boundingRect(contour);
        
        // Filter by size (typical augment dimensions)
        if (rect.width > 30 && rect.width < 100 && 
            rect.height > 20 && rect.height < 80) {
          
          const area = cv.contourArea(contour);
          const rectArea = rect.width * rect.height;
          const fillRatio = area / rectArea;
          
          // Check if shape is rectangular enough for an augment
          if (fillRatio > 0.6) {
            matches.push({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              confidence: fillRatio,
              area: area
            });
          }
        }
        
        contour.delete();
      }
      
      // Clean up
      if (grayMat !== regionMat) grayMat.delete();
      threshMat.delete();
      contours.delete();
      hierarchy.delete();
      
      return matches;
      
    } catch (error) {
      logger.error('Error detecting augment pattern', error);
      return [];
    }
  }

  /**
   * Match TFT champion elements
   * @param {cv.Mat} frameMat - Frame matrix
   * @returns {Promise<Array>} Champion matches
   */
  async matchChampions(frameMat) {
    const matches = [];
    
    try {
      // Define champion board regions (typical TFT board positions)
      const boardRegions = [
        { x: 100, y: 300, width: 500, height: 200 }, // Main board area
        { x: 50, y: 520, width: 600, height: 100 }   // Bench area
      ];
      
      for (const region of boardRegions) {
        const regionMat = frameMat.roi(new cv.Rect(region.x, region.y, region.width, region.height));
        
        // Detect champion-like patterns
        const championMatches = await this.detectChampionPattern(regionMat);
        
        // Adjust coordinates and add metadata
        championMatches.forEach(match => {
          match.x += region.x;
          match.y += region.y;
          match.type = 'champion';
          match.region = region === boardRegions[0] ? 'board' : 'bench';
        });
        
        matches.push(...championMatches);
        regionMat.delete();
      }
      
    } catch (error) {
      logger.error('Error matching champions', error);
    }
    
    return matches;
  }

  /**
   * Detect champion patterns using edge detection
   * @param {cv.Mat} regionMat - Region to search
   * @returns {Promise<Array>} Detected champion patterns
   */
  async detectChampionPattern(regionMat) {
    try {
      // Convert to grayscale
      let grayMat = regionMat;
      if (regionMat.channels() > 1) {
        grayMat = new cv.Mat();
        cv.cvtColor(regionMat, grayMat, cv.COLOR_RGBA2GRAY);
      }
      
      // Apply Gaussian blur
      const blurredMat = new cv.Mat();
      cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0);
      
      // Edge detection
      const edgesMat = new cv.Mat();
      cv.Canny(blurredMat, edgesMat, 50, 150);
      
      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(edgesMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      const matches = [];
      
      // Analyze contours for champion-like shapes
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const rect = cv.boundingRect(contour);
        
        // Filter by size (typical champion hex dimensions)
        if (rect.width > 40 && rect.width < 80 && 
            rect.height > 40 && rect.height < 80) {
          
          const area = cv.contourArea(contour);
          const aspectRatio = rect.width / rect.height;
          
          // Check if shape is roughly square (champion hexes)
          if (aspectRatio > 0.7 && aspectRatio < 1.3 && area > 1000) {
            matches.push({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              confidence: Math.min(area / 3000, 1.0),
              aspectRatio: aspectRatio
            });
          }
        }
        
        contour.delete();
      }
      
      // Clean up
      if (grayMat !== regionMat) grayMat.delete();
      blurredMat.delete();
      edgesMat.delete();
      contours.delete();
      hierarchy.delete();
      
      return matches;
      
    } catch (error) {
      logger.error('Error detecting champion pattern', error);
      return [];
    }
  }

  /**
   * Get matching statistics
   * @returns {object} Matching performance stats
   */
  getStats() {
    return {
      cacheSize: this.matchCache.size,
      threshold: this.matchingThreshold,
      scaleFactors: this.scaleFactors
    };
  }

  /**
   * Clear matching cache
   */
  clearCache() {
    this.matchCache.clear();
  }
} 