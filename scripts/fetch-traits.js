const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * TFT Set 14 Traits Fetcher
 * Fetches basic trait data from Riot Data Dragon API and creates structure
 * for enhancement with activation levels and detailed descriptions
 */

class TFTTraitsFetcher {
  constructor() {
    this.baseUrl = 'https://ddragon.leagueoflegends.com';
    this.outputDir = './assets/traits';
    this.imagesDir = path.join(this.outputDir, 'images');
    this.version = null;
    
    // Set 14 specific filters
    this.set14Filters = [
      'TFT14_',      // Set 14 traits
      'TFT13_',      // Some traits might carry over
    ];
    
    // Exclude older sets and tutorial traits
    this.excludeFilters = [
      'TFT6_', 'TFT7_', 'TFT8_', 'TFT9_', 'TFT10_', 'TFT11_', 'TFT12_',
      'TFTTutorial_'
    ];

    // Known Set 14 trait information (to be enhanced with community data)
    this.traitEnhancements = {
      'TFT14_Immortal': {
        displayName: 'Immortal',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Immortals gain 15% Damage Reduction',
          4: 'Immortals gain 30% Damage Reduction',
          6: 'Immortals gain 45% Damage Reduction'
        }
      },
      'TFT14_Bruiser': {
        displayName: 'Bruiser',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Bruisers gain 15% max Health',
          4: 'Bruisers gain 35% max Health',
          6: 'Bruisers gain 55% max Health'
        }
      },
      'TFT14_Vanguard': {
        displayName: 'Vanguard',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Vanguards gain 20 Armor and Magic Resist',
          4: 'Vanguards gain 45 Armor and Magic Resist',
          6: 'Vanguards gain 80 Armor and Magic Resist'
        }
      },
      'TFT14_Marksman': {
        displayName: 'Marksman',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Marksmen gain 10% Attack Speed and 5% Damage Amp',
          4: 'Marksmen gain 25% Attack Speed and 15% Damage Amp',
          6: 'Marksmen gain 45% Attack Speed and 30% Damage Amp'
        }
      },
      'TFT14_Controller': {
        displayName: 'Controller',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Controllers gain 15 Ability Power and 15 Mana',
          4: 'Controllers gain 30 Ability Power and 30 Mana',
          6: 'Controllers gain 50 Ability Power and 50 Mana'
        }
      },
      'TFT14_Swift': {
        displayName: 'Swift',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Swift units gain 15% Attack Speed',
          4: 'Swift units gain 30% Attack Speed',
          6: 'Swift units gain 50% Attack Speed'
        }
      },
      // Origin traits
      'TFT14_AnimaSquad': {
        displayName: 'Anima Squad',
        type: 'origin',
        activationLevels: [3, 5, 7],
        descriptions: {
          3: 'Anima Squad units gain 200 Health and 20% Attack Speed',
          5: 'Anima Squad units gain 350 Health and 35% Attack Speed',
          7: 'Anima Squad units gain 500 Health and 55% Attack Speed'
        }
      },
      'TFT14_Divinicorp': {
        displayName: 'Divinicorp',
        type: 'origin',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Divinicorp units gain 15% Damage Amp',
          4: 'Divinicorp units gain 30% Damage Amp',
          6: 'Divinicorp units gain 50% Damage Amp'
        }
      },
      'TFT14_EdgeRunner': {
        displayName: 'Edge Runner',
        type: 'origin',
        activationLevels: [2, 4, 6, 8],
        descriptions: {
          2: 'Edge Runners gain 15% Attack Speed and Move Speed',
          4: 'Edge Runners gain 30% Attack Speed and Move Speed',
          6: 'Edge Runners gain 50% Attack Speed and Move Speed',
          8: 'Edge Runners gain 75% Attack Speed and Move Speed'
        }
      },
      'TFT14_BallisTek': {
        displayName: 'BallisTek',
        type: 'origin',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'BallisTek units gain 15% Damage Amp',
          4: 'BallisTek units gain 30% Damage Amp',
          6: 'BallisTek units gain 50% Damage Amp'
        }
      }
    };
  }

  /**
   * Download file from URL with retry logic
   */
  async downloadFile(url, filepath, retries = 3) {
    return new Promise((resolve, reject) => {
      const attempt = (retriesLeft) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          } else if (response.statusCode === 404 && retriesLeft > 0) {
            console.log(`   Retrying download (${retriesLeft} attempts left): ${path.basename(filepath)}`);
            setTimeout(() => attempt(retriesLeft - 1), 1000);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${url}`));
          }
        }).on('error', (err) => {
          if (retriesLeft > 0) {
            console.log(`   Retrying download due to error (${retriesLeft} attempts left): ${err.message}`);
            setTimeout(() => attempt(retriesLeft - 1), 1000);
          } else {
            reject(err);
          }
        });
      };
      
      attempt(retries);
    });
  }

  /**
   * Fetch JSON data from URL
   */
  async fetchJson(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Get the latest Data Dragon version
   */
  async getLatestVersion() {
    console.log('🔍 Fetching latest Data Dragon version...');
    
    try {
      const versions = await this.fetchJson(`${this.baseUrl}/api/versions.json`);
      this.version = versions[0];
      console.log(`   Latest version: ${this.version}`);
      return this.version;
    } catch (error) {
      throw new Error(`Failed to fetch versions: ${error.message}`);
    }
  }

  /**
   * Filter traits for Set 14
   */
  filterSet14Traits(traits) {
    return Object.entries(traits).filter(([key, trait]) => {
      // Include if matches any Set 14 filter
      const includeByFilter = this.set14Filters.some(filter => key.startsWith(filter));
      
      // Exclude if matches any exclude filter
      const excludeByFilter = this.excludeFilters.some(filter => key.startsWith(filter));
      
      return includeByFilter && !excludeByFilter;
    });
  }

  /**
   * Enhance trait data with activation levels and descriptions
   */
  enhanceTraitData(key, trait) {
    const enhancement = this.traitEnhancements[key] || {};
    const displayName = enhancement.displayName || trait.name || key.replace('TFT14_', '');
    
    return {
      key: key,
      name: displayName,
      displayName: displayName,
      image: trait.image?.full || `${key}.png`,
      type: enhancement.type || 'unknown',
      activationLevels: enhancement.activationLevels || [2, 4, 6],
      descriptions: enhancement.descriptions || {
        2: `${displayName} units gain bonuses (Bronze level)`,
        4: `${displayName} units gain enhanced bonuses (Silver level)`,
        6: `${displayName} units gain maximum bonuses (Gold level)`
      },
      source: 'riot-api',
      searchText: `${displayName} ${Object.values(enhancement.descriptions || {}).join(' ')}`.toLowerCase(),
      isEnhanced: !!enhancement.displayName
    };
  }

  /**
   * Fetch traits data from Data Dragon
   */
  async fetchTraitsData() {
    console.log('📥 Fetching traits data...');
    
    const url = `${this.baseUrl}/cdn/${this.version}/data/en_US/tft-trait.json`;
    console.log(`   URL: ${url}`);
    
    try {
      const data = await this.fetchJson(url);
      console.log(`   Found ${Object.keys(data.data).length} total traits`);
      
      // Filter for Set 14
      const set14Traits = this.filterSet14Traits(data.data);
      console.log(`   Filtered to ${set14Traits.length} Set 14 traits`);
      
      return set14Traits;
    } catch (error) {
      throw new Error(`Failed to fetch traits data: ${error.message}`);
    }
  }

  /**
   * Download trait images
   */
  async downloadImages(traits) {
    console.log('🖼️  Downloading trait images...');
    
    // Ensure images directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }

    let downloaded = 0;
    let skipped = 0;
    const uniqueImages = [...new Set(traits.map(trait => trait.image))];
    
    console.log(`   Downloading ${uniqueImages.length} unique images...`);
    
    for (const imageName of uniqueImages) {
      const imagePath = path.join(this.imagesDir, imageName);
      
      // Skip if image already exists
      if (fs.existsSync(imagePath)) {
        skipped++;
        continue;
      }
      
      const imageUrl = `${this.baseUrl}/cdn/${this.version}/img/tft-trait/${imageName}`;
      
      try {
        await this.downloadFile(imageUrl, imagePath);
        downloaded++;
        
        if (downloaded % 5 === 0) {
          console.log(`   Downloaded ${downloaded}/${uniqueImages.length - skipped} images...`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to download ${imageName}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Downloaded: ${downloaded}, Skipped: ${skipped}, Total: ${uniqueImages.length}`);
  }

  /**
   * Generate statistics and type breakdown
   */
  generateStats(traits) {
    const typeCounts = traits.reduce((acc, trait) => {
      acc[trait.type] = (acc[trait.type] || 0) + 1;
      return acc;
    }, {});

    const enhancedCount = traits.filter(trait => trait.isEnhanced).length;
    
    return {
      version: this.version,
      dataSource: 'riot-api',
      setNumber: 14,
      setName: 'Cyber City',
      totalTraits: traits.length,
      enhancedTraits: enhancedCount,
      lastUpdated: new Date().toISOString(),
      typeBreakdown: typeCounts
    };
  }

  /**
   * Save traits data to files
   */
  async saveData(traits) {
    console.log('💾 Saving data files...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const stats = this.generateStats(traits);
    
    // Main data file with full information
    const mainData = {
      ...stats,
      traits: traits
    };
    
    const mainPath = path.join(this.outputDir, 'tft-set14-traits.json');
    fs.writeFileSync(mainPath, JSON.stringify(mainData, null, 2));
    console.log(`   ✅ Saved main data: ${mainPath}`);
    
    // Quick reference file with essential data only
    const quickRef = traits.map(trait => ({
      key: trait.key,
      name: trait.name,
      type: trait.type,
      image: trait.image,
      activationLevels: trait.activationLevels
    }));
    
    const quickRefPath = path.join(this.outputDir, 'quick-reference.json');
    fs.writeFileSync(quickRefPath, JSON.stringify(quickRef, null, 2));
    console.log(`   ✅ Saved quick reference: ${quickRefPath}`);

    // Create activation levels reference
    const activationRef = {};
    traits.forEach(trait => {
      activationRef[trait.key] = {
        name: trait.name,
        levels: trait.activationLevels.reduce((acc, level) => {
          acc[level] = {
            level: level,
            description: trait.descriptions[level] || `${trait.name} level ${level} bonus`,
            tierName: this.getLevelTierName(level, trait.activationLevels)
          };
          return acc;
        }, {})
      };
    });

    const activationPath = path.join(this.outputDir, 'activation-levels.json');
    fs.writeFileSync(activationPath, JSON.stringify(activationRef, null, 2));
    console.log(`   ✅ Saved activation levels: ${activationPath}`);
    
    return { mainPath, quickRefPath, activationPath, stats };
  }

  /**
   * Get tier name for activation level
   */
  getLevelTierName(level, allLevels) {
    const index = allLevels.indexOf(level);
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Prismatic', 'Diamond'];
    return tierNames[index] || 'Unknown';
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 TFT Set 14 Traits Fetcher Starting...\n');
      
      // Get latest version
      await this.getLatestVersion();
      
      // Fetch traits data
      const rawTraits = await this.fetchTraitsData();
      
      // Process and enhance data
      console.log('⚙️  Processing traits data...');
      const processedTraits = rawTraits.map(([key, trait]) => 
        this.enhanceTraitData(key, trait)
      );
      
      // Sort by type and name
      processedTraits.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
      });
      
      // Download images
      await this.downloadImages(processedTraits);
      
      // Save data
      const { stats } = await this.saveData(processedTraits);
      
      // Summary
      console.log('\n🎉 Fetch completed successfully!');
      console.log(`   Version: ${stats.version}`);
      console.log(`   Total Traits: ${stats.totalTraits}`);
      console.log(`   Enhanced Traits: ${stats.enhancedTraits}`);
      console.log(`   Type Breakdown:`);
      Object.entries(stats.typeBreakdown).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
      console.log(`   Files saved to: ${this.outputDir}`);
      
      console.log('\n📝 Note: Some traits use placeholder descriptions.');
      console.log('   You can enhance them by updating the traitEnhancements object in the script.');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new TFTTraitsFetcher();
  fetcher.run();
}

module.exports = TFTTraitsFetcher; 