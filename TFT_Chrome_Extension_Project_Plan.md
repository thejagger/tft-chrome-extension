# TFT Stream Overlay Chrome Extension - Project Plan

## 🎯 Project Overview

Create a Chrome extension that analyzes Teamfight Tactics (TFT) livestreams on Twitch and provides an interactive overlay with detailed information about augments, champions, and team compositions when users hover over them.

## ✨ Core Features

### Primary Features

- **Real-time Stream Analysis**: Detect TFT game elements from Twitch video streams
- **Interactive Overlay**: Hover-based information display system
- **Augment Information**: Detailed stats, synergies, and meta information
- **Team Composition Analysis**: Champion details, traits, synergies, and optimal positioning
- **Item Recognition**: Identify and explain item combinations and effects

### Secondary Features

- **Meta Statistics**: Win rates, pick rates, and tier rankings
- **Build Recommendations**: Suggest optimal team compositions based on current augments
- **Stream Integration**: Works across different TFT streamers and layouts
- **Customizable UI**: Adjustable overlay appearance and information density

## 🏗️ Technical Architecture

### 1. Chrome Extension Structure

```
├── manifest.json           # Extension configuration
├── content-scripts/        # Scripts injected into Twitch pages
│   ├── twitch-overlay.js   # Main overlay system
│   └── video-analyzer.js   # Video stream analysis
├── background/             # Service worker scripts
│   └── data-manager.js     # TFT data management
├── popup/                  # Extension popup interface
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── assets/                 # Images, icons, templates
└── libs/                   # Third-party libraries
```

### 2. Core Technologies

#### Computer Vision & Image Processing

- **OpenCV.js**: For image processing and template matching
- **TensorFlow.js**: For machine learning-based recognition (optional)
- **Canvas API**: For frame extraction and processing
- **WebRTC**: For accessing video stream data

#### Data & APIs

- **TFT Data Sources**:
  - Riot Games API (official TFT data)
  - Community APIs (tactics.tools, lolchess.gg)
  - Static data files for augments/champions
- **Local Storage**: Cache frequently accessed data

#### UI & Overlay

- **DOM Manipulation**: Inject overlay elements
- **CSS-in-JS**: Dynamic styling for overlay components
- **Event Handlers**: Mouse hover detection and positioning

## 🛠️ Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goals**: Basic Chrome extension setup and Twitch integration

**Tasks**:

- [ ] Set up Chrome extension boilerplate
- [ ] Implement content script injection on Twitch TFT streams
- [ ] Create basic overlay positioning system
- [ ] Test video element detection and access

**Deliverables**:

- Working Chrome extension that loads on Twitch
- Basic overlay that can be positioned over video stream
- Video element access and frame extraction capability

### Phase 2: Image Recognition Core (Weeks 3-5)

**Goals**: Implement computer vision for TFT element detection

**Tasks**:

- [ ] Integrate OpenCV.js for image processing
- [ ] Create template matching system for augments
- [ ] Implement champion recognition (icons/portraits)
- [ ] Develop coordinate mapping for hover detection
- [ ] Test recognition accuracy across different stream qualities

**Deliverables**:

- Template matching system for common TFT elements
- Coordinate detection for augments and champions
- Basic recognition testing framework

### Phase 3: Data Integration (Weeks 4-6)

**Goals**: Connect TFT game data with recognized elements

**Tasks**:

- [ ] Set up TFT data sources and APIs
- [ ] Create data mapping for augments, champions, and items
- [ ] Implement caching system for performance
- [ ] Build data update mechanism for new TFT sets
- [ ] Design information card UI components

**Deliverables**:

- Complete TFT database integration
- Information card system
- Data caching and update mechanisms

### Phase 4: Advanced Features (Weeks 7-8)

**Goals**: Enhanced functionality and user experience

**Tasks**:

- [ ] Implement team composition analysis
- [ ] Add meta statistics and recommendations
- [ ] Create user customization options
- [ ] Optimize performance for real-time processing
- [ ] Add support for different TFT sets/patches

**Deliverables**:

- Advanced analysis features
- Customization options
- Performance optimizations

### Phase 5: Polish & Distribution (Weeks 9-10)

**Goals**: Finalize and prepare for release

**Tasks**:

- [ ] Comprehensive testing across different streams/streamers
- [ ] UI/UX improvements and accessibility
- [ ] Error handling and edge cases
- [ ] Chrome Web Store preparation
- [ ] Documentation and user guides

**Deliverables**:

- Production-ready Chrome extension
- Chrome Web Store listing
- User documentation

## 🧩 Technical Challenges & Solutions

### Challenge 1: Video Stream Analysis

**Problem**: Extracting and processing frames from Twitch video streams in real-time

**Solutions**:

- Use `requestAnimationFrame` for efficient frame processing
- Implement frame sampling (process every Nth frame) to balance accuracy vs performance
- Utilize Web Workers for background processing to avoid UI blocking

