# TFT Template Images

This directory contains template images used for computer vision-based TFT element detection.

## Required Templates

### Augments

- `augment-slot.png` - Empty augment slot
- `augment-selected.png` - Selected augment highlight
- `augment-available.png` - Available augment indicator

### Champions

- `champion-1-cost.png` - 1-cost champion border
- `champion-2-cost.png` - 2-cost champion border
- `champion-3-cost.png` - 3-cost champion border
- `champion-4-cost.png` - 4-cost champion border
- `champion-5-cost.png` - 5-cost champion border

### UI Elements

- `gold-indicator.png` - Gold display area
- `shop-area.png` - Shop area background
- `level-indicator.png` - Player level display
- `health-bar.png` - Health bar element

### Game Elements

- `hex-empty.png` - Empty board hex
- `hex-occupied.png` - Occupied board hex
- `bench-slot.png` - Bench slot template

## Image Requirements

- **Format**: PNG with transparency
- **Size**: Recommended 32x32 to 128x128 pixels
- **Quality**: High contrast, clear edges
- **Background**: Transparent for best matching

## Capturing Templates

1. Take screenshots during TFT gameplay
2. Crop to isolate specific UI elements
3. Ensure consistent lighting/quality
4. Test at different stream resolutions
5. Verify template matching accuracy

## Usage

Templates are automatically loaded by the `CvProcessor` class and used for:

- Template matching with OpenCV.js
- Multi-scale detection (0.8x, 1.0x, 1.2x)
- Non-maximum suppression filtering
- Confidence threshold filtering (75%+)

## Testing

Use the "Test CV Processing" button in the extension popup to verify template detection is working correctly.
