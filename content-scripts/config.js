/**
 * TFT Chrome Extension Configuration
 * Centralized configuration for all extension settings
 */

const CONFIG = {
  // Twitch Integration Settings
  TWITCH: {
    // Multiple selectors to try for video element
    VIDEO_SELECTORS: [
      'video[data-a-target="video-player"]',
      'video[data-a-player-type="site"]', 
      'video[data-testid="video-player__video-layout"]',
      '.video-player video',
      'video',
      '[data-a-target="player-overlay-click-handler"] video'
    ],
    CHAT_SELECTOR: '[data-a-target="chat-scroller"]',
    STREAM_TITLE_SELECTOR: '[data-a-target="stream-title"]',
    // Check for TFT in title/category
    TFT_KEYWORDS: ['teamfight tactics', 'tft', 'team fight tactics'],
  },

  // Overlay Settings  
  OVERLAY: {
    CONTAINER_ID: 'tft-extension-overlay',
    Z_INDEX: 9999,
    FADE_DURATION: 200,
    POSITION_OFFSET: { x: 20, y: 20 },
    MAX_WIDTH: 350,
    BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
    BORDER_RADIUS: '8px',
  },

  // Video Processing Settings
  VIDEO: {
    FRAME_CHECK_INTERVAL: 1000, // Check video every 1 second
    MIN_WIDTH: 640, // Minimum video width to process
    MIN_HEIGHT: 360, // Minimum video height to process
  },

  // Stream Monitoring Settings
  STREAM_MONITORING: {
    TFT_CHECK_INTERVAL: 5000, // Check TFT status every 5 seconds
    TITLE_CHECK_INTERVAL: 3000, // Check stream title changes every 3 seconds
    AD_DETECTION_DELAY: 2000, // Wait 2 seconds after video change (for ads)
  },

  // Performance Settings
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300, // Debounce user interactions
    MAX_RETRY_ATTEMPTS: 3,
    CLEANUP_INTERVAL: 30000, // Cleanup every 30 seconds
  },

  // Computer Vision Settings
  CV: {
    PROCESSING_INTERVAL: 2000, // Process frames every 2 seconds
    MATCHING_THRESHOLD: 0.75, // Template matching confidence threshold
    SCALE_FACTORS: [0.8, 1.0, 1.2], // Multi-scale template matching
    NMS_OVERLAP_THRESHOLD: 0.3, // Non-maximum suppression overlap threshold
    MAX_PROCESSING_TIME: 100, // Maximum time per frame (ms)
    ENABLE_VISUALIZATION: false, // Show detection boxes (for debugging)
  },

  // TFT Element Regions (typical positions for 640x360 streams)
  TFT_REGIONS: {
    AUGMENTS: [
      { x: 50, y: 50, width: 300, height: 100, name: 'top_augments' },
      { x: 400, y: 50, width: 200, height: 100, name: 'side_augments' }
    ],
    CHAMPIONS: [
      { x: 100, y: 200, width: 450, height: 120, name: 'board' },
      { x: 50, y: 320, width: 550, height: 40, name: 'bench' }
    ],
    SHOP: [
      { x: 50, y: 270, width: 550, height: 50, name: 'shop_area' }
    ],
    GOLD: [
      { x: 500, y: 10, width: 100, height: 30, name: 'gold_display' }
    ]
  },

  // Logging Settings
  LOGGING: {
    ENABLED: true,
    LEVEL: 'debug', // 'debug', 'info', 'warn', 'error' - temporarily set to debug
    PREFIX: '[TFT-EXT]',
  },
}; 