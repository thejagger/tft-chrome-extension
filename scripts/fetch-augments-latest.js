const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * Comprehensive TFT Set 14 Augments Fetcher
 * Uses official Riot Data Dragon API to fetch the latest augments data and images
 * Updated for latest API endpoints and enhanced filtering
 */

class TFTAugmentsFetcher {
  constructor() {
    this.baseUrl = 'https://ddragon.leagueoflegends.com';
    this.outputDir = './assets/augments';
    this.imagesDir = path.join(this.outputDir, 'images');
    this.version = null;
    
    // Set 14 specific filters - updated for latest patterns
    this.set14Filters = [
      'TFT13_',      // Set 13/14 augments (Riot's naming is inconsistent)
      'TFT_Augment_', // Generic TFT augments
      'TFTTutorial_', // Tutorial augments
      'TFT14_',      // Explicit Set 14 augments if they exist
    ];
    
    // Exclude older sets
    this.excludeFilters = [
      'TFT6_', 'TFT7_', 'TFT8_', 'TFT9_', 'TFT10_', 'TFT11_', 'TFT12_'
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
   * Determine augment tier based on naming conventions and data
   */
  determineTier(augment) {
    const key = augment.id || augment.key;
    const name = augment.name || augment.title || '';
    
    // Prismatic tier indicators
    if (key.includes('3') || key.includes('III') || key.includes('Prismatic') ||
        name.includes('III') || name.includes('Prismatic')) {
      return 'Prismatic';
    }
    
    // Gold tier indicators
    if (key.includes('2') || key.includes('Plus') || key.includes('II') ||
        name.includes('II') || name.includes('+')) {
      return 'Gold';
    }
    
    // Default to Silver
    return 'Silver';
  }

  /**
   * Filter augments for Set 14
   */
  filterSet14Augments(augments) {
    return Object.entries(augments).filter(([key, augment]) => {
      // Include if matches any Set 14 filter
      const includeByFilter = this.set14Filters.some(filter => key.startsWith(filter));
      
      // Exclude if matches any exclude filter
      const excludeByFilter = this.excludeFilters.some(filter => key.startsWith(filter));
      
      return includeByFilter && !excludeByFilter;
    });
  }

  /**
   * Enhance augment data with additional metadata
   */
  enhanceAugmentData(key, augment) {
    const tier = this.determineTier(augment);
    const title = augment.name || augment.title || key;
    const description = augment.description || '';
    
    return {
      key: key,
      title: title,
      description: description,
      image: augment.image?.full || `${key}.png`,
      tier: tier,
      type: 'augment',
      source: 'riot-api',
      searchText: `${title} ${description}`.toLowerCase(),
      tierPriority: tier === 'Prismatic' ? 3 : tier === 'Gold' ? 2 : 1,
      powerLevel: this.estimatePowerLevel(tier, description)
    };
  }

  /**
   * Estimate power level based on tier and description keywords
   */
  estimatePowerLevel(tier, description) {
    let basePower = tier === 'Prismatic' ? 30 : tier === 'Gold' ? 20 : 10;
    
    // Boost for powerful keywords
    const powerKeywords = ['gain', 'bonus', 'additional', 'extra', 'more', 'increase'];
    const keywordCount = powerKeywords.filter(keyword => 
      description.toLowerCase().includes(keyword)
    ).length;
    
    return Math.min(basePower + (keywordCount * 5), 50);
  }

  /**
   * Fetch augments data from Data Dragon
   */
  async fetchAugmentsData() {
    console.log('📥 Fetching augments data...');
    
    const url = `${this.baseUrl}/cdn/${this.version}/data/en_US/tft-augments.json`;
    console.log(`   URL: ${url}`);
    
    try {
      const data = await this.fetchJson(url);
      console.log(`   Found ${Object.keys(data.data).length} total augments`);
      
      // Filter for Set 14
      const set14Augments = this.filterSet14Augments(data.data);
      console.log(`   Filtered to ${set14Augments.length} Set 14 augments`);
      
      return set14Augments;
    } catch (error) {
      throw new Error(`Failed to fetch augments data: ${error.message}`);
    }
  }

  /**
   * Download augment images
   */
  async downloadImages(augments) {
    console.log('🖼️  Downloading augment images...');
    
    // Ensure images directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }

    let downloaded = 0;
    let skipped = 0;
    const uniqueImages = [...new Set(augments.map(aug => aug.image))];
    
    console.log(`   Downloading ${uniqueImages.length} unique images...`);
    
    for (const imageName of uniqueImages) {
      const imagePath = path.join(this.imagesDir, imageName);
      
      // Skip if image already exists
      if (fs.existsSync(imagePath)) {
        skipped++;
        continue;
      }
      
      const imageUrl = `${this.baseUrl}/cdn/${this.version}/img/tft-augment/${imageName}`;
      
      try {
        await this.downloadFile(imageUrl, imagePath);
        downloaded++;
        
        if (downloaded % 10 === 0) {
          console.log(`   Downloaded ${downloaded}/${uniqueImages.length - skipped} images...`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to download ${imageName}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Downloaded: ${downloaded}, Skipped: ${skipped}, Total: ${uniqueImages.length}`);
  }

  /**
   * Generate statistics and tier breakdown
   */
  generateStats(augments) {
    const tierCounts = augments.reduce((acc, aug) => {
      acc[aug.tier] = (acc[aug.tier] || 0) + 1;
      return acc;
    }, {});
    
    return {
      version: this.version,
      dataSource: 'riot-api',
      setNumber: 14,
      setName: 'Into the Arcane',
      totalAugments: augments.length,
      lastUpdated: new Date().toISOString(),
      tierBreakdown: tierCounts
    };
  }

  /**
   * Save augments data to files
   */
  async saveData(augments) {
    console.log('💾 Saving data files...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const stats = this.generateStats(augments);
    
    // Main data file with full information
    const mainData = {
      ...stats,
      augments: augments
    };
    
    const mainPath = path.join(this.outputDir, 'tft-set14-augments.json');
    fs.writeFileSync(mainPath, JSON.stringify(mainData, null, 2));
    console.log(`   ✅ Saved main data: ${mainPath}`);
    
    // Quick reference file with essential data only
    const quickRef = augments.map(aug => ({
      key: aug.key,
      title: aug.title,
      tier: aug.tier,
      image: aug.image
    }));
    
    const quickRefPath = path.join(this.outputDir, 'quick-reference.json');
    fs.writeFileSync(quickRefPath, JSON.stringify(quickRef, null, 2));
    console.log(`   ✅ Saved quick reference: ${quickRefPath}`);
    
    return { mainPath, quickRefPath, stats };
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 TFT Set 14 Augments Fetcher Starting...\n');
      
      // Get latest version
      await this.getLatestVersion();
      
      // Fetch augments data
      const rawAugments = await this.fetchAugmentsData();
      
      // Process and enhance data
      console.log('⚙️  Processing augments data...');
      const processedAugments = rawAugments.map(([key, augment]) => 
        this.enhanceAugmentData(key, augment)
      );
      
      // Sort by tier priority and name
      processedAugments.sort((a, b) => {
        if (a.tierPriority !== b.tierPriority) {
          return b.tierPriority - a.tierPriority; // Prismatic first
        }
        return a.title.localeCompare(b.title);
      });
      
      // Download images
      await this.downloadImages(processedAugments);
      
      // Save data
      const { stats } = await this.saveData(processedAugments);
      
      // Summary
      console.log('\n🎉 Fetch completed successfully!');
      console.log(`   Version: ${stats.version}`);
      console.log(`   Total Augments: ${stats.totalAugments}`);
      console.log(`   Tier Breakdown:`);
      Object.entries(stats.tierBreakdown).forEach(([tier, count]) => {
        console.log(`     ${tier}: ${count}`);
      });
      console.log(`   Files saved to: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new TFTAugmentsFetcher();
  fetcher.run();
}

module.exports = TFTAugmentsFetcher; 