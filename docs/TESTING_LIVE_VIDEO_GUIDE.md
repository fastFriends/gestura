# 🎥 Testing Real-Time ASL Translation - Step-by-Step Guide

## Prerequisites Checklist
- [ ] Google Colab notebook is running with inference server
- [ ] Backend server is running
- [ ] Frontend is running
- [ ] Camera is connected and working
- [ ] Browser camera permissions granted

---

## Step 1: Start Google Colab Inference Server

### 1.1 Open the Notebook
1. Go to Google Colab: https://colab.research.google.com/
2. Open `asl_model_inferance.ipynb`
3. Connect to a runtime (Runtime → Connect)
   - ⚡ **Recommended:** Use GPU runtime for faster inference
   - Go to Runtime → Change runtime type → GPU → Save

### 1.2 Run Setup Cells
Execute these cells in order (Click play button or Shift+Enter):

**Cell 1:** Install dependencies
```python
!pip install mediapipe opencv-python
```

**Cell 4:** Mount Google Drive
```python
from google.colab import drive
drive.mount('/content/drive', force_remount=True)
```

**Cell 9:** Configure paths (verify your paths are correct)
```python
MODEL_TYPE = 'gru'  # or 'transformer'
GRU_CKPT = Path('/content/drive/MyDrive/MS_ASL/asl-model-gru/best.pth')
# ... other paths
```

**Cells 5-22:** Run all cells from importing libraries to loading the model

### 1.3 Install Flask & Ngrok
**Cell 23:** Install Flask dependencies
```python
!pip install flask flask-cors pyngrok
```

### 1.4 Set Ngrok Auth Token
Create a new cell and run:
```python
from pyngrok import ngrok
ngrok.set_auth_token("YOUR_NGROK_TOKEN")
```
Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### 1.5 Start the API Server
**Cell 25:** Run the Flask server cell

You should see output like:
```
🚀 ASL Inference API is running!
📡 Public URL: https://a0d84d8bec50.ngrok-free.app
```

**⚠️ IMPORTANT:** Copy this URL! You'll need it for the backend.

### 1.6 Test the Server
In a new cell, test if it's working:
```python
import requests
response = requests.get(f"{public_url}/api/health")
print(response.json())
```

Should return:
```json
{
  "status": "healthy",
  "model_type": "gru",
  "num_classes": 100,
  "device": "cuda:0"
}
```

✅ **Colab server is ready!** Keep this notebook running.

---

## Step 2: Configure Backend

### 2.1 Update Environment File
Your `.env` file already has:
```env
COLAB_INFERENCE_URL=https://a0d84d8bec50.ngrok-free.app/
```

✅ **Already configured!**

⚠️ **Note:** If you restart Colab, the ngrok URL will change. Update it here.

### 2.2 Start Backend Server

Open terminal in backend directory:
```powershell
cd "d:\Live Sign Language Translator UI\backend"
```

Activate your virtual environment (if using one):
```powershell
# If you have a venv
.\venv\Scripts\activate
```

Start the server:
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2.3 Test Backend Connection

Open a new PowerShell window and test:
```powershell
# Test health endpoint
curl http://localhost:8000/api/translate/status

# Or using Invoke-WebRequest
Invoke-WebRequest -Uri "http://localhost:8000/api/translate/status" -Headers @{"Authorization"="Bearer YOUR_TOKEN"}
```

✅ **Backend is ready!**

---

## Step 3: Start Frontend

### 3.1 Open Terminal in Frontend Directory
```powershell
cd "d:\Live Sign Language Translator UI\frontend"
```

### 3.2 Install Dependencies (if not already done)
```powershell
npm install
```

