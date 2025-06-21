const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DATA_DRAGON_VERSION = '15.12.1';
const AUGMENTS_URL = `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/en_US/tft-augments.json`;
const IMAGES_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/img/tft-augment/`;

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
      fs.unlinkSync(destination); // Delete the file if download failed
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

// Filter for Set 14 augments (TFT Set 14 uses TFT13_ prefix in current data)
function isSet14Augment(augmentId) {
  // TFT Set 14 augments typically have TFT13_ prefix in the current data
  // Also include general augments that are available in Set 14
  const set14Prefixes = [
    'TFT13_',           // Set 14 specific augments
    'TFT_Augment_',     // General augments available in Set 14
    'TFTTutorial_'      // Tutorial augments that might be in Set 14
  ];
  
  return set14Prefixes.some(prefix => augmentId.startsWith(prefix));
}

// Extract augment data
function extractAugmentData(augmentsData) {
  const augments = [];
  
  // Process augments data
  if (augmentsData.data) {
    Object.entries(augmentsData.data).forEach(([key, augment]) => {
      // Filter for Set 14 augments
      if (isSet14Augment(key)) {
        augments.push({
          key: augment.id || key,
          title: augment.name,
          description: augment.description || 'No description available',
          image: augment.image ? augment.image.full : null,
          tier: augment.tier || 'Unknown',
          type: 'augment'
        });
      }
    });
  }
  
  return augments;
}

// Download augment images
async function downloadAugmentImages(augments) {
  console.log(`Downloading ${augments.length} augment images...`);
  
  const downloadPromises = augments.map(async (augment, index) => {
    if (!augment.image) {
      console.log(`Skipping ${augment.title} - no image available`);
      return;
    }
    
    const imageUrl = IMAGES_BASE_URL + augment.image;
    const imagePath = path.join(AUGMENTS_IMAGES_DIR, augment.image);
    
    try {
      await downloadFile(imageUrl, imagePath);
      console.log(`Downloaded: ${augment.image} (${index + 1}/${augments.length})`);
    } catch (error) {
      console.error(`Failed to download ${augment.image}:`, error.message);
    }
  });
  
  await Promise.all(downloadPromises);
  console.log('Finished downloading augment images');
}

// Main function
async function main() {
  try {
    console.log('Starting TFT Set 14 augments fetch...');
    
    // Ensure directories exist
    ensureDirectories();
    
    // Fetch augments data
    console.log('Fetching augments data from Riot Data Dragon...');
    const augmentsData = await fetchJSON(AUGMENTS_URL);
    
    console.log(`Data Dragon version: ${augmentsData.version}`);
    console.log(`Total augments in data: ${Object.keys(augmentsData.data).length}`);
    
    // Extract Set 14 augments
    const augments = extractAugmentData(augmentsData);
    console.log(`Found ${augments.length} Set 14 augments`);
    
    // Save augments data as JSON
    const augmentsFilePath = path.join(AUGMENTS_DIR, 'tft-set14-augments.json');
    fs.writeFileSync(augmentsFilePath, JSON.stringify({
      version: DATA_DRAGON_VERSION,
      setNumber: 14,
      setName: 'Into the Arcane',
      totalAugments: augments.length,
      lastUpdated: new Date().toISOString(),
      augments: augments
    }, null, 2));
    
    console.log(`Saved augments data to: ${augmentsFilePath}`);
    
    // Download images
    await downloadAugmentImages(augments);
    
    // Create a summary
    const summary = {
      totalAugments: augments.length,
      byTier: augments.reduce((acc, aug) => {
        acc[aug.tier] = (acc[aug.tier] || 0) + 1;
        return acc;
      }, {}),
      sampleAugments: augments.slice(0, 5).map(aug => ({
        title: aug.title,
        key: aug.key,
        description: aug.description.substring(0, 100) + '...'
      }))
    };
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Set 14 augments: ${summary.totalAugments}`);
    console.log('Augments by tier:', summary.byTier);
    console.log('\nSample augments:');
    summary.sampleAugments.forEach((aug, i) => {
      console.log(`${i + 1}. ${aug.title} (${aug.key})`);
      console.log(`   ${aug.description}`);
    });
    
    console.log('\n✅ Successfully fetched TFT Set 14 augments data and images!');
    console.log(`📄 Data saved to: ${augmentsFilePath}`);
    console.log(`🖼️  Images saved to: ${AUGMENTS_IMAGES_DIR}`);
    
  } catch (error) {
    console.error('Error fetching augments:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, extractAugmentData, isSet14Augment }; 