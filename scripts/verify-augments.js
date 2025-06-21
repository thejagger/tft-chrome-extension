const fs = require('fs');
const path = require('path');

/**
 * Verification script for TFT Set 14 augments data
 * Checks data completeness, image availability, and provides statistics
 */

const AUGMENTS_FILE = './assets/augments/tft-set14-augments.json';
const IMAGES_DIR = './assets/augments/images';
const QUICK_REF_FILE = './assets/augments/augments-quick-reference.json';

function verifyAugmentsData() {
  console.log('🔍 TFT Set 14 Augments Data Verification\n');

  // Check if files exist
  if (!fs.existsSync(AUGMENTS_FILE)) {
    console.error('❌ Main augments file not found:', AUGMENTS_FILE);
    return;
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('❌ Images directory not found:', IMAGES_DIR);
    return;
  }

  // Load data
  const augmentsData = JSON.parse(fs.readFileSync(AUGMENTS_FILE, 'utf8'));
  const imageFiles = fs.readdirSync(IMAGES_DIR);

  console.log('📊 Data Overview:');
  console.log(`   Version: ${augmentsData.version}`);
  console.log(`   Set: ${augmentsData.setNumber} - ${augmentsData.setName}`);
  console.log(`   Last Updated: ${new Date(augmentsData.lastUpdated).toLocaleDateString()}`);
  console.log(`   Total Augments: ${augmentsData.totalAugments}`);
  console.log(`   Actual Count: ${augmentsData.augments.length}`);
  console.log();

  // Tier breakdown
  console.log('🏆 Tier Breakdown:');
  Object.entries(augmentsData.tierBreakdown).forEach(([tier, count]) => {
    console.log(`   ${tier}: ${count}`);
  });
  console.log();

  // Image verification
  console.log('🖼️  Image Verification:');
  const imageReferences = augmentsData.augments.map(a => a.image);
  const uniqueImages = [...new Set(imageReferences)];
  
  console.log(`   Image files on disk: ${imageFiles.length}`);
  console.log(`   Unique image references: ${uniqueImages.length}`);
  console.log(`   Total image references: ${imageReferences.length}`);
  console.log(`   Shared images: ${imageReferences.length - uniqueImages.length}`);

  // Check for missing images
  const missingImages = uniqueImages.filter(img => !imageFiles.includes(img));
  if (missingImages.length > 0) {
    console.log('❌ Missing images:');
    missingImages.forEach(img => console.log(`   - ${img}`));
  } else {
    console.log('✅ All referenced images are available');
  }

  // Check for unused images
  const unusedImages = imageFiles.filter(img => !uniqueImages.includes(img));
  if (unusedImages.length > 0) {
    console.log(`⚠️  Unused images (${unusedImages.length}):`);
    unusedImages.slice(0, 5).forEach(img => console.log(`   - ${img}`));
    if (unusedImages.length > 5) {
      console.log(`   ... and ${unusedImages.length - 5} more`);
    }
  }
  console.log();

  // Data integrity checks
  console.log('🔍 Data Integrity:');
  const hasAllRequiredFields = augmentsData.augments.every(aug => 
    aug.key && aug.title && aug.description && aug.image && aug.tier
  );
  console.log(`   All augments have required fields: ${hasAllRequiredFields ? '✅' : '❌'}`);

  const validTiers = ['Silver', 'Gold', 'Prismatic'];
  const hasValidTiers = augmentsData.augments.every(aug => 
    validTiers.includes(aug.tier)
  );
  console.log(`   All tiers are valid: ${hasValidTiers ? '✅' : '❌'}`);

  // Quick reference file check
  if (fs.existsSync(QUICK_REF_FILE)) {
    const quickRef = JSON.parse(fs.readFileSync(QUICK_REF_FILE, 'utf8'));
    console.log(`   Quick reference file exists: ✅ (${quickRef.length} entries)`);
  } else {
    console.log('   Quick reference file: ❌ Missing');
  }

  console.log();

  // Summary
  const totalIssues = missingImages.length + (hasAllRequiredFields ? 0 : 1) + (hasValidTiers ? 0 : 1);
  if (totalIssues === 0) {
    console.log('🎉 All checks passed! Your TFT Set 14 augments data is complete and ready to use.');
  } else {
    console.log(`⚠️  Found ${totalIssues} issue(s) that should be addressed.`);
  }

  return {
    totalAugments: augmentsData.augments.length,
    totalImages: imageFiles.length,
    uniqueImages: uniqueImages.length,
    missingImages: missingImages.length,
    unusedImages: unusedImages.length,
    hasAllData: totalIssues === 0
  };
}

// Run verification if called directly
if (require.main === module) {
  verifyAugmentsData();
}

module.exports = { verifyAugmentsData }; 