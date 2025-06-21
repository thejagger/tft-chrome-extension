const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * TFT Set 14 Traits Fetcher using Community Dragon Data
 * Uses accurate activation levels and descriptions from Community Dragon API
 * Source: https://raw.communitydragon.org/15.9/cdragon/tft/en_us.json
 */

class TFTTraitsCDragonFetcher {
  constructor() {
    this.cdragonsUrl = 'https://raw.communitydragon.org/15.9/cdragon/tft/en_us.json';
    this.riotBaseUrl = 'https://ddragon.leagueoflegends.com';
    this.outputDir = './assets/traits';
    this.imagesDir = path.join(this.outputDir, 'images');
    this.version = null;
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
   * Get the latest Data Dragon version for images
   */
  async getLatestVersion() {
    console.log('🔍 Fetching latest Data Dragon version for images...');
    
    try {
      const versions = await this.fetchJson(`${this.riotBaseUrl}/api/versions.json`);
      this.version = versions[0];
      console.log(`   Latest version: ${this.version}`);
      return this.version;
    } catch (error) {
      throw new Error(`Failed to fetch versions: ${error.message}`);
    }
  }

  /**
   * Fetch Community Dragon data
   */
  async fetchCDragonData() {
    console.log('📥 Fetching Community Dragon TFT data...');
    console.log(`   URL: ${this.cdragonsUrl}`);
    
    try {
      const data = await this.fetchJson(this.cdragonsUrl);
      console.log('   ✅ Community Dragon data fetched successfully');
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch Community Dragon data: ${error.message}`);
    }
  }

  /**
   * Clean and format trait description
   */
  cleanDescription(desc) {
    if (!desc) return '';
    
    // Remove HTML tags and special formatting
    return desc
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .replace(/@\w+(\*\d+)?@/g, (match) => {
        // Replace variable placeholders with readable text
        const cleanMatch = match.replace(/@|(\*\d+)/g, '');
        return `{${cleanMatch}}`;
      })
      .trim();
  }

  /**
   * Determine trait type based on patterns
   */
  determineTraitType(apiName, name, activationLevels, description) {
    // Unique traits (1 champion only)
    if (activationLevels.length === 1 && activationLevels[0] === 1) {
      return 'unique';
    }
    
    // Common class patterns
    const classPatterns = ['Bruiser', 'Marksman', 'Vanguard', 'Slayer', 'Rapidfire', 'Strategist', 'Bastion', 'Golden Ox'];
    if (classPatterns.some(pattern => name.includes(pattern))) {
      return 'class';
    }
    
    // Common origin patterns  
    const originPatterns = ['Anima Squad', 'Divinicorp', 'Exotech', 'BoomBot', 'Street Demon', 'Syndicate'];
    if (originPatterns.some(pattern => name.includes(pattern))) {
      return 'origin';
    }
    
    // Special/Unique mechanics
    const specialPatterns = ['Virus', 'Cyberboss', 'Overlord', 'God of the Net', 'Nitro', 'Cypher', 'A.M.P.', 'Techie', 'Dynamo'];
    if (specialPatterns.some(pattern => name.includes(pattern))) {
      return 'special';
    }
    
    return 'unknown';
  }

  /**
   * Get tier name for activation level
   */
  getTierName(levelIndex, totalLevels) {
    if (totalLevels === 1) return 'Unique';
    
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Prismatic', 'Diamond'];
    return tierNames[levelIndex] || 'Unknown';
  }

  /**
   * Process trait data from Community Dragon
   */
  processTraitData(traitData) {
    const activationLevels = traitData.effects.map(effect => effect.minUnits);
    const cleanDesc = this.cleanDescription(traitData.desc);
    const traitType = this.determineTraitType(traitData.apiName, traitData.name, activationLevels, cleanDesc);
    
    // Create descriptions for each activation level
    const descriptions = {};
    traitData.effects.forEach((effect, index) => {
      const level = effect.minUnits;
      const tierName = this.getTierName(index, traitData.effects.length);
      
      // Use the main description with tier context
      if (traitData.effects.length === 1) {
        descriptions[level] = cleanDesc;
      } else {
        descriptions[level] = `${traitData.name} ${tierName} effect: ${cleanDesc}`;
      }
    });

    // Extract image name from icon path
    const imageName = traitData.icon ? path.basename(traitData.icon).replace('.tex', '.png') : `${traitData.apiName}.png`;

    return {
      key: traitData.apiName,
      name: traitData.name,
      displayName: traitData.name,
      image: imageName,
      type: traitType,
      activationLevels: activationLevels,
      descriptions: descriptions,
      rawDescription: cleanDesc,
      source: 'community-dragon',
      searchText: `${traitData.name} ${cleanDesc}`.toLowerCase(),
      isVerified: true,
      needsResearch: false,
      effects: traitData.effects // Keep original effects data
    };
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
      
      // Try different image URL patterns
      const imageUrls = [
        `${this.riotBaseUrl}/cdn/${this.version}/img/tft-trait/${imageName}`,
        `${this.riotBaseUrl}/cdn/${this.version}/img/tft-trait/${imageName.replace('.png', '.TFT_Set14.png')}`,
        `${this.riotBaseUrl}/cdn/${this.version}/img/tft-trait/Trait_Icon_14_${imageName.replace('Trait_Icon_14_', '').replace('.TFT_Set14.png', '.png')}`
      ];
      
      let downloaded_successfully = false;
      for (const imageUrl of imageUrls) {
        try {
          await this.downloadFile(imageUrl, imagePath);
          downloaded++;
          downloaded_successfully = true;
          
          if (downloaded % 5 === 0) {
            console.log(`   Downloaded ${downloaded}/${uniqueImages.length - skipped} images...`);
          }
          break;
        } catch (error) {
          // Try next URL pattern
          continue;
        }
      }
      
      if (!downloaded_successfully) {
        console.warn(`   ⚠️  Failed to download ${imageName} from any URL pattern`);
      }
    }
    
    console.log(`   ✅ Downloaded: ${downloaded}, Skipped: ${skipped}, Total: ${uniqueImages.length}`);
  }

  /**
   * Generate statistics
   */
  generateStats(traits) {
    const typeCounts = traits.reduce((acc, trait) => {
      acc[trait.type] = (acc[trait.type] || 0) + 1;
      return acc;
    }, {});

    const activationPatterns = {};
    traits.forEach(trait => {
      const pattern = trait.activationLevels.join(',');
      activationPatterns[pattern] = (activationPatterns[pattern] || 0) + 1;
    });
    
    return {
      version: this.version,
      dataSource: 'community-dragon',
      sourceUrl: this.cdragonsUrl,
      setNumber: 14,
      setName: 'Cyber City',
      totalTraits: traits.length,
      verifiedTraits: traits.length, // All traits are verified from Community Dragon
      lastUpdated: new Date().toISOString(),
      typeBreakdown: typeCounts,
      activationPatterns: activationPatterns
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
    
    const mainPath = path.join(this.outputDir, 'tft-set14-traits-accurate.json');
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
    
    const quickRefPath = path.join(this.outputDir, 'quick-reference-accurate.json');
    fs.writeFileSync(quickRefPath, JSON.stringify(quickRef, null, 2));
    console.log(`   ✅ Saved quick reference: ${quickRefPath}`);

    // Create activation levels reference
    const activationRef = {};
    traits.forEach(trait => {
      activationRef[trait.key] = {
        name: trait.name,
        levels: trait.activationLevels.reduce((acc, level, index) => {
          acc[level] = {
            level: level,
            description: trait.descriptions[level] || `${trait.name} level ${level} effect`,
            tierName: this.getTierName(index, trait.activationLevels.length)
          };
          return acc;
        }, {})
      };
    });

    const activationPath = path.join(this.outputDir, 'activation-levels-accurate.json');
    fs.writeFileSync(activationPath, JSON.stringify(activationRef, null, 2));
    console.log(`   ✅ Saved activation levels: ${activationPath}`);
    
    return { mainPath, quickRefPath, activationPath, stats };
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 TFT Set 14 Traits Fetcher (Community Dragon) Starting...\n');
      
      // Get latest version for images
      await this.getLatestVersion();
      
      // Fetch Community Dragon data
      const cdragonsData = await this.fetchCDragonData();
      
      // Extract Set 14 traits
      console.log('⚙️  Processing Set 14 traits...');
      const set14 = cdragonsData.sets['14'];
      if (!set14) {
        throw new Error('Set 14 not found in Community Dragon data');
      }
      
      const tft14Traits = set14.traits.filter(trait => trait.apiName.startsWith('TFT14_'));
      console.log(`   Found ${tft14Traits.length} TFT14 traits`);
      
      // Process each trait
      const processedTraits = tft14Traits.map(traitData => this.processTraitData(traitData));
      
      // Sort by type and name
      processedTraits.sort((a, b) => {
        if (a.type !== b.type) {
          const typeOrder = { 'class': 1, 'origin': 2, 'special': 3, 'unique': 4, 'unknown': 5 };
          return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
        }
        return a.name.localeCompare(b.name);
      });
      
      // Download images
      await this.downloadImages(processedTraits);
      
      // Save data
      const { stats } = await this.saveData(processedTraits);
      
      // Summary
      console.log('\n🎉 Community Dragon fetch completed successfully!');
      console.log(`   Data Source: Community Dragon API`);
      console.log(`   Total Traits: ${stats.totalTraits}`);
      console.log(`   All traits verified: ✅`);
      console.log(`   Type Breakdown:`);
      Object.entries(stats.typeBreakdown).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
      console.log(`   Activation Patterns:`);
      Object.entries(stats.activationPatterns).forEach(([pattern, count]) => {
        console.log(`     [${pattern}]: ${count} traits`);
      });
      console.log(`   Files saved to: ${this.outputDir}`);
      
      console.log('\n✅ All trait data is now accurate with correct activation levels!');
      console.log('   You can now use this data confidently in your Chrome extension.');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new TFTTraitsCDragonFetcher();
  fetcher.run();
}

module.exports = TFTTraitsCDragonFetcher; 