### Challenge 2: Element Recognition Accuracy

**Problem**: Reliably identifying TFT elements across different stream qualities and layouts

**Solutions**:

- Multiple template matching with different scales
- OCR for text-based elements (champion names, augment descriptions)
- Adaptive thresholding based on stream quality
- Machine learning approach for complex recognition tasks

### Challenge 3: Stream Layout Variations

**Problem**: Different streamers have different overlay setups and layouts

**Solutions**:

- Dynamic layout detection algorithms
- User calibration options
- Multiple preset configurations for popular streamers
- Adaptive positioning based on detected UI elements

### Challenge 4: Performance Optimization

**Problem**: Real-time image processing can be computationally expensive

**Solutions**:

- Selective region processing (focus on game area)
- Frame rate adaptation based on system performance
- Efficient caching of recognition results
- GPU acceleration where available (WebGL)

## 📋 Technical Requirements

### Development Environment

- **Node.js** (v16+) for build tools
- **Chrome Developer Mode** for extension testing
- **VS Code** with extensions for web development
- **Git** for version control

### Libraries & Dependencies

```json
{
  "opencv.js": "^4.8.0",
  "tensorflow.js": "^4.10.0" (optional),
  "tesseract.js": "^4.1.0" (for OCR),
  "axios": "^1.5.0" (for API calls)
}
```

### Browser Compatibility

- **Primary**: Chrome 88+
- **Secondary**: Edge 88+, Firefox (with manifest v2 compatibility)

## 🔐 Privacy & Permissions

### Required Permissions

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "https://www.twitch.tv/*",
    "https://api.riotgames.com/*"
  ]
}
```

### Privacy Considerations

- **No Data Collection**: Extension processes video locally
- **Minimal API Calls**: Only for TFT game data updates
- **User Consent**: Clear privacy policy and opt-in features
- **Local Storage**: All user preferences stored locally

## 📊 Success Metrics

### Technical Metrics

- **Recognition Accuracy**: >85% for augments, >80% for champions
- **Performance Impact**: <10% CPU usage increase
- **Response Time**: <100ms for hover information display
- **Compatibility**: Works on 90%+ of TFT streams

### User Metrics

- **User Adoption**: Target 1000+ active users in first month
- **User Retention**: >60% weekly retention rate
- **User Satisfaction**: >4.0/5.0 rating on Chrome Web Store

## 🚧 Potential Risks & Mitigation

### Risk 1: TFT Game Updates

**Impact**: New sets/patches break recognition system
**Mitigation**: Automated data update system, modular template design

### Risk 2: Twitch Policy Changes

**Impact**: Platform restrictions on video access
**Mitigation**: Monitor Twitch developer policies, implement fallback methods

### Risk 3: Performance Issues

**Impact**: Extension causes browser slowdown
**Mitigation**: Extensive performance testing, configurable processing intensity

### Risk 4: Legal/Copyright Concerns

**Impact**: Use of TFT assets or data
**Mitigation**: Use only publicly available APIs, respect terms of service

## 🔄 Maintenance & Updates

### Regular Maintenance

- **Weekly**: Monitor for new TFT patches and data updates
- **Monthly**: Performance optimization and bug fixes
- **Quarterly**: Feature updates and UI improvements

### Long-term Roadmap

- **Version 2.0**: Machine learning-based recognition
- **Version 3.0**: Multi-game support (other auto-battlers)
- **Version 4.0**: Community features and sharing

## 📝 Coding Standards & Best Practices

### Code Quality Rules

- **Keep It Simple**: Write code that's easy to understand, not clever
- **Function Length**: Maximum 50 lines per function
- **File Length**: Maximum 300 lines per file
- **Class Length**: Maximum 200 lines per class
- **Single Responsibility**: Each function/class should do one thing well

### File Organization

```
// ✅ Good - Small, focused files
├── content-scripts/
│   ├── overlay-manager.js      // ~150 lines - handles overlay UI
│   ├── hover-detector.js       // ~100 lines - detects mouse events
│   ├── element-recognizer.js   // ~200 lines - CV recognition logic
│   └── tooltip-renderer.js     // ~120 lines - renders information cards

// ❌ Bad - One giant file
├── content-scripts/
│   └── everything.js          // 800+ lines - does everything
```

### Function Structure

```javascript
// ✅ Good - Small, focused function
/**
 * Extracts a single frame from the video element
 * Used for computer vision processing
 */
function extractVideoFrame(videoElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set canvas dimensions to match video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw current video frame to canvas
  ctx.drawImage(videoElement, 0, 0);

  return canvas;
}