### 3.3 Start Development Server
```powershell
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Frontend is running!**

---

## Step 4: Access the Application

### 4.1 Open Browser
1. Open your browser (Chrome, Edge, or Firefox recommended)
2. Navigate to: **http://localhost:5173**

### 4.2 Login/Signup
1. If you have an account, click **Login**
2. Otherwise, click **Sign Up** and create an account
3. Enter your credentials and login

---

## Step 5: Test Camera Permissions

### 5.1 Navigate to Personal Page
1. After logging in, you'll see the sidebar
2. Click on **"Personal"** (Practice Mode)

### 5.2 Grant Camera Access
When the page loads, your browser will ask for camera permission:

**Chrome/Edge:**
- A popup will appear at the top: "localhost wants to use your camera"
- Click **"Allow"**

**Firefox:**
- A dropdown will appear from the address bar
- Click **"Allow"**

**If you accidentally clicked "Block":**
1. Look for the camera icon (🎥) in the address bar
2. Click it → Select "Allow"
3. Refresh the page (F5)

### 5.3 Verify Video Feed
You should see:
- ✅ Your live camera feed in the main video area
- ✅ Green "Ready" status indicator (top-left)
- ✅ Video controls at the bottom

**If video doesn't appear:**
- Check browser console (F12) for errors
- Verify camera is not being used by another app
- Try clicking the video button to toggle it

---

## Step 6: Start Real-Time Translation

### 6.1 Check Service Status
Look at the top-left corner of the video:
- 🟢 **Green "Ready"** = Service connected ✅
- 🟡 **Yellow "Offline"** = Service unavailable ❌

**If "Offline":**
1. Check that Colab notebook is still running
2. Verify backend is running
3. Check backend console for errors

### 6.2 Start Translation
1. Position yourself in front of the camera
2. Make sure your hands are visible
3. Click the large **blue translation button** (center controls)
   - It has a 🌐 Languages icon
4. The button should light up with a ring around it

### 6.3 What Happens Next

**Buffering Phase (6-7 seconds):**
- Bottom overlay shows: "Collecting frames... X/32"
- Status: "Processing" with blue indicator
- Wait for the buffer to fill

**Translation Active:**
- Overlay changes to show predicted sign
- Large bold text displays the current prediction
- Status changes to "Live" with green indicator
- Right panel logs translations with confidence scores

---

## Step 7: Perform ASL Signs

### 7.1 Supported Signs
The model recognizes **100 common ASL signs**, including:
- Greetings: hello, goodbye, good morning, good night
- Common phrases: thank you, please, sorry, welcome
- Questions: what, where, when, who, why, how
- Family: mother, father, sister, brother, family
- Basic words: yes, no, help, friend, water, food

### 7.2 Tips for Best Results

**Lighting:**
- ✅ Face a light source (window, lamp)
- ❌ Avoid backlighting (light behind you)
- Ensure hands are well-lit

**Positioning:**
- ✅ Center yourself in the frame
- ✅ Keep hands in view
- ✅ Chest to head should be visible
- ❌ Don't go too close or too far

**Signing:**
- ✅ Sign at moderate speed
- ✅ Hold signs for 2-3 seconds
- ✅ Make clear, distinct movements
- ❌ Don't rush between signs

**Camera:**
- ✅ Use a stable camera (not handheld phone)
- ✅ 640x480 or higher resolution
- ✅ Good quality webcam recommended

### 7.3 Example Testing Sequence

Try these signs in order:

1. **HELLO** 👋
   - Wave your hand
   - Hold for 2-3 seconds
   - Watch for prediction to appear

2. **THANK YOU** 🙏
   - Touch fingers to chin, move hand forward
   - Hold the ending position
   - Check confidence score

3. **YES** ✊
   - Make a fist
   - Nod the fist up and down
   - Observe the translation log

4. **NO** 🤚
   - Index and middle finger snap down to thumb
   - Hold the closed position

5. **PLEASE** 🙏
   - Flat hand on chest, circular motion
   - Complete the circle slowly

---

## Step 8: Monitor Performance

### 8.1 Check Translation Log (Right Panel)
Each prediction shows:
- **Time stamp:** When the sign was detected
- **Text:** The predicted ASL sign
- **Confidence:** Percentage (higher = more confident)
- **Color bar:** Visual confidence indicator

**Good predictions:**
- 🟢 90-100% confidence (dark green)
- 🟢 70-89% confidence (light green)

**Uncertain predictions:**
- 🟡 50-69% confidence (yellow) - might be incorrect
- 🔴 <50% confidence (not logged)

### 8.2 Check Browser Console (Optional)
Press **F12** to open Developer Tools:
- Look for errors in the Console tab
- Check Network tab for API calls to `/api/translate/frame`
- Should see requests every 200ms while translating

### 8.3 Check Backend Logs
In your backend terminal, you should see:
```
INFO:     POST /api/translate/frame
INFO:     200 OK
```

Repeated every 200ms while translation is active.

### 8.4 Check Colab Logs
In the Colab cell running Flask, you should see:
```
127.0.0.1 - - [date] "POST /api/predict-frame HTTP/1.1" 200 -
```

---

## Step 9: Understanding the Results

### 9.1 Real-Time Prediction Display
The main overlay shows:
- **Current prediction:** Large, bold text
- **Live indicator:** Green dot (updating in real-time)
- **Language pair:** ASL to English

### 9.2 Translation History
Right panel shows:
- All high-confidence predictions
- Scrollable list
- Download option for session transcript

### 9.3 Confidence Scores
- **95-100%:** Very confident, likely correct ✅
- **85-94%:** Confident, probably correct ✅
- **70-84%:** Moderate confidence, check the sign ⚠️
- **<70%:** Low confidence, not logged ❌

---

## Step 10: Troubleshooting

### Issue: "Service Unavailable"

**Check 1:** Is Colab running?
- Go back to Colab notebook
- Cell with Flask server should still be running
- Green checkmark + spinning indicator

**Check 2:** Is ngrok URL correct?
- Compare Colab output URL with `.env` file
- They must match exactly

**Check 3:** Test Colab directly
```powershell
curl https://your-ngrok-url.ngrok-free.app/api/health
```

### Issue: Slow Predictions

**Solutions:**
- Use GPU runtime in Colab
- Reduce frame rate (edit `Personal.tsx` line with `setInterval`)
- Check internet connection speed
- Close other browser tabs

### Issue: Inaccurate Predictions

**Solutions:**
- Improve lighting
- Position yourself better
- Hold signs longer (3-4 seconds)
- Check if sign is in supported vocabulary
- Try signing more deliberately

### Issue: "Buffering..." Never Ends

**Check:**
- Camera is actually on (video feed visible)
- No errors in browser console
- Backend is receiving frames
- Colab is processing requests

**Fix:**
- Click Stop → Wait 2 seconds → Click Start again
- Refresh the page
- Restart backend

### Issue: Camera Not Working

See `CAMERA_PERMISSION_GUIDE.md` for detailed troubleshooting.

---

## Step 11: Stop Translation

### 11.1 Stop the Session
1. Click the blue translation button again
2. Translation overlay disappears
3. Frame sending stops

### 11.2 Review Session
- Scroll through translation log
- Check confidence scores
- Download transcript (if implemented)

---

## Step 12: Clean Shutdown

### 12.1 Stop Frontend
In frontend terminal:
- Press **Ctrl+C**

### 12.2 Stop Backend
In backend terminal:
- Press **Ctrl+C**

### 12.3 Stop Colab (Optional)
- Disconnect from runtime (Runtime → Disconnect)
- **Note:** Free tier has usage limits
- Download session logs if needed

---

## 📊 Performance Metrics

### Expected Performance:
- **Frame rate:** 5 FPS (one frame every 200ms)
- **Buffer size:** 32 frames (~6.4 seconds)
- **Latency:** 1-2 seconds (frame capture + processing + network)
- **Accuracy:** 85-95% on supported signs with good conditions

### System Requirements:
- **Camera:** 640x480 minimum, 1280x720 recommended
- **Internet:** 5+ Mbps upload (for sending frames to Colab)
- **Browser:** Chrome 90+, Firefox 88+, Edge 90+
- **Colab:** GPU runtime recommended

---

## 🎓 Tips for Best Experience

1. **Practice common signs first** - Start with simple, clear signs
2. **Use good lighting** - Natural daylight or bright room lights
3. **Be patient during buffering** - Wait for full 32-frame buffer
4. **Hold signs clearly** - Don't rush, maintain position
5. **Check confidence scores** - Low scores mean unclear signs
6. **Learn from mistakes** - Review logged predictions
7. **Stable camera** - Mount webcam or use laptop camera
8. **Clear background** - Plain wall helps MediaPipe detection

---

## 📝 Vocabulary Reference

To check all 100 supported signs, you can:

1. **Query the API:**
```powershell
curl http://localhost:8000/api/translate/labels
```

2. **Check in Colab:**
```python
print(LABELS)  # In Colab after running Cell 14
```

3. **Browser Console:**
```javascript
fetch('http://localhost:8000/api/translate/labels', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => r.json()).then(console.log)
```

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ Video feed shows in real-time
- ✅ "Ready" status is green
- ✅ Predictions appear within 2 seconds of signing
- ✅ Confidence scores are above 70%
- ✅ Translation log updates automatically
- ✅ No errors in browser console
- ✅ Backend and Colab show successful requests

---

## 🎉 You're Done!

You now have a fully functional real-time ASL translation system running locally. Practice with different signs and improve your signing skills!

**Next Steps:**
- Record sessions for review
- Expand vocabulary with more signs
- Fine-tune model for better accuracy
- Deploy to production with proper hosting

**Resources:**
- `CAMERA_PERMISSION_GUIDE.md` - Camera troubleshooting
- `REALTIME_TRANSLATION_SETUP.md` - Initial setup guide
- Backend API docs: http://localhost:8000/docs
