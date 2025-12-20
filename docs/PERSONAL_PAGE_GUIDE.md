# Personal Page - Real-Time ASL Translation

## Features

### Status Indicators (Top-Left)
- **🟢 Ready**: Translation service connected and ready
- **🟡 Offline**: Service unavailable (check backend/Colab)

### Translation Button (Center)
Large blue button with language icon:
- Click to **START** real-time translation
- Click again to **STOP**
- Disabled when service offline or camera off

### Translation Display
**While translating:**
- **Buffering Phase**: "Collecting frames... X/32"
  - First ~6 seconds to build temporal context
- **Active Translation**: Large text showing current prediction
  - Updates in real-time as you sign
  - EMA smoothing for stable results

### Translation Log (Right Panel)
- Shows history of detected signs
- Each entry includes:
  - Timestamp (MM:SS)
  - Predicted text
  - Confidence percentage
  - Confidence bar (green)
- Only high-confidence predictions (>70%) are logged
- Keeps last 20 translations
- Download button to export log

### Quick Settings Panel
- **Sign Language**: Select ASL, BSL, ISL, JSL (currently ASL only)
- **Voice Output**: Enable/disable text-to-speech
- **Recording**: Save session video
- **Statistics**: View performance metrics

## How to Use

### Getting Started
1. **Ensure service is connected** (green "Ready" badge)
2. **Allow camera access** when prompted
3. **Position yourself** in frame with good lighting
4. Click the **translation button** to start

### Best Practices for Accurate Translation
✅ **Do:**
- Keep hands clearly visible in camera view
- Use good, even lighting
- Perform signs at moderate speed
- Wait for buffering to complete (32 frames)
- Check that your sign is in the vocabulary

❌ **Don't:**
- Rush through signs too quickly
- Obscure hands or face
- Use backlighting
- Expect instant results (buffering needed)
- Sign outside of camera view

### Understanding Predictions

**Confidence Levels:**
- **90-100%**: Very confident - highly reliable ✅
- **70-89%**: Good confidence - reliable ✓
- **50-69%**: Moderate - may be uncertain ⚠️
- **<50%**: Low confidence - not logged ❌

**Buffer Status Messages:**
- "Initializing...": Resetting for new session
- "Collecting frames... X/32": Building temporal window
- "Waiting for signs...": Ready but no clear signs detected
- "Processing": Analyzing current frame sequence

## Technical Details

### Frame Processing
- **Capture Rate**: 5 FPS (every 200ms)
- **Sequence Length**: 32 frames (~6.4 seconds)
- **Processing**: Sliding window with EMA smoothing
- **Latency**: ~200-500ms depending on connection

### Data Flow
```
Camera → Canvas → Base64 → Backend → Colab → ML Model
                                              ↓
                                       Prediction
                                              ↓
Results ← Frontend ← Backend ← Response ← Colab
```

### Performance Tips
- **Good internet**: Reduces latency to Colab
- **Stable pose**: Helps landmark detection
- **Consistent lighting**: Improves tracking
- **Clear background**: Reduces false detections

## Keyboard Shortcuts
- `Space`: Toggle translation on/off (coming soon)
- `R`: Reset translation buffer (coming soon)
- `S`: Take screenshot (coming soon)

## Troubleshooting

### "Service unavailable"
→ Check backend is running and Colab notebook is active

### "Failed to access camera"
→ Grant camera permissions in browser settings

### Predictions are slow
→ Check internet speed, consider reducing frame rate

### Predictions are inaccurate
→ Improve lighting, keep hands visible, sign clearly

### Translation not starting
→ Ensure "Ready" status and camera is on

## Supported Signs

Currently supports **100 ASL signs** including:
- Common greetings (hello, goodbye, thank you)
- Questions (what, when, where, why, how)
- Daily phrases (yes, no, please, sorry)
- And 93 more...

To see the full list, click **Statistics** → **View Vocabulary** (coming soon)

## Privacy & Data

- **Video processing**: All in-browser, frames not stored
- **Frame transmission**: Sent to backend/Colab as base64
- **Translation log**: Stored locally in browser session
- **No persistent storage**: Data cleared on page refresh
- **User authentication**: Required for API access

---

**Need help?** Check the main setup guide: `REALTIME_TRANSLATION_SETUP.md`