// ❌ Bad - Too many responsibilities in one function
function processVideoAndShowTooltip(videoElement, mouseX, mouseY, tftData) {
  // 100+ lines of mixed responsibilities...
}
```

### Comment Guidelines

```javascript
// ✅ Comment complex algorithms
/**
 * Template matching algorithm for detecting TFT augments
 * Uses normalized cross-correlation to find matches
 * @param {ImageData} frame - Current video frame
 * @param {Array} templates - Augment image templates
 * @returns {Array} Detected augments with confidence scores
 */
function detectAugments(frame, templates) {
  // Complex computer vision code here...
}

// ✅ Comment important business logic
// Check if confidence is above threshold (85%)
// Lower values cause too many false positives
if (matchConfidence > 0.85) {
  return detectedElement;
}

// ✅ Comment non-obvious browser APIs
// Use requestAnimationFrame for smooth 60fps processing
// Prevents blocking the main thread during video analysis
requestAnimationFrame(() => processNextFrame());

// ❌ Don't comment obvious code
const isVisible = true; // Sets isVisible to true
```

### Variable Naming

```javascript
// ✅ Clear, descriptive names
const augmentTemplates = loadAugmentImages();
const mouseHoverCoordinates = { x: 150, y: 200 };
const recognitionConfidenceThreshold = 0.85;

// ❌ Unclear abbreviations
const at = loadAugmentImages();
const mhc = { x: 150, y: 200 };
const rct = 0.85;
```

### Error Handling

```javascript
// ✅ Clear error handling with context
try {
  const frameData = extractVideoFrame(video);
  return processFrame(frameData);
} catch (error) {
  // Log specific context for debugging
  console.error("Failed to extract video frame:", {
    videoElement: video,
    error: error.message,
    timestamp: Date.now(),
  });

  // Return safe fallback
  return null;
}
```

### Module Structure

```javascript
// ✅ Each file exports a focused module
// file: augment-detector.js
export class AugmentDetector {
  constructor(templates) {
    this.templates = templates;
    this.confidenceThreshold = 0.85;
  }

  // Small, focused methods
  detect(frame) {
    /* ~20 lines */
  }
  validateMatch(match) {
    /* ~10 lines */
  }
  filterResults(matches) {
    /* ~15 lines */
  }
}

// ✅ Clear public API
// file: tooltip-manager.js
export const TooltipManager = {
  show: showTooltip,
  hide: hideTooltip,
  position: positionTooltip,
  update: updateContent,
};
```

### Testing Structure

```javascript
// ✅ Small, focused tests
describe("AugmentDetector", () => {
  test("should detect valid augment with high confidence", () => {
    // ~10 lines of focused test
  });

  test("should reject low confidence matches", () => {
    // ~8 lines of focused test
  });
});
```

### Configuration Management

```javascript
// ✅ Centralized configuration
// file: config.js
export const CONFIG = {
  // Computer Vision Settings
  RECOGNITION: {
    CONFIDENCE_THRESHOLD: 0.85,
    FRAME_SAMPLE_RATE: 5, // Process every 5th frame
    MAX_PROCESSING_TIME: 16, // 60fps = 16ms per frame
  },

  // UI Settings
  OVERLAY: {
    FADE_DURATION: 200,
    MAX_TOOLTIP_WIDTH: 350,
    HOVER_DELAY: 500,
  },

  // Performance Settings
  PERFORMANCE: {
    MAX_CONCURRENT_PROCESSING: 2,
    CACHE_SIZE: 100,
    CLEANUP_INTERVAL: 30000, // 30 seconds
  },
};
```

### Performance Guidelines

- **Debounce expensive operations** (image processing, API calls)
- **Use Web Workers** for heavy computation
- **Cache frequently accessed data** (templates, API responses)
- **Profile regularly** using Chrome DevTools
- **Set performance budgets** (max CPU usage, memory limits)

## 🎉 Getting Started

### Prerequisites

1. Basic knowledge of JavaScript, HTML, CSS
2. Understanding of Chrome extension development
3. Familiarity with computer vision concepts (helpful)
4. TFT game knowledge for testing and validation

### Development Setup

```bash
# Install development tools
npm init -y
npm install --save-dev eslint prettier
npm install opencv.js axios

# Set up code formatting
echo '{"semi": true, "singleQuote": true, "tabWidth": 2}' > .prettierrc
```

### First Steps

1. Clone this project plan
2. Set up development environment with linting/formatting
3. Create basic Chrome extension structure following the coding standards
4. Start with Phase 1 implementation
5. Join TFT developer communities for support and data sources

---

**Note**: This is an ambitious project that combines web development, computer vision, and gaming expertise. Start with a minimal viable product (MVP) focusing on basic augment recognition before expanding to more complex features.

**Estimated Total Development Time**: 8-10 weeks for full-time development, 3-4 months for part-time development.

**Budget Considerations**: Most tools and APIs are free for personal/small-scale use. Consider costs for data APIs if scaling to many users.
