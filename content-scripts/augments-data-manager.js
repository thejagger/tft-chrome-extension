/**
 * TFT Augments Data Manager
 * Handles loading and accessing TFT Set 14 augments data
 */

class AugmentsDataManager {
  constructor() {
    this.augmentsData = null;
    this.augmentMap = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Load augments data from the extension assets
   * @returns {Promise<boolean>} Whether data was loaded successfully
   */
  async loadData() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadDataInternal();
    return this.loadPromise;
  }

  /**
   * Internal data loading implementation
   * @private
   */
  async _loadDataInternal() {
    try {
      logger.info('Loading TFT Set 14 augments data...');

      // Get the data file URL from the extension
      const dataUrl = chrome.runtime.getURL('assets/augments/tft-set14-augments.json');
      
      // Fetch the data
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to load augments data: ${response.status}`);
      }

      this.augmentsData = await response.json();
      
      // Create lookup map for faster access
      this.augmentMap.clear();
      this.augmentsData.augments.forEach(augment => {
        this.augmentMap.set(augment.key, augment);
      });

      this.isLoaded = true;
      
      logger.info('Augments data loaded successfully', {
        version: this.augmentsData.version,
        totalAugments: this.augmentsData.totalAugments,
        tierBreakdown: this.augmentsData.tierBreakdown
      });

      return true;

    } catch (error) {
      logger.error('Failed to load augments data', error);
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Get augment by key
   * @param {string} key - Augment key
   * @returns {object|null} Augment data or null if not found
   */
  getAugment(key) {
    if (!this.isLoaded) {
      logger.warn('Augments data not loaded yet');
      return null;
    }

    return this.augmentMap.get(key) || null;
  }

  /**
   * Search augments by text
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   * @returns {Array} Array of matching augments
   */
  searchAugments(query, limit = 10) {
    if (!this.isLoaded) {
      logger.warn('Augments data not loaded yet');
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return [];
    }

    const matches = this.augmentsData.augments.filter(augment => 
      augment.searchText.includes(searchTerm)
    );

    // Sort by relevance (exact title matches first, then by tier priority)
    matches.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase().includes(searchTerm);
      const bExactMatch = b.title.toLowerCase().includes(searchTerm);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // If both or neither are exact matches, sort by tier priority
      return b.tierPriority - a.tierPriority;
    });

    return matches.slice(0, limit);
  }

  /**
   * Get augments by tier
   * @param {string} tier - Tier name ('Silver', 'Gold', 'Prismatic')
   * @returns {Array} Array of augments in the specified tier
   */
  getAugmentsByTier(tier) {
    if (!this.isLoaded) {
      logger.warn('Augments data not loaded yet');
      return [];
    }

    return this.augmentsData.augments.filter(augment => augment.tier === tier);
  }

  /**
   * Get all augments
   * @returns {Array} Array of all augments
   */
  getAllAugments() {
    if (!this.isLoaded) {
      logger.warn('Augments data not loaded yet');
      return [];
    }

    return this.augmentsData.augments;
  }

  /**
   * Get augment image URL
   * @param {object} augment - Augment object
   * @returns {string} Full URL to the augment image
   */
  getAugmentImageUrl(augment) {
    if (!augment || !augment.image) {
      return '';
    }

    return chrome.runtime.getURL(`assets/augments/images/${augment.image}`);
  }

  /**
   * Get data statistics
   * @returns {object} Data statistics
   */
  getStats() {
    if (!this.isLoaded) {
      return null;
    }

    return {
      version: this.augmentsData.version,
      setNumber: this.augmentsData.setNumber,
      setName: this.augmentsData.setName,
      totalAugments: this.augmentsData.totalAugments,
      lastUpdated: this.augmentsData.lastUpdated,
      tierBreakdown: this.augmentsData.tierBreakdown
    };
  }

  /**
   * Check if data is loaded
   * @returns {boolean} Whether data is loaded
   */
  isDataLoaded() {
    return this.isLoaded;
  }

  /**
   * Create tooltip data for an augment
   * @param {object} augment - Augment object
   * @returns {object} Tooltip data
   */
  createTooltipData(augment) {
    if (!augment) {
      return null;
    }

    return {
      title: augment.title,
      description: augment.description,
      tier: augment.tier,
      image: this.getAugmentImageUrl(augment),
      powerLevel: augment.powerLevel,
      tierPriority: augment.tierPriority
    };
  }

  /**
   * Get tier color for styling
   * @param {string} tier - Tier name
   * @returns {string} CSS color value
   */
  getTierColor(tier) {
    switch (tier) {
      case 'Prismatic':
        return '#E91E63'; // Pink/Magenta
      case 'Gold':
        return '#FFD700'; // Gold
      case 'Silver':
        return '#C0C0C0'; // Silver
      default:
        return '#FFFFFF'; // White fallback
    }
  }

  /**
   * Get tier display name
   * @param {string} tier - Tier name
   * @returns {string} Display name with emoji
   */
  getTierDisplayName(tier) {
    switch (tier) {
      case 'Prismatic':
        return '💎 Prismatic';
      case 'Gold':
        return '🥇 Gold';
      case 'Silver':
        return '🥈 Silver';
      default:
        return tier;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AugmentsDataManager;
} 