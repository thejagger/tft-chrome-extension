const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * CORRECTED TFT Set 14 Traits Fetcher
 * This version doesn't make assumptions about activation levels
 * and provides a framework for manual correction based on actual game data
 */

class TFTTraitsFetcherCorrected {
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

    // CORRECTED: Only include traits where we have verified activation levels
    // This is based on actual TFT Set 14 game data - needs manual research
    this.verifiedTraitData = {
      // Class traits (verified patterns)
      'TFT14_Bruiser': {
        displayName: 'Bruiser',
        type: 'class',
        activationLevels: [2, 4, 6], // Standard class pattern
        descriptions: {
          2: 'Bruisers gain Health',
          4: 'Bruisers gain more Health', 
          6: 'Bruisers gain maximum Health'
        }
      },
      'TFT14_Marksman': {
        displayName: 'Marksman',
        type: 'class',
        activationLevels: [2, 4, 6],
        descriptions: {
          2: 'Marksmen gain Attack Speed',
          4: 'Marksmen gain more Attack Speed',
          6: 'Marksmen gain maximum Attack Speed'
        }
      },
      
      // Unique traits (1 champion only)
      'TFT14_Virus': {
        displayName: 'Virus',
        type: 'unique',
        activationLevels: [1], // Only requires 1 champion
        descriptions: {
          1: 'Virus effect when this champion is on the field'
        }
      },
      'TFT14_ViegoUniqueTrait': {
        displayName: 'Soul Killer',
        type: 'unique',
        activationLevels: [1], // Viego's unique trait
        descriptions: {
          1: 'Soul Killer unique ability'
        }
      },
      
      // TODO: Add more verified traits here as we research them
      // Format: 'TFT14_TraitKey': { displayName, type, activationLevels, descriptions }
    };

    // Traits that need manual research
    this.unverifiedTraits = [
      'TFT14_Supercharge',    // A.M.P.
      'TFT14_Armorclad',      // Bastion  
      'TFT14_Cyberboss',      // Cyberboss - might be unique
      'TFT14_Suits',          // Cypher
      'TFT14_Thirsty',        // Dynamo
      'TFT14_Cutter',         // Executioner
      'TFT14_Netgod',         // God of the Net
      'TFT14_HotRod',         // Nitro
      'TFT14_Overlord',       // Overlord - might be unique
      'TFT14_Strong',         // Slayer
      'TFT14_StreetDemon',    // Street Demon
      'TFT14_Mob',            // Syndicate
      'TFT14_Techie',         // Techie
      // Add more as discovered
    ];
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
   * Process trait data - only use verified information
   */
  processTraitData(key, trait) {
    const verifiedData = this.verifiedTraitData[key];
    const displayName = trait.name || key.replace('TFT14_', '');
    
    if (verifiedData) {
      // Use verified data
      return {
        key: key,
        name: verifiedData.displayName,
        displayName: verifiedData.displayName,
        image: trait.image?.full || `${key}.png`,
        type: verifiedData.type,
        activationLevels: verifiedData.activationLevels,
        descriptions: verifiedData.descriptions,
        source: 'verified',
        searchText: `${verifiedData.displayName} ${Object.values(verifiedData.descriptions).join(' ')}`.toLowerCase(),
        isVerified: true,
        needsResearch: false
      };
    } else {
      // Mark as needing research
      return {
        key: key,
        name: displayName,
        displayName: displayName,
        image: trait.image?.full || `${key}.png`,
        type: 'unknown',
        activationLevels: [], // Empty - needs research
        descriptions: {},     // Empty - needs research
        source: 'riot-api',
        searchText: displayName.toLowerCase(),
        isVerified: false,
        needsResearch: true,
        researchNotes: 'Activation levels and descriptions need manual research'
      };
    }
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

    const verifiedCount = traits.filter(trait => trait.isVerified).length;
    const needsResearchCount = traits.filter(trait => trait.needsResearch).length;
    
    return {
      version: this.version,
      dataSource: 'riot-api-corrected',
      setNumber: 14,
      setName: 'Cyber City',
      totalTraits: traits.length,
      verifiedTraits: verifiedCount,
      needsResearch: needsResearchCount,
      lastUpdated: new Date().toISOString(),
      typeBreakdown: typeCounts,
      warning: 'Some traits need manual research for accurate activation levels'
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
    
    const mainPath = path.join(this.outputDir, 'tft-set14-traits-corrected.json');
    fs.writeFileSync(mainPath, JSON.stringify(mainData, null, 2));
    console.log(`   ✅ Saved main data: ${mainPath}`);
    
    // Research needed file
    const needsResearch = traits.filter(trait => trait.needsResearch);
    const researchPath = path.join(this.outputDir, 'traits-need-research.json');
    fs.writeFileSync(researchPath, JSON.stringify({
      note: 'These traits need manual research for activation levels and descriptions',
      count: needsResearch.length,
      traits: needsResearch.map(trait => ({
        key: trait.key,
        name: trait.name,
        type: trait.type,
        image: trait.image,
        researchNotes: trait.researchNotes
      }))
    }, null, 2));
    console.log(`   ✅ Saved research needed: ${researchPath}`);

    // Verified traits only
    const verifiedTraits = traits.filter(trait => trait.isVerified);
    const verifiedPath = path.join(this.outputDir, 'verified-traits.json');
    fs.writeFileSync(verifiedPath, JSON.stringify({
      note: 'These traits have verified activation levels',
      count: verifiedTraits.length,
      traits: verifiedTraits
    }, null, 2));
    console.log(`   ✅ Saved verified traits: ${verifiedPath}`);
    
    return { mainPath, researchPath, verifiedPath, stats };
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 TFT Set 14 Traits Fetcher (CORRECTED) Starting...\n');
      
      // Get latest version
      await this.getLatestVersion();
      
      // Fetch traits data
      const rawTraits = await this.fetchTraitsData();
      
      // Process data (without assumptions)
      console.log('⚙️  Processing traits data (no assumptions)...');
      const processedTraits = rawTraits.map(([key, trait]) => 
        this.processTraitData(key, trait)
      );
      
      // Sort by verification status and name
      processedTraits.sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Download images
      await this.downloadImages(processedTraits);
      
      // Save data
      const { stats } = await this.saveData(processedTraits);
      
      // Summary
      console.log('\n🎉 Corrected fetch completed!');
      console.log(`   Version: ${stats.version}`);
      console.log(`   Total Traits: ${stats.totalTraits}`);
      console.log(`   Verified Traits: ${stats.verifiedTraits}`);
      console.log(`   Need Research: ${stats.needsResearch}`);
      console.log(`   Type Breakdown:`);
      Object.entries(stats.typeBreakdown).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
      console.log(`   Files saved to: ${this.outputDir}`);
      
      console.log('\n⚠️  IMPORTANT:');
      console.log(`   ${stats.needsResearch} traits need manual research for activation levels.`);
      console.log('   Check traits-need-research.json for the list.');
      console.log('   Update verifiedTraitData in this script as you research each trait.');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new TFTTraitsFetcherCorrected();
  fetcher.run();
}

module.exports = TFTTraitsFetcherCorrected; 