const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DATA_DRAGON_VERSION = '15.12.1';
const SOURCES = {
  riotAPI: {
    name: 'Riot Data Dragon API',
    augmentsUrl: `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/en_US/tft-augments.json`,
    imagesBaseUrl: `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/img/tft-augment/`
  },
  // Note: For web scraping, we'd need additional libraries like puppeteer or cheerio
  // This is a placeholder for potential future implementation
  metaTFT: {
    name: 'MetaTFT Website',
    url: 'https://www.metatft.com/augments',
    // This would require web scraping implementation
  }
};

// Output directories
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const AUGMENTS_DIR = path.join(ASSETS_DIR, 'augments');
const AUGMENTS_IMAGES_DIR = path.join(AUGMENTS_DIR, 'images');

// Ensure directories exist
function ensureDirectories() {
  [ASSETS_DIR, AUGMENTS_DIR, AUGMENTS_IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Download file from URL
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        file.close();
        fs.unlinkSync(destination); // Delete the file if download failed
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destination)) {
        fs.unlinkSync(destination); // Delete the file if download failed
      }
      reject(err);
    });
  });
}

// Fetch JSON data from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Filter for Set 14 augments
function isSet14Augment(augmentId) {
  // Current TFT Set 14 augments use TFT13_ prefix in the data
  // Also include general augments that are available in Set 14
  const set14Prefixes = [
    'TFT13_',           // Set 14 specific augments
    'TFT_Augment_',     // General augments available in Set 14
    'TFTTutorial_'      // Tutorial augments
  ];
  
  // Exclude older set augments
  const excludePrefixes = [
    'TFT6_',   // Set 6
    'TFT7_',   // Set 7
    'TFT8_',   // Set 8
    'TFT9_',   // Set 9
    'TFT10_',  // Set 10
    'TFT11_',  // Set 11
    'TFT12_'   // Set 12
  ];
  
  // Check if it matches Set 14 prefixes and doesn't match excluded prefixes
  const matchesSet14 = set14Prefixes.some(prefix => augmentId.startsWith(prefix));
  const isExcluded = excludePrefixes.some(prefix => augmentId.startsWith(prefix));
  
  return matchesSet14 && !isExcluded;
}

// Extract augment data from Riot API
function extractRiotAugmentData(augmentsData) {
  const augments = [];
  
  if (augmentsData.data) {
    Object.entries(augmentsData.data).forEach(([key, augment]) => {
      if (isSet14Augment(key)) {
        augments.push({
          key: augment.id || key,
          title: augment.name,
          description: augment.description || 'No description available',
          image: augment.image ? augment.image.full : null,
          tier: determineTier(augment.name, key),
          type: 'augment',
          source: 'riot-api'
        });
      }
    });
  }
  
  return augments;
}

// Determine augment tier based on naming conventions
function determineTier(name, key) {
  // Prismatic (highest tier) - usually have III in the image name or specific keywords
  if (name.includes('III') || name.includes('Crown') || name.includes('Prismatic') || 
      key.includes('Crown') || key.includes('Prismatic')) {
    return 'Prismatic';
  }
  
  // Gold tier - usually have II in the image name or specific keywords
  if (name.includes('II') || name.includes('+') || key.includes('Plus')) {
    return 'Gold';
  }
  
  // Silver tier - usually have I or no suffix
  if (name.includes('I') || (!name.includes('II') && !name.includes('III'))) {
    return 'Silver';
  }
  
  return 'Unknown';
}

// Download augment images with retry logic
async function downloadAugmentImages(augments) {
  console.log(`Downloading ${augments.length} augment images...`);
  
  const downloadPromises = augments.map(async (augment, index) => {
    if (!augment.image) {
      console.log(`Skipping ${augment.title} - no image available`);
      return;
    }
    
    const imageUrl = SOURCES.riotAPI.imagesBaseUrl + augment.image;
    const imagePath = path.join(AUGMENTS_IMAGES_DIR, augment.image);
    
    // Skip if image already exists
    if (fs.existsSync(imagePath)) {
      console.log(`Skipping ${augment.image} - already exists (${index + 1}/${augments.length})`);
      return;
    }
    
    try {
      await downloadFile(imageUrl, imagePath);
      console.log(`Downloaded: ${augment.image} (${index + 1}/${augments.length})`);
    } catch (error) {
      console.error(`Failed to download ${augment.image}:`, error.message);
      
      // Try alternative image formats or fallbacks
      const altImageName = augment.image.replace('.png', '.jpg');
      if (altImageName !== augment.image) {
        try {
          const altImageUrl = SOURCES.riotAPI.imagesBaseUrl + altImageName;
          const altImagePath = path.join(AUGMENTS_IMAGES_DIR, altImageName);
          await downloadFile(altImageUrl, altImagePath);
          console.log(`Downloaded alternative: ${altImageName}`);
          augment.image = altImageName; // Update the image reference
        } catch (altError) {
          console.error(`Failed to download alternative image for ${augment.title}`);
        }
      }
    }
  });
  
  await Promise.all(downloadPromises);
  console.log('Finished downloading augment images');
}

// Fetch augments from Riot API
async function fetchFromRiotAPI() {
  console.log('Fetching from Riot Data Dragon API...');
  
  try {
    const augmentsData = await fetchJSON(SOURCES.riotAPI.augmentsUrl);
    console.log(`Data Dragon version: ${augmentsData.version}`);
    console.log(`Total augments in data: ${Object.keys(augmentsData.data || {}).length}`);
    
    const augments = extractRiotAugmentData(augmentsData);
    console.log(`Found ${augments.length} Set 14 augments from Riot API`);
    
    return {
      success: true,
      augments,
      source: 'riot-api',
      version: augmentsData.version
    };
  } catch (error) {
    console.error('Failed to fetch from Riot API:', error.message);
    return {
      success: false,
      error: error.message,
      source: 'riot-api'
    };
  }
}

