# TFT Set 14 Traits Data

This directory contains comprehensive and **fully verified** data for all Teamfight Tactics Set 14 traits with accurate activation levels, sourced from the Community Dragon API.

## Files Overview

### Current (Accurate) Data Files

- **`tft-set14-traits-accurate.json`** - Complete traits data with verified activation levels
- **`quick-reference-accurate.json`** - Lightweight version with essential fields only
- **`activation-levels-accurate.json`** - Detailed activation level data with tier names
- **`images/`** - Directory containing all trait images (PNG format)

### Legacy Files (Deprecated)

- `tft-set14-traits.json` - Original file with some incorrect assumptions
- `tft-set14-traits-corrected.json` - Partially corrected version
- `traits-need-research.json` - Research list (no longer needed)
- `verified-traits.json` - Manual verification file (superseded)

## Data Quality Status

✅ **Fully Verified**: All traits data is now accurate and verified using Community Dragon API.

### Data Source

- **Primary Source**: Community Dragon API (https://raw.communitydragon.org/15.9/cdragon/tft/en_us.json)
- **Backup Images**: Riot Games Data Dragon API (version 15.12.1)
- **All Traits Verified**: 25/25 traits have accurate activation levels

### Key Corrections Made

Previously incorrect assumptions have been corrected:

- **Virus**: [1] - Correctly identified as unique trait (was assumed [2,4,6])
- **Soul Killer**: [1] - Viego's unique trait
- **Overlord**: [1] - Unique trait
- **God of the Net**: [1] - Unique trait
- **Marksman**: [2,4] - Only 2 levels (was assumed [2,4,6])
- **Nitro**: [3,4] - Special activation pattern
- **Cypher**: [3,4,5] - Three-level progression

## Data Structure

### Main Data File (`tft-set14-traits-accurate.json`)

```json
{
  "version": "15.12.1",
  "dataSource": "community-dragon",
  "sourceUrl": "https://raw.communitydragon.org/15.9/cdragon/tft/en_us.json",
  "setNumber": 14,
  "setName": "Cyber City",
  "totalTraits": 25,
  "verifiedTraits": 25,
  "lastUpdated": "2024-12-21T...",
  "typeBreakdown": {
    "class": 8,
    "origin": 6,
    "special": 6,
    "unique": 4,
    "unknown": 1
  },
  "activationPatterns": {
    "1": 4,
    "2,4,6": 7,
    "2,4": 1,
    "2,3,4,5": 3,
    "3,5,7,10": 3,
    "1,2,3,4,5,6,7": 1,
    "3,5,7": 1,
    "2,3,4": 2,
    "3,4,5": 1,
    "3,4": 1,
    "2,4,6,8": 1
  },
  "traits": [...]
}
```

### Trait Object Structure

Each trait contains the following verified fields:

```json
{
  "key": "TFT14_Bruiser",
  "name": "Bruiser",
  "displayName": "Bruiser",
  "image": "Trait_Icon_14_Bruiser.TFT_Set14.png",
  "type": "class",
  "activationLevels": [2, 4, 6],
  "descriptions": {
    "2": "Bruiser Bronze effect: Your team gains 100 Health. Bruisers gain more.",
    "4": "Bruiser Silver effect: Your team gains 100 Health. Bruisers gain more.",
    "6": "Bruiser Gold effect: Your team gains 100 Health. Bruisers gain more."
  },
  "rawDescription": "Your team gains 100 Health. Bruisers gain more.",
  "source": "community-dragon",
  "searchText": "bruiser your team gains 100 health...",
  "isVerified": true,
  "needsResearch": false,
  "effects": [...] // Original Community Dragon effects data
}
```

### Activation Levels File (`activation-levels-accurate.json`)

```json
{
  "TFT14_Bruiser": {
    "name": "Bruiser",
    "levels": {
      "2": {
        "level": 2,
        "description": "Bruiser Bronze effect: Your team gains 100 Health. Bruisers gain more.",
        "tierName": "Bronze"
      },
      "4": {
        "level": 4,
        "description": "Bruiser Silver effect: Your team gains 100 Health. Bruisers gain more.",
        "tierName": "Silver"
      },
      "6": {
        "level": 6,
        "description": "Bruiser Gold effect: Your team gains 100 Health. Bruisers gain more.",
        "tierName": "Gold"
      }
    }
  }
}
```

### Field Descriptions

- **`key`** - Unique identifier from Community Dragon API
- **`name`** - Display name of the trait
- **`type`** - Trait type: "class", "origin", "special", "unique", or "unknown"
- **`activationLevels`** - Array of champion counts needed to activate each tier (verified)
- **`descriptions`** - Object with descriptions for each activation level
- **`image`** - Filename of the trait's icon (located in `images/` directory)
- **`isVerified`** - Always true (all traits verified from Community Dragon)
- **`effects`** - Original effects data from Community Dragon with variables

## Trait Types & Activation Patterns

### Classes (⚔️) - 8 traits

Classes define a champion's role and fighting style:

- **Bastion** [2,4,6] - Team armor and magic resist
- **Bruiser** [2,4,6] - Team health bonuses
- **Executioner** [2,3,4,5] - Execute low-health enemies
- **Golden Ox** [2,4,6] - Damage amp and gold drops
- **Marksman** [2,4] - Attack damage and range
- **Rapidfire** [2,4,6] - Attack speed bonuses
- **Slayer** [2,4,6] - Damage and omnivamp
- **Strategist** [2,3,4,5] - Mana and ability power

### Origins (🌟) - 6 traits

Origins define a champion's background and provide team synergies:

- **Anima Squad** [3,5,7,10] - Health and attack speed
- **BoomBot** [2,4,6] - Explosive damage bonuses
- **Divinicorp** [1,2,3,4,5,6,7] - Scaling damage amplification
- **Exotech** [3,5,7,10] - Speed and mobility bonuses
- **Street Demon** [3,5,7,10] - Damage and healing
- **Syndicate** [3,5,7] - Health, damage amp, and Kingpin upgrades

### Special Mechanics (⚡) - 6 traits

Special traits with unique mechanics:

- **A.M.P.** [2,3,4,5] - Ability power amplification
- **Cypher** [3,4,5] - Intel gathering and cash-out system
- **Dynamo** [2,3,4] - Attack speed and ability power
- **Nitro** [3,4] - Chrome collection for R-080T robot
- **Techie** [2,4,6,8] - Item and gold bonuses (4 tiers!)
- **Cyberboss** [2,3,4] - Boss upgrades and bonuses

### Unique Traits (🦄) - 4 traits

Single-champion traits with [1] activation:

- **God of the Net** [1] - Unique champion trait
- **Overlord** [1] - Unique champion trait
- **Soul Killer** [1] - Viego's unique trait
- **Virus** [1] - Zac's unique trait (shop infection mechanic)

## Usage Examples

### Loading Accurate Data in JavaScript

```javascript
// Load verified data
const traitsData = require("./assets/traits/tft-set14-traits-accurate.json");
console.log(
  `All ${traitsData.totalTraits} traits verified: ${
    traitsData.verifiedTraits === traitsData.totalTraits
  }`
);

// Access traits array
const allTraits = traitsData.traits;

// Filter by type
const classTraits = allTraits.filter((trait) => trait.type === "class");
const uniqueTraits = allTraits.filter((trait) => trait.type === "unique");

// Get trait by key
function getTraitByKey(key) {
  return allTraits.find((trait) => trait.key === key);
}

// Get trait effect for specific level
function getTraitEffect(traitKey, championCount) {
  const trait = getTraitByKey(traitKey);
  if (!trait) return null;

  // Find highest activation level met
  const activeLevels = trait.activationLevels.filter(
    (level) => championCount >= level
  );
  if (activeLevels.length === 0) return null;

  const activeLevel = Math.max(...activeLevels);
  return {
    level: activeLevel,
    description: trait.descriptions[activeLevel],
    isMaxLevel: activeLevel === Math.max(...trait.activationLevels),
  };
}
```

### Using Verified Activation Levels

```javascript
// Load accurate activation data
const activationData = require("./assets/traits/activation-levels-accurate.json");

// Get detailed activation info
function getActivationInfo(traitKey, championCount) {
  const activation = activationData[traitKey];
  if (!activation) return null;

  // Find active tier
  const levels = Object.keys(activation.levels)
    .map(Number)
    .sort((a, b) => a - b);
  const activeLevel = levels.filter((level) => championCount >= level).pop();

  if (!activeLevel) return null;

  const levelData = activation.levels[activeLevel];
  const nextLevel = levels.find((level) => level > championCount);

  return {
    name: activation.name,
    currentLevel: activeLevel,
    tierName: levelData.tierName,
    description: levelData.description,
    nextLevel: nextLevel,
    progress: nextLevel
      ? (championCount - activeLevel) / (nextLevel - activeLevel)
      : 1,
  };
}
```

### For Chrome Extension Usage

```javascript
// In your content script - updated to use accurate data
const traitsManager = new TraitsDataManager();

// Load verified data
await traitsManager.loadData();

// Detect trait activation in game
function analyzeTeamComposition(champions) {
  const traitCounts = {};

  // Count champions per trait
  champions.forEach((champion) => {
    champion.traits.forEach((traitKey) => {
      traitCounts[traitKey] = (traitCounts[traitKey] || 0) + 1;
    });
  });

  // Get active trait effects (now with accurate activation levels)
  const activeTraits = [];
  Object.entries(traitCounts).forEach(([traitKey, count]) => {
    const effect = traitsManager.getTraitEffect(traitKey, count);
    if (effect) {
      activeTraits.push({
        trait: effect.trait,
        count: count,
        effect: effect,
        tooltipData: traitsManager.createTooltipData(effect.trait, count),
      });
    }
  });

  return activeTraits;
}

// Show trait tooltip with accurate data
function showTraitTooltip(traitKey, championCount) {
  const trait = traitsManager.getTrait(traitKey);
  if (!trait) return;

  const tooltipData = traitsManager.createTooltipData(trait, championCount);
  const progress = traitsManager.getActivationProgress(traitKey, championCount);

  displayTooltip({
    title: `${trait.name} (${championCount})`,
    type: traitsManager.getTypeDisplayName(trait.type),
    description: tooltipData.effect?.description || "Inactive",
    image: traitsManager.getTraitImageUrl(trait),
    progress: progress,
    tierColor: traitsManager.getTierColor(tooltipData.effect?.tierName),
  });
}
```

## Tier Colors & Styling

Use the built-in color system for consistent trait styling:

```javascript
// Tier colors
const tierColors = {
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Prismatic: "#E91E63",
  Diamond: "#B9F2FF",
  Unique: "#9C27B0", // Purple for unique traits
};

// Type colors
const typeColors = {
  class: "#4CAF50", // Green
  origin: "#2196F3", // Blue
  special: "#FF9800", // Orange
  unique: "#9C27B0", // Purple
  unknown: "#9E9E9E", // Gray
};
```

## Data Accuracy Verification

All traits have been verified against Community Dragon API data:

### Verification Script

```bash
# Run verification to confirm data accuracy
node examples/verify-accurate-traits.js
```

### Verification Results

- ✅ **25/25 traits** have accurate activation levels
- ✅ **100% consistency** between trait and activation data
- ✅ **All unique traits** correctly identified with [1] activation
- ✅ **Complex patterns** accurately captured (e.g., Divinicorp [1,2,3,4,5,6,7])
- ✅ **No assumptions** - all data sourced from official Community Dragon API

## Data Freshness

The data is sourced from Community Dragon API (version 15.9) which provides the most accurate and up-to-date TFT trait information. To update:

1. Run the fetcher: `node scripts/fetch-traits-from-cdragon.js`
2. Verify accuracy: `node examples/verify-accurate-traits.js`
3. All data is automatically verified - no manual research needed

## Integration with TFT Chrome Extension

This verified data is specifically structured for computer vision and gameplay analysis:

1. **Trait Recognition**: Use image files for template matching
2. **Activation Detection**: Calculate trait effects based on accurate champion counts
3. **Progress Tracking**: Show progress bars for next activation levels
4. **Tooltip Display**: Rich trait information with tier-based styling
5. **Team Analysis**: Comprehensive team composition breakdown with correct synergies

## Notes

- **All activation levels are verified** from Community Dragon API
- **Unique traits** (Virus, Soul Killer, Overlord, God of the Net) correctly have [1] activation
- **Complex patterns** like Techie [2,4,6,8] and Divinicorp [1,2,3,4,5,6,7] are accurate
- **No more assumptions** - all data is sourced from official API
- **Trait images** are consistent and downloaded from Riot's CDN
- **Legacy files** are kept for reference but should not be used in production
- **Chrome extension** automatically uses accurate data files
