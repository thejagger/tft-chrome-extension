/**
 * Example: Using TFT Data Managers Together
 * This file demonstrates how to use both AugmentsDataManager and TraitsDataManager
 * in your TFT Chrome extension for comprehensive game analysis
 */

// This would be in your content script
class TFTDataExample {
  constructor() {
    this.augmentsManager = new AugmentsDataManager();
    this.traitsManager = new TraitsDataManager();
    this.isInitialized = false;
  }

  /**
   * Initialize both data managers
   */
  async initialize() {
    try {
      logger.info('Initializing TFT data managers...');

      // Load both datasets in parallel for faster startup
      const [augmentsLoaded, traitsLoaded] = await Promise.all([
        this.augmentsManager.loadData(),
        this.traitsManager.loadData()
      ]);

      if (!augmentsLoaded || !traitsLoaded) {
        throw new Error('Failed to load TFT data');
      }

      this.isInitialized = true;
      logger.info('TFT data managers initialized successfully');

      // Log data statistics
      const augmentStats = this.augmentsManager.getStats();
      const traitStats = this.traitsManager.getStats();
      
      logger.info('Data loaded:', {
        augments: `${augmentStats.totalAugments} augments (${augmentStats.version})`,
        traits: `${traitStats.totalTraits} traits (${traitStats.enhancedTraits} enhanced)`
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize TFT data managers:', error);
      return false;
    }
  }

  /**
   * Example: Analyze detected augments from computer vision
   */
  analyzeDetectedAugments(detectedAugmentKeys) {
    if (!this.isInitialized) {
      logger.warn('Data managers not initialized');
      return [];
    }

    const augmentAnalysis = [];

    detectedAugmentKeys.forEach(augmentKey => {
      const augment = this.augmentsManager.getAugment(augmentKey);
      if (augment) {
        augmentAnalysis.push({
          key: augment.key,
          title: augment.title,
          description: augment.description,
          tier: augment.tier,
          powerLevel: augment.powerLevel,
          image: this.augmentsManager.getAugmentImageUrl(augment),
          tooltipData: this.augmentsManager.createTooltipData(augment)
        });
      }
    });

    // Sort by tier priority (Prismatic > Gold > Silver)
    augmentAnalysis.sort((a, b) => {
      const tierOrder = { 'Prismatic': 3, 'Gold': 2, 'Silver': 1 };
      return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
    });

    return augmentAnalysis;
  }

  /**
   * Example: Analyze team composition for trait activation
   */
  analyzeTeamComposition(champions) {
    if (!this.isInitialized) {
      logger.warn('Data managers not initialized');
      return { traits: [], summary: null };
    }

    // Count champions per trait
    const traitCounts = {};
    champions.forEach(champion => {
      // Assuming each champion has a 'traits' array with trait keys
      if (champion.traits) {
        champion.traits.forEach(traitKey => {
          traitCounts[traitKey] = (traitCounts[traitKey] || 0) + 1;
        });
      }
    });

    // Analyze trait activation
    const traitAnalysis = [];
    Object.entries(traitCounts).forEach(([traitKey, count]) => {
      const trait = this.traitsManager.getTrait(traitKey);
      if (trait) {
        const effect = this.traitsManager.getTraitEffect(traitKey, count);
        const progress = this.traitsManager.getActivationProgress(traitKey, count);
        
        traitAnalysis.push({
          trait: trait,
          count: count,
          effect: effect,
          progress: progress,
          isActive: effect !== null,
          tooltipData: this.traitsManager.createTooltipData(trait, count),
          image: this.traitsManager.getTraitImageUrl(trait)
        });
      }
    });

    // Sort by activation status and type
    traitAnalysis.sort((a, b) => {
      // Active traits first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Then by type (class first, then origin)
      if (a.trait.type !== b.trait.type) {
        return a.trait.type === 'class' ? -1 : 1;
      }
      
      // Finally by count (highest first)
      return b.count - a.count;
    });

    // Create summary
    const summary = {
      totalChampions: champions.length,
      activeTraits: traitAnalysis.filter(t => t.isActive).length,
      inactiveTraits: traitAnalysis.filter(t => !t.isActive).length,
      classTraits: traitAnalysis.filter(t => t.trait.type === 'class').length,
      originTraits: traitAnalysis.filter(t => t.trait.type === 'origin').length,
      maxTierTraits: traitAnalysis.filter(t => t.effect?.isMaxLevel).length
    };

    return {
      traits: traitAnalysis,
      summary: summary
    };
  }

  /**
   * Example: Create comprehensive tooltip for UI display
   */
  createGameElementTooltip(elementType, elementKey, additionalData = {}) {
    if (!this.isInitialized) {
      return null;
    }

    let tooltipData = null;

    switch (elementType) {
      case 'augment':
        const augment = this.augmentsManager.getAugment(elementKey);
        if (augment) {
          tooltipData = {
            type: 'augment',
            title: augment.title,
            description: augment.description,
            tier: augment.tier,
            image: this.augmentsManager.getAugmentImageUrl(augment),
            tierColor: this.getTierColor(augment.tier),
            powerLevel: augment.powerLevel
          };
        }
        break;

      case 'trait':
        const trait = this.traitsManager.getTrait(elementKey);
        if (trait) {
          const championCount = additionalData.championCount || 0;
          const effect = this.traitsManager.getTraitEffect(elementKey, championCount);
          const progress = this.traitsManager.getActivationProgress(elementKey, championCount);
          
          tooltipData = {
            type: 'trait',
            title: `${trait.name} (${championCount})`,
            description: effect?.description || 'Inactive',
            traitType: this.traitsManager.getTypeDisplayName(trait.type),
            image: this.traitsManager.getTraitImageUrl(trait),
            tierColor: this.traitsManager.getTierColor(effect?.tierName),
            typeColor: this.traitsManager.getTypeColor(trait.type),
            activationLevels: trait.activationLevels,
            progress: progress,
            isActive: effect !== null
          };
        }
        break;
    }

    return tooltipData;
  }

  /**
   * Example: Search across both augments and traits
   */
  searchGameElements(query, options = {}) {
    if (!this.isInitialized) {
      return { augments: [], traits: [] };
    }

    const limit = options.limit || 5;
    const includeAugments = options.includeAugments !== false;
    const includeTraits = options.includeTraits !== false;

    const results = {
      augments: [],
      traits: []
    };

    if (includeAugments) {
      results.augments = this.augmentsManager.searchAugments(query, limit);
    }

    if (includeTraits) {
      results.traits = this.traitsManager.searchTraits(query, limit);
    }

    return results;
  }

  /**
   * Example: Get recommendations based on current game state
   */
  getGameplayRecommendations(currentAugments, currentTraits, gameStage) {
    if (!this.isInitialized) {
      return { augmentSuggestions: [], traitSuggestions: [] };
    }

    const recommendations = {
      augmentSuggestions: [],
      traitSuggestions: []
    };

    // Analyze current augment synergies
    const augmentTypes = currentAugments.map(key => {
      const augment = this.augmentsManager.getAugment(key);
      return augment ? augment.tier : null;
    }).filter(Boolean);

    // Suggest complementary augments
    if (gameStage === 'early' && augmentTypes.includes('Silver')) {
      recommendations.augmentSuggestions = this.augmentsManager.getAugmentsByTier('Gold')
        .slice(0, 3)
        .map(aug => ({
          augment: aug,
          reason: 'Upgrade from Silver to Gold tier',
          priority: 'medium'
        }));
    }

    // Analyze trait completion opportunities
    Object.entries(currentTraits).forEach(([traitKey, count]) => {
      const trait = this.traitsManager.getTrait(traitKey);
      if (trait) {
        const progress = this.traitsManager.getActivationProgress(traitKey, count);
        if (!progress.isMaxed && progress.needed <= 2) {
          recommendations.traitSuggestions.push({
            trait: trait,
            currentCount: count,
            neededCount: progress.needed,
            nextLevel: progress.next,
            reason: `Complete ${trait.name} activation`,
            priority: progress.needed === 1 ? 'high' : 'medium'
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Helper: Get tier color (unified for both augments and traits)
   */
  getTierColor(tier) {
    const colors = {
      'Prismatic': '#E91E63',
      'Gold': '#FFD700', 
      'Silver': '#C0C0C0',
      'Bronze': '#CD7F32'
    };
    return colors[tier] || '#FFFFFF';
  }

  /**
   * Example: Export data for debugging or analysis
   */
  exportDataSummary() {
    if (!this.isInitialized) {
      return null;
    }

    return {
      augments: this.augmentsManager.getStats(),
      traits: this.traitsManager.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// Example usage in content script:
/*
async function initializeTFTExtension() {
  const tftData = new TFTDataExample();
  
  // Initialize data
  const initialized = await tftData.initialize();
  if (!initialized) {
    console.error('Failed to initialize TFT data');
    return;
  }

  // Example: Analyze detected augments
  const detectedAugments = ['TFT_Augment_AxiomArc3', 'TFT_Augment_ComponentGrabBag3'];
  const augmentAnalysis = tftData.analyzeDetectedAugments(detectedAugments);
  console.log('Detected augments:', augmentAnalysis);

  // Example: Analyze team composition
  const teamChampions = [
    { name: 'Jinx', traits: ['TFT14_Marksman', 'TFT14_AnimaSquad'] },
    { name: 'Vi', traits: ['TFT14_Bruiser', 'TFT14_AnimaSquad'] },
    // ... more champions
  ];
  const teamAnalysis = tftData.analyzeTeamComposition(teamChampions);
  console.log('Team analysis:', teamAnalysis);

  // Example: Search functionality
  const searchResults = tftData.searchGameElements('bruiser');
  console.log('Search results:', searchResults);
}
*/

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TFTDataExample;
} 