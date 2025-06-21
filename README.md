# TFT Stream Overlay Chrome Extension

A Chrome extension that analyzes Teamfight Tactics (TFT) livestreams on Twitch and provides interactive overlays with detailed information about augments, champions, and team compositions.

## 🎯 Features

- **Real-time Stream Analysis**: Detects TFT game elements from Twitch video streams
- **Interactive Overlay**: Hover-based information display system
- **Augment Information**: Detailed stats, synergies, and meta information
- **Team Composition Analysis**: Champion details, traits, synergies, and optimal positioning
- **Item Recognition**: Identify and explain item combinations and effects

## 🛠️ Tech Stack

- **Computer Vision**: OpenCV.js for image processing and template matching
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **APIs**: Riot Games API, TFT community APIs
- **Platform**: Chrome Extension (Manifest V3)

## 📋 Development Status

This project is currently in development. Check the [Projects tab](../../projects) for current progress and roadmap.

### Current Phase: Foundation Setup

- [x] Project planning and architecture
- [x] Coding standards and repository setup
- [ ] Basic Chrome extension structure
- [ ] Twitch integration and video access
- [ ] Basic overlay system

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- Chrome browser with Developer Mode enabled
- Basic knowledge of JavaScript and Chrome extensions

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/tft-chrome-extension.git
cd tft-chrome-extension
```

2. Install dependencies:

```bash
npm install
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

## 📁 Project Structure

```
├── manifest.json           # Extension configuration
├── content-scripts/        # Scripts injected into Twitch pages
├── background/             # Service worker scripts
├── popup/                  # Extension popup interface
├── assets/                 # Images, icons, templates
├── libs/                   # Third-party libraries
└── docs/                   # Documentation
```

## 🤝 Contributing

This project follows strict coding standards:

- Functions: Max 50 lines
- Files: Max 300 lines
- Comprehensive commenting for complex algorithms
- Performance-first approach for real-time video processing

See `.cursor/rules` for detailed coding guidelines.

## 📝 License

This project is for educational purposes. Respect Riot Games' Terms of Service and Twitch's Developer Guidelines.

## 🎮 Disclaimer

This extension is not affiliated with Riot Games or Twitch. Team Fight Tactics is a trademark of Riot Games, Inc.
