/**
 * TFT Traits Data Manager
 * Handles loading and accessing TFT Set 14 traits data with activation levels
 */

class TraitsDataManager {
  constructor() {
    this.traitsData = null;
    this.traitMap = new Map();
    this.activationMap = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Load traits data from the extension assets
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
      logger.info('Loading TFT Set 14 traits data...');

      // Load main traits data (using verified Community Dragon data)
      const traitsUrl = chrome.runtime.getURL('assets/traits/tft-set14-traits.json');
      const traitsResponse = await fetch(traitsUrl);
      if (!traitsResponse.ok) {
        throw new Error(`Failed to load traits data: ${traitsResponse.status}`);
      }

      this.traitsData = await traitsResponse.json();

      // Load activation levels data
      const activationUrl = chrome.runtime.getURL('assets/traits/traits-activation-levels.json');
      const activationResponse = await fetch(activationUrl);
      if (activationResponse.ok) {
        const activationData = await activationResponse.json();
        
        // Create lookup maps
        this.traitMap.clear();
        this.activationMap.clear();
        
        this.traitsData.traits.forEach(trait => {
          this.traitMap.set(trait.key, trait);
        });

        Object.entries(activationData).forEach(([key, data]) => {
          this.activationMap.set(key, data);
        });
      }

      this.isLoaded = true;
      
      logger.info('Traits data loaded successfully', {
        version: this.traitsData.version,
        totalTraits: this.traitsData.totalTraits,
        typeBreakdown: this.traitsData.typeBreakdown
      });

      return true;

    } catch (error) {
      logger.error('Failed to load traits data', error);
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Get trait by key
   * @param {string} key - Trait key
   * @returns {object|null} Trait data or null if not found
   */
  getTrait(key) {
    if (!this.isLoaded) {
      logger.warn('Traits data not loaded yet');
      return null;
    }

    return this.traitMap.get(key) || null;
  }

  /**
   * Get trait activation levels and descriptions
   * @param {string} key - Trait key
   * @returns {object|null} Activation data or null if not found
   */
  getTraitActivation(key) {
    if (!this.isLoaded) {
      logger.warn('Traits data not loaded yet');
      return null;
    }

    return this.activationMap.get(key) || null;
  }

  /**
   * Get trait effect for specific activation level
   * @param {string} key - Trait key
   * @param {number} level - Number of champions with this trait
   * @returns {object|null} Effect data for the current level
   */
  getTraitEffect(key, level) {
    const trait = this.getTrait(key);
    const activation = this.getTraitActivation(key);
    
    if (!trait || !activation) {
      return null;
    }

    // Find the highest activation level that the current level meets
    const activeLevels = trait.activationLevels.filter(reqLevel => level >= reqLevel);
    if (activeLevels.length === 0) {
      return null;
    }

    const activeLevel = Math.max(...activeLevels);
    const levelData = activation.levels[activeLevel];

    if (!levelData) {
      return null;
    }

    return {
      trait: trait,
      activeLevel: activeLevel,
      tierName: levelData.tierName,
      description: levelData.description,
      isMaxLevel: activeLevel === Math.max(...trait.activationLevels),
      nextLevel: trait.activationLevels.find(reqLevel => reqLevel > activeLevel) || null
    };
  }

  /**
   * Search traits by text
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   * @returns {Array} Array of matching traits
   */
  searchTraits(query, limit = 10) {
    if (!this.isLoaded) {
      logger.warn('Traits data not loaded yet');
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return [];
    }

    const matches = this.traitsData.traits.filter(trait => 
      trait.searchText.includes(searchTerm)
    );

    // Sort by relevance (exact name matches first, then by type)
    matches.sort((a, b) => {
      const aExactMatch = a.name.toLowerCase().includes(searchTerm);
      const bExactMatch = b.name.toLowerCase().includes(searchTerm);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // If both or neither are exact matches, sort by type (class first, then origin)
      if (a.type !== b.type) {
        return a.type === 'class' ? -1 : 1;
      }
      
      return a.name.localeCompare(b.name);
    });

    return matches.slice(0, limit);
  }

  /**
   * Get traits by type
   * @param {string} type - Trait type ('class', 'origin', etc.)
   * @returns {Array} Array of traits of the specified type
   */
  getTraitsByType(type) {
    if (!this.isLoaded) {
      logger.warn('Traits data not loaded yet');
      return [];
    }

    return this.traitsData.traits.filter(trait => trait.type === type);
  }

  /**
   * Get all traits
   * @returns {Array} Array of all traits
   */
  getAllTraits() {
    if (!this.isLoaded) {
      logger.warn('Traits data not loaded yet');
      return [];
    }

    return this.traitsData.traits;
  }

  /**
   * Get trait image URL
   * @param {object} trait - Trait object
   * @returns {string} Full URL to the trait image
   */
  getTraitImageUrl(trait) {
    if (!trait || !trait.image) {
      return '';
    }

    return chrome.runtime.getURL(`assets/traits/images/${trait.image}`);
  }

  /**
   * Get tier-specific trait image URL (for different activation levels)
   * @param {object} trait - Trait object
   * @param {string} tierName - Tier name ('Bronze', 'Silver', 'Gold', etc.)
   * @returns {string} Full URL to the tier-specific trait image
   */
  getTierTraitImageUrl(trait, tierName) {
    if (!trait || !trait.image) {
      return '';
    }

    // For now, return the base image. In the future, you could have tier-specific images
    // like: `trait_${tierName.toLowerCase()}_${trait.image}`
    return this.getTraitImageUrl(trait);
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
      version: this.traitsData.version,
      setNumber: this.traitsData.setNumber,
      setName: this.traitsData.setName,
      totalTraits: this.traitsData.totalTraits,
      enhancedTraits: this.traitsData.enhancedTraits,
      lastUpdated: this.traitsData.lastUpdated,
      typeBreakdown: this.traitsData.typeBreakdown
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
   * Create tooltip data for a trait at specific activation level
   * @param {object} trait - Trait object
   * @param {number} level - Current number of champions with this trait
   * @returns {object} Tooltip data
   */
  createTooltipData(trait, level = 0) {
    if (!trait) {
      return null;
    }

    const effect = this.getTraitEffect(trait.key, level);
    
    return {
      name: trait.name,
      type: trait.type,
      image: this.getTraitImageUrl(trait),
      currentLevel: level,
      activationLevels: trait.activationLevels,
      effect: effect,
      allDescriptions: trait.descriptions
    };
  }

  /**
   * Get tier color for styling
   * @param {string} tierName - Tier name ('Bronze', 'Silver', 'Gold', etc.)
   * @returns {string} CSS color value
   */
  getTierColor(tierName) {
    switch (tierName) {
      case 'Bronze':
        return '#CD7F32'; // Bronze
      case 'Silver':
        return '#C0C0C0'; // Silver
      case 'Gold':
        return '#FFD700'; // Gold
      case 'Prismatic':
        return '#E91E63'; // Pink/Magenta
      case 'Diamond':
        return '#B9F2FF'; // Light Blue
      default:
        return '#FFFFFF'; // White fallback
    }
  }

  /**
   * Get type color for styling
   * @param {string} type - Trait type
   * @returns {string} CSS color value
   */
  getTypeColor(type) {
    switch (type) {
      case 'class':
        return '#4CAF50'; // Green
      case 'origin':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Gray
    }
  }

  /**
   * Get type display name
   * @param {string} type - Trait type
   * @returns {string} Display name with emoji
   */
  getTypeDisplayName(type) {
    switch (type) {
      case 'class':
        return '⚔️ Class';
      case 'origin':
        return '🌟 Origin';
      default:
        return '❓ Unknown';
    }
  }

  /**
   * Get progress to next activation level
   * @param {string} key - Trait key
   * @param {number} currentLevel - Current number of champions
   * @returns {object|null} Progress information
   */
  getActivationProgress(key, currentLevel) {
    const trait = this.getTrait(key);
    if (!trait) {
      return null;
    }

    const nextLevel = trait.activationLevels.find(level => level > currentLevel);
    if (!nextLevel) {
      return {
        isMaxed: true,
        current: currentLevel,
        max: Math.max(...trait.activationLevels),
        progress: 1
      };
    }

    const previousLevel = trait.activationLevels
      .filter(level => level <= currentLevel)
      .pop() || 0;

    return {
      isMaxed: false,
      current: currentLevel,
      next: nextLevel,
      previous: previousLevel,
      needed: nextLevel - currentLevel,
      progress: (currentLevel - previousLevel) / (nextLevel - previousLevel)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TraitsDataManager;
} 