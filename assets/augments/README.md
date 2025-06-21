# TFT Set 14 Augments Data

This directory contains comprehensive data for all Teamfight Tactics Set 14 augments, sourced from the official Riot Games Data Dragon API.

## Files Overview

- **`tft-set14-augments.json`** - Complete augments data with full metadata
- **`quick-reference.json`** - Lightweight version with essential fields only
- **`images/`** - Directory containing all augment images (PNG format)

## Data Structure

### Main Data File (`tft-set14-augments.json`)

```json
{
  "version": "15.12.1",
  "dataSource": "riot-api",
  "setNumber": 14,
  "setName": "Into the Arcane",
  "totalAugments": 135,
  "lastUpdated": "2025-06-21T13:35:42.324Z",
  "tierBreakdown": {
    "Prismatic": 5,
    "Gold": 27,
    "Silver": 103
  },
  "augments": [...]
}
```

### Augment Object Structure

Each augment contains the following fields:

```json
{
  "key": "TFT_Augment_AxiomArc3",
  "title": "Axiom Arc III",
  "description": "Your units gain 15 Mana on kill. Gain a completed item Anvil.",
  "image": "Axiom-Arc-III.png",
  "tier": "Prismatic",
  "type": "augment",
  "source": "riot-api",
  "searchText": "axiom arc iii your units gain 15 mana on kill...",
  "tierPriority": 3,
  "powerLevel": 30
}
```

### Field Descriptions

- **`key`** - Unique identifier from Riot's API
- **`title`** - Display name of the augment
- **`description`** - Full description with game mechanics
- **`image`** - Filename of the augment's icon (located in `images/` directory)
- **`tier`** - Augment tier: "Silver", "Gold", or "Prismatic"
- **`type`** - Always "augment" for this dataset
- **`source`** - Data source identifier ("riot-api")
- **`searchText`** - Lowercase searchable text combining title and description
- **`tierPriority`** - Numeric priority for sorting (3=Prismatic, 2=Gold, 1=Silver)
- **`powerLevel`** - Estimated power level (10-50 scale)

## Usage Examples

### Loading Data in JavaScript

```javascript
// Load complete data
const augmentsData = require("./assets/augments/tft-set14-augments.json");
console.log(`Total augments: ${augmentsData.totalAugments}`);

// Access augments array
const allAugments = augmentsData.augments;

// Filter by tier
const prismaticAugments = allAugments.filter((aug) => aug.tier === "Prismatic");
const goldAugments = allAugments.filter((aug) => aug.tier === "Gold");
const silverAugments = allAugments.filter((aug) => aug.tier === "Silver");

// Search functionality
function searchAugments(query) {
  const searchTerm = query.toLowerCase();
  return allAugments.filter((aug) => aug.searchText.includes(searchTerm));
}

// Get augment by key
function getAugmentByKey(key) {
  return allAugments.find((aug) => aug.key === key);
}
```

### Using Images

All augment images are stored in the `images/` directory. The filename is provided in each augment's `image` field.

```javascript
// Get image path for an augment
function getAugmentImagePath(augment) {
  return `./assets/augments/images/${augment.image}`;
}

// Example usage
const axiomArc = getAugmentByKey("TFT_Augment_AxiomArc3");
const imagePath = getAugmentImagePath(axiomArc);
// Result: "./assets/augments/images/Axiom-Arc-III.png"
```

### For Chrome Extension Usage

```javascript
// In your content script
const augmentsData = chrome.runtime.getURL(
  "assets/augments/tft-set14-augments.json"
);

fetch(augmentsData)
  .then((response) => response.json())
  .then((data) => {
    // Use augments data for computer vision matching
    const augments = data.augments;

    // Create lookup map for faster access
    const augmentMap = new Map();
    augments.forEach((aug) => {
      augmentMap.set(aug.key, aug);
    });

    // Use in your overlay system
    function showAugmentTooltip(detectedKey) {
      const augment = augmentMap.get(detectedKey);
      if (augment) {
        displayTooltip({
          title: augment.title,
          description: augment.description,
          tier: augment.tier,
          image: chrome.runtime.getURL(
            `assets/augments/images/${augment.image}`
          ),
        });
      }
    }
  });
```

## Tier Information

### Prismatic (5 augments)

- Highest tier, most powerful effects
- Usually game-changing mechanics
- Appear less frequently in-game

### Gold (27 augments)

- Mid-tier augments with strong effects
- Often enhanced versions of Silver augments
- Balanced between power and availability

### Silver (103 augments)

- Base tier, most common augments
- Foundational effects and mechanics
- Form the majority of augment options

## Data Freshness

The data is sourced from Riot's official Data Dragon API and uses version `15.12.1`. To update the data:

1. Run the verification script: `node scripts/verify-augments.js`
2. If updates are needed, run: `node scripts/fetch-augments-latest.js`

## Notes

- Some augments share the same image file (8 duplicates in Set 14)
- All descriptions include HTML tags for formatting (e.g., `<br>`, `<rules>`)
- The `powerLevel` field is estimated based on tier and description keywords
- Image files are in PNG format with varying dimensions

## Integration with TFT Chrome Extension

This data is specifically structured for use with computer vision systems:

1. **Image Recognition**: Use the image files for template matching
2. **Tooltip Display**: Use title and description for overlay information
3. **Search Functionality**: Use searchText for fuzzy matching
4. **Tier-based Styling**: Use tier and tierPriority for visual hierarchy