// Create enhanced augment data with additional metadata
function enhanceAugmentData(augments) {
  return augments.map(augment => ({
    ...augment,
    // Add searchable text for better filtering
    searchText: `${augment.title} ${augment.description}`.toLowerCase(),
    // Add tier priority for sorting
    tierPriority: getTierPriority(augment.tier),
    // Add estimated power level based on tier and keywords
    powerLevel: estimatePowerLevel(augment.title, augment.description, augment.tier)
  }));
}

function getTierPriority(tier) {
  const tierMap = {
    'Prismatic': 3,
    'Gold': 2,
    'Silver': 1,
    'Unknown': 0
  };
  return tierMap[tier] || 0;
}

function estimatePowerLevel(title, description, tier) {
  let power = getTierPriority(tier) * 10;
  
  // Add power based on keywords that typically indicate strong augments
  const powerKeywords = [
    'radiant', 'prismatic', 'crown', 'forge', 'golden', 'legendary',
    'double', 'triple', 'max', 'ultimate', 'enhanced', 'upgraded'
  ];
  
  const text = `${title} ${description}`.toLowerCase();
  powerKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      power += 5;
    }
  });
  
  return Math.min(power, 50); // Cap at 50
}

// Main function
async function main() {
  try {
    console.log('Starting comprehensive TFT Set 14 augments fetch...');
    
    // Ensure directories exist
    ensureDirectories();
    
    // Try to fetch from Riot API first
    const riotResult = await fetchFromRiotAPI();
    
    let augments = [];
    let dataSource = 'unknown';
    let version = DATA_DRAGON_VERSION;
    
    if (riotResult.success) {
      augments = riotResult.augments;
      dataSource = riotResult.source;
      version = riotResult.version;
    } else {
      console.log('⚠️  Riot API failed, you could implement web scraping as a fallback');
      console.log('For now, using empty dataset. Consider implementing MetaTFT scraping.');
      augments = [];
    }
    
    if (augments.length === 0) {
      console.log('❌ No augments found. Please check the data sources.');
      return;
    }
    
    // Enhance augment data
    const enhancedAugments = enhanceAugmentData(augments);
    
    // Sort augments by tier and name
    enhancedAugments.sort((a, b) => {
      if (a.tierPriority !== b.tierPriority) {
        return b.tierPriority - a.tierPriority; // Higher tier first
      }
      return a.title.localeCompare(b.title); // Alphabetical within tier
    });
    
    // Save augments data as JSON
    const augmentsFilePath = path.join(AUGMENTS_DIR, 'tft-set14-augments.json');
    const outputData = {
      version: version,
      dataSource: dataSource,
      setNumber: 14,
      setName: 'Into the Arcane',
      totalAugments: enhancedAugments.length,
      lastUpdated: new Date().toISOString(),
      tierBreakdown: enhancedAugments.reduce((acc, aug) => {
        acc[aug.tier] = (acc[aug.tier] || 0) + 1;
        return acc;
      }, {}),
      augments: enhancedAugments
    };
    
    fs.writeFileSync(augmentsFilePath, JSON.stringify(outputData, null, 2));
    console.log(`Saved augments data to: ${augmentsFilePath}`);
    
    // Download images
    await downloadAugmentImages(enhancedAugments);
    
    // Create a summary
    const summary = {
      totalAugments: enhancedAugments.length,
      byTier: outputData.tierBreakdown,
      topAugments: enhancedAugments
        .filter(aug => aug.tierPriority >= 2) // Gold and Prismatic only
        .slice(0, 10)
        .map(aug => ({
          title: aug.title,
          tier: aug.tier,
          powerLevel: aug.powerLevel,
          description: aug.description.substring(0, 80) + '...'
        }))
    };
    
    console.log('\n=== COMPREHENSIVE SUMMARY ===');
    console.log(`Data Source: ${dataSource}`);
    console.log(`Total Set 14 augments: ${summary.totalAugments}`);
    console.log('Augments by tier:', summary.byTier);
    console.log('\nTop tier augments:');
    summary.topAugments.forEach((aug, i) => {
      console.log(`${i + 1}. [${aug.tier}] ${aug.title} (Power: ${aug.powerLevel})`);
      console.log(`   ${aug.description}`);
    });
    
    // Create a quick reference file
    const quickRefPath = path.join(AUGMENTS_DIR, 'augments-quick-reference.json');
    const quickRef = enhancedAugments.map(aug => ({
      key: aug.key,
      title: aug.title,
      tier: aug.tier,
      image: aug.image
    }));
    fs.writeFileSync(quickRefPath, JSON.stringify(quickRef, null, 2));
    
    console.log('\n✅ Successfully fetched TFT Set 14 augments data and images!');
    console.log(`📄 Full data: ${augmentsFilePath}`);
    console.log(`📋 Quick reference: ${quickRefPath}`);
    console.log(`🖼️  Images: ${AUGMENTS_IMAGES_DIR}`);
    console.log(`📊 Total files: ${enhancedAugments.filter(a => a.image).length} images + 2 JSON files`);
    
  } catch (error) {
    console.error('Error in comprehensive fetch:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { 
  main, 
  extractRiotAugmentData, 
  isSet14Augment, 
  enhanceAugmentData,
  fetchFromRiotAPI 
}; 