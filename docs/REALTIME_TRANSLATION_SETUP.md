# Real-Time ASL Translation Setup Guide

This guide explains how to connect your webapp to the inference engine hosted on Google Colab for real-time sign language translation.

## Architecture Overview

```
Frontend (React) → Backend (FastAPI) → Google Colab (ML Model) → Predictions
     ↓                    ↓                      ↓
  Webcam           Frame Forwarding         Inference API
  Capture          + Auth                   (via Ngrok)
```

## Prerequisites

1. **Google Account** with access to Google Colab
2. **Ngrok Account** (free tier is sufficient)
   - Sign up at: https://dashboard.ngrok.com/signup
   - Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Trained Model Checkpoints** uploaded to Google Drive
   - GRU model checkpoint
   - Transformer model checkpoint
   - Vocabulary CSV file (100_words.csv)

## Step 1: Set Up Google Colab Inference Server

### 1.1 Upload Model to Google Drive

1. Open Google Drive
2. Create a folder structure like: `My Drive/MS_ASL/`
3. Upload your model checkpoints:
   - `asl-model-gru/best.pth`
   - `asl-model-transformer/best.pth`
   - `dataset/100_words.csv`

### 1.2 Configure and Run the Notebook

1. Open `asl_model_inferance.ipynb` in Google Colab
2. Update the paths in **Cell 9** to match your Google Drive structure:
   ```python
   GRU_CKPT = Path('/content/drive/MyDrive/MS_ASL/asl-model-gru/best.pth')
   TRANSFORMER_CKPT = Path('/content/drive/MyDrive/MS_ASL/asl-model-transformer/best.pth')
   WORDS_CSV = Path('/content/drive/MyDrive/MS_ASL/dataset/100_words.csv')
   ```

3. Run all cells up to **Cell 22** (stops at "Define Real-Time Frame Processing Function")

### 1.3 Set Ngrok Auth Token

In a new cell in Colab, run:
```python
from pyngrok import ngrok
ngrok.set_auth_token("YOUR_NGROK_AUTH_TOKEN_HERE")
```

Replace `YOUR_NGROK_AUTH_TOKEN_HERE` with your actual token from ngrok dashboard.

### 1.4 Start the Inference API Server

1. Run **Cell 25** ("Create Flask API Server with Ngrok Tunnel")
2. Wait for the server to start (10-15 seconds)
3. **Copy the ngrok public URL** from the output. It will look like:
   ```
   📡 Public URL: https://abc123.ngrok-free.app
   ```

⚠️ **Important**: Keep this Colab notebook running! The server must stay active for real-time translation.

## Step 2: Configure the Backend

### 2.1 Update Environment Variables

1. Navigate to the backend directory:
   ```powershell
   cd "d:\Live Sign Language Translator UI\backend"
   ```

2. Copy `.env.example` to `.env` if you haven't already:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Edit `.env` and add the ngrok URL from Colab:
   ```env
   COLAB_INFERENCE_URL=https://abc123.ngrok-free.app
   ```

### 2.2 Install Dependencies

Install the new required package:
```powershell
pip install httpx==0.25.2
```

Or reinstall all requirements:
```powershell
pip install -r requirements.txt
```

### 2.3 Start the Backend Server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend should now be running on http://localhost:8000

## Step 3: Configure and Run the Frontend

### 3.1 Install Dependencies (if needed)

Navigate to frontend directory:
```powershell
cd "d:\Live Sign Language Translator UI\frontend"
npm install
```

### 3.2 Configure API URL

Make sure your `.env` file in the frontend directory has:
```env
VITE_API_URL=http://localhost:8000
```

### 3.3 Start the Frontend

```powershell
npm run dev
```

The frontend should start on http://localhost:5173

## Step 4: Test the Real-Time Translation

### 4.1 Access the Application

1. Open your browser to http://localhost:5173
2. Log in or sign up for an account
3. Navigate to the **Personal** page (practice mode)

### 4.2 Grant Camera Permissions

When prompted, allow the browser to access your webcam.

### 4.3 Start Translation

1. Check the status indicator (top-left):
   - **Green "Ready"**: Service is connected ✅
   - **Yellow "Offline"**: Service unavailable ❌

2. Click the large **blue translation button** (center) to start
3. Perform ASL signs in front of your camera
4. Watch the predictions appear in real-time!

### 4.4 Translation Features

- **Real-time predictions**: Updates every 200ms (5 FPS)
- **Buffering phase**: First 32 frames (~6 seconds) are used to initialize
- **Confidence filtering**: Only high-confidence predictions (>70%) are logged
- **Translation log**: Right panel shows history with timestamps
- **Smooth transitions**: EMA smoothing reduces prediction flicker

## API Endpoints Reference

### Colab Inference API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check model status |
| `/api/labels` | GET | Get supported ASL signs |
| `/api/predict-frame` | POST | Process single frame |
| `/api/reset` | POST | Reset frame buffer |

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/translate/status` | GET | Check service status |
| `/api/translate/frame` | POST | Forward frame to Colab |
| `/api/translate/reset` | POST | Reset translation session |
| `/api/translate/labels` | GET | Get supported labels |

## Troubleshooting

### Issue: "Service unavailable" message

**Solution**:
1. Check if Colab notebook is still running
2. Verify the ngrok URL in backend `.env` is correct
3. Test the Colab health endpoint directly:
   ```bash
   curl https://your-ngrok-url.ngrok-free.app/api/health
   ```

### Issue: "Failed to access camera"

**Solution**:
1. Grant camera permissions in browser settings
2. Ensure no other app is using the camera
3. Try a different browser (Chrome/Edge recommended)

### Issue: Slow predictions

**Solution**:
1. Check your internet connection (affects Colab latency)
2. Use GPU runtime in Colab (Runtime → Change runtime type → GPU)
3. Reduce frame rate by increasing interval in `Personal.tsx` (line ~200ms)

### Issue: Ngrok tunnel expired

**Cause**: Free ngrok tunnels expire after 2 hours

**Solution**:
1. Stop the Flask cell in Colab (interrupt)
2. Run it again to get a new URL
3. Update backend `.env` with the new URL
4. Restart backend server

### Issue: Poor prediction accuracy

**Solution**:
1. Ensure good lighting conditions
2. Keep hands clearly visible in frame
3. Perform signs at moderate speed
4. Check if the sign is in the supported vocabulary (100 words)

## Performance Optimization

### For Better Latency:
- Use Google Colab Pro (faster GPUs)
- Deploy to a dedicated server instead of Colab
- Reduce video resolution in frontend (currently 640x480)

### For Better Accuracy:
- Increase frame rate (decrease interval)
- Use Transformer model instead of GRU
- Adjust confidence threshold
- Improve lighting and camera positioning

## Security Considerations

⚠️ **Important Security Notes**:

1. **Ngrok URLs are public**: Anyone with the URL can access your API
   - Consider adding authentication to the Flask API
   - Use ngrok's password protection feature
   - Monitor usage in ngrok dashboard

2. **Backend authentication**: Already implemented via JWT tokens
   - Users must be logged in to access translation endpoints
   - Tokens expire after 30 minutes

3. **Production deployment**: Don't use ngrok for production
   - Deploy model to a proper cloud service (AWS, GCP, Azure)
   - Use HTTPS and proper authentication
   - Implement rate limiting

## Next Steps

### Enhancements to Consider:

1. **Save Translation History**
   - Store translations in MongoDB
   - Allow users to review past sessions

2. **Video Recording**
   - Record signing sessions
   - Generate transcripts

3. **Multi-Language Support**
   - Add support for other sign languages (BSL, ISL, etc.)
   - Train additional models

4. **Offline Mode**
   - Package model with TensorFlow.js
   - Run inference in browser

5. **Mobile App**
   - Create React Native version
   - Optimize for mobile cameras

## Support

For issues or questions:
- Check the troubleshooting section above
- Review console logs in browser (F12)
- Check backend logs in terminal
- Verify Colab notebook cell outputs

## License

This project uses the following components:
- **MediaPipe**: Apache License 2.0
- **PyTorch**: BSD License
- **FastAPI**: MIT License
- **React**: MIT License
