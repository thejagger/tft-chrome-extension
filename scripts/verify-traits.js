const fs = require('fs');
const path = require('path');

/**
 * Verification script for TFT Set 14 traits data
 * Checks data completeness, image availability, and provides statistics
 */

const TRAITS_FILE = './assets/traits/tft-set14-traits.json';
const IMAGES_DIR = './assets/traits/images';
const QUICK_REF_FILE = './assets/traits/quick-reference.json';
const ACTIVATION_FILE = './assets/traits/activation-levels.json';

function verifyTraitsData() {
  console.log('🔍 TFT Set 14 Traits Data Verification\n');

  // Check if files exist
  if (!fs.existsSync(TRAITS_FILE)) {
    console.error('❌ Main traits file not found:', TRAITS_FILE);
    return;
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('❌ Images directory not found:', IMAGES_DIR);
    return;
  }

  // Load data
  const traitsData = JSON.parse(fs.readFileSync(TRAITS_FILE, 'utf8'));
  const imageFiles = fs.readdirSync(IMAGES_DIR);

  console.log('📊 Data Overview:');
  console.log(`   Version: ${traitsData.version}`);
  console.log(`   Set: ${traitsData.setNumber} - ${traitsData.setName}`);
  console.log(`   Last Updated: ${new Date(traitsData.lastUpdated).toLocaleDateString()}`);
  console.log(`   Total Traits: ${traitsData.totalTraits}`);
  console.log(`   Enhanced Traits: ${traitsData.enhancedTraits}`);
  console.log(`   Actual Count: ${traitsData.traits.length}`);
  console.log();

  // Type breakdown
  console.log('🏷️  Type Breakdown:');
  Object.entries(traitsData.typeBreakdown).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  console.log();

  // Image verification
  console.log('🖼️  Image Verification:');
  const imageReferences = traitsData.traits.map(t => t.image);
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
  const hasAllRequiredFields = traitsData.traits.every(trait => 
    trait.key && trait.name && trait.image && trait.type && trait.activationLevels
  );
  console.log(`   All traits have required fields: ${hasAllRequiredFields ? '✅' : '❌'}`);

  const validTypes = ['class', 'origin', 'unknown'];
  const hasValidTypes = traitsData.traits.every(trait => 
    validTypes.includes(trait.type)
  );
  console.log(`   All types are valid: ${hasValidTypes ? '✅' : '❌'}`);

  // Activation levels verification
  const hasValidActivationLevels = traitsData.traits.every(trait => 
    Array.isArray(trait.activationLevels) && trait.activationLevels.length > 0
  );
  console.log(`   All traits have activation levels: ${hasValidActivationLevels ? '✅' : '❌'}`);

  // Quick reference file check
  if (fs.existsSync(QUICK_REF_FILE)) {
    const quickRef = JSON.parse(fs.readFileSync(QUICK_REF_FILE, 'utf8'));
    console.log(`   Quick reference file exists: ✅ (${quickRef.length} entries)`);
  } else {
    console.log('   Quick reference file: ❌ Missing');
  }

  // Activation levels file check
  if (fs.existsSync(ACTIVATION_FILE)) {
    const activationData = JSON.parse(fs.readFileSync(ACTIVATION_FILE, 'utf8'));
    console.log(`   Activation levels file exists: ✅ (${Object.keys(activationData).length} entries)`);
  } else {
    console.log('   Activation levels file: ❌ Missing');
  }

  console.log();

  // Enhancement status
  console.log('🚀 Enhancement Status:');
  const enhancedTraits = traitsData.traits.filter(t => t.isEnhanced);
  const unenhancedTraits = traitsData.traits.filter(t => !t.isEnhanced);
  
  console.log(`   Enhanced traits: ${enhancedTraits.length}`);
  if (enhancedTraits.length > 0) {
    enhancedTraits.slice(0, 5).forEach(trait => 
      console.log(`     ✅ ${trait.name} (${trait.type})`)
    );
    if (enhancedTraits.length > 5) {
      console.log(`     ... and ${enhancedTraits.length - 5} more`);
    }
  }

  console.log(`   Unenhanced traits: ${unenhancedTraits.length}`);
  if (unenhancedTraits.length > 0) {
    unenhancedTraits.slice(0, 5).forEach(trait => 
      console.log(`     ⚠️  ${trait.name} (${trait.type}) - using placeholder data`)
    );
    if (unenhancedTraits.length > 5) {
      console.log(`     ... and ${unenhancedTraits.length - 5} more`);
    }
  }

  console.log();

  // Activation levels analysis
  console.log('📈 Activation Levels Analysis:');
  const levelDistribution = {};
  traitsData.traits.forEach(trait => {
    const levelCount = trait.activationLevels.length;
    levelDistribution[levelCount] = (levelDistribution[levelCount] || 0) + 1;
  });
  
  Object.entries(levelDistribution).forEach(([levels, count]) => {
    console.log(`   ${levels} activation levels: ${count} traits`);
  });

  // Most common activation patterns
  const patterns = {};
  traitsData.traits.forEach(trait => {
    const pattern = trait.activationLevels.join(',');
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  });

  console.log('\n   Common activation patterns:');
  Object.entries(patterns)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([pattern, count]) => {
      console.log(`     [${pattern}]: ${count} traits`);
    });

  console.log();

  // Summary
  const totalIssues = missingImages.length + 
    (hasAllRequiredFields ? 0 : 1) + 
    (hasValidTypes ? 0 : 1) + 
    (hasValidActivationLevels ? 0 : 1);
    
  if (totalIssues === 0) {
    console.log('🎉 All checks passed! Your TFT Set 14 traits data is complete and ready to use.');
    if (unenhancedTraits.length > 0) {
      console.log(`💡 Consider enhancing the ${unenhancedTraits.length} unenhanced traits with proper descriptions.`);
    }
  } else {
    console.log(`⚠️  Found ${totalIssues} issue(s) that should be addressed.`);
  }

  return {
    totalTraits: traitsData.traits.length,
    enhancedTraits: enhancedTraits.length,
    unenhancedTraits: unenhancedTraits.length,
    totalImages: imageFiles.length,
    uniqueImages: uniqueImages.length,
    missingImages: missingImages.length,
    unusedImages: unusedImages.length,
    hasAllData: totalIssues === 0
  };
}

// Run verification if called directly
if (require.main === module) {
  verifyTraitsData();
}

module.exports = { verifyTraitsData }; 