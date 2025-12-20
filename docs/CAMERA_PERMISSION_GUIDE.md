# Camera Permission Troubleshooting Guide

## Error: "NotAllowedError: Permission denied"

This error occurs when the browser blocks access to your camera. Follow the steps below based on your browser.

---

## 🌐 Google Chrome / Microsoft Edge

### Method 1: Click the Camera Icon in Address Bar

1. Look at your browser's address bar (where the URL is)
2. Find the **camera icon** (🎥) or **lock/info icon** (🔒)
3. Click on it
4. Change the camera setting from "Block" to **"Allow"**
5. **Refresh the page** (F5 or Ctrl+R)

### Method 2: Browser Settings

1. Click the **three dots** (⋮) in the top-right corner
2. Go to **Settings** → **Privacy and security** → **Site settings**
3. Click on **Camera**
4. Make sure camera access is not blocked
5. Under "Allowed", add `http://localhost:5173`
6. **Refresh your application**

### Method 3: Reset Site Permissions

1. In the address bar, click the **lock icon** (🔒)
2. Click **"Site settings"**
3. Find **Camera** and set it to **"Allow"**
4. **Refresh the page**

---

## 🦊 Mozilla Firefox

### Method 1: Permission Prompt

1. Look for the **permission prompt** that appears when you first load the page
2. Click **"Allow"**
3. Check the box for **"Remember this decision"** (optional)

### Method 2: Address Bar Icon

1. Look for the **camera icon** (🎥) in the address bar
2. Click it and select **"Allow Camera"**
3. **Refresh the page**

### Method 3: Page Info

1. Click the **lock icon** (🔒) in the address bar
2. Click **"Connection secure"** → **"More information"**
3. Go to the **Permissions** tab
4. Find **"Use the Camera"** and check **"Allow"**
5. **Refresh the page**

---

## 🧭 Safari (macOS)

### Method 1: Safari Preferences

1. Click **Safari** in the menu bar → **Settings** (or Preferences)
2. Go to the **Websites** tab
3. Click **Camera** in the left sidebar
4. Find `localhost` and change the dropdown to **"Allow"**
5. **Refresh the page**

### Method 2: System Preferences (macOS)

1. Open **System Preferences** → **Security & Privacy**
2. Click the **Privacy** tab
3. Select **Camera** from the left list
4. Make sure **Safari** is checked
5. Restart Safari and **refresh the page**

---

## 🔧 General Troubleshooting Steps

### Step 1: Check if Camera is Working

1. Open your system's camera app (Windows Camera, macOS Photo Booth, etc.)
2. Verify the camera turns on and shows video
3. If it doesn't work, your camera may have a hardware issue

### Step 2: Check Browser Permissions

```
Chrome/Edge:    chrome://settings/content/camera
Firefox:        about:preferences#privacy (scroll to Permissions)
Safari:         Safari → Settings → Websites → Camera
```

### Step 3: Close Conflicting Applications

**Common apps that use the camera:**
- Zoom
- Microsoft Teams
- Skype
- Discord
- OBS Studio
- Other browser tabs with video calls

**How to fix:**
1. Close all these applications
2. Refresh your browser page
3. Try accessing the camera again

### Step 4: Restart Your Browser

1. **Completely close** your browser (not just the tab)
   - Windows: Right-click taskbar icon → Close all windows
   - macOS: Cmd+Q to quit completely
2. **Reopen** the browser
3. Navigate back to the application

### Step 5: Check for Browser Updates

1. Update your browser to the latest version
2. Outdated browsers may have permission bugs

### Step 6: Try a Different Browser

If one browser isn't working, try:
- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari (macOS)

---

## 🔒 HTTPS vs HTTP

**Important:** Camera access requires either:
- ✅ **HTTPS** (secure connection)
- ✅ **localhost** (development)

If you deploy to production, you **must use HTTPS**.

---

## 🪟 Windows-Specific Issues

### Check Windows Camera Privacy Settings

1. Open **Settings** → **Privacy** → **Camera**
2. Make sure **"Allow apps to access your camera"** is **ON**
3. Scroll down and ensure **"Allow desktop apps to access your camera"** is **ON**
4. Restart your browser

### Check Camera is Not Disabled

1. Open **Device Manager** (Win+X → Device Manager)
2. Expand **Cameras** or **Imaging devices**
3. Right-click your camera
4. If it says **"Enable device"**, click it

---

## 🍎 macOS-Specific Issues

### System Preferences

1. Go to **System Preferences** → **Security & Privacy**
2. Click the **Privacy** tab
3. Select **Camera** from the left
4. Check the box next to your browser (Chrome, Safari, Firefox, etc.)
5. You may need to click the **lock icon** 🔒 and enter your password
6. Restart the browser

---

## 🐧 Linux-Specific Issues

### Check Camera Device

```bash
# List video devices
ls /dev/video*

# Test camera with V4L2
v4l2-ctl --list-devices
```

### Grant Browser Permissions

For **Snap** browsers:
```bash
sudo snap connect chromium:camera
```

For **Flatpak** browsers:
```bash
flatpak override --user --device=all org.mozilla.firefox
```

---

## 📱 Mobile Browsers (iOS/Android)

### iOS (Safari/Chrome)

1. Go to **Settings** → **Safari** (or **Chrome**)
2. Scroll to **Camera**
3. Set to **"Ask"** or **"Allow"**
4. Refresh the page

### Android (Chrome)

1. Long-press the app icon → **App info**
2. Tap **Permissions** → **Camera**
3. Select **"Allow only while using the app"**
4. Refresh the page

---

## 🆘 Still Not Working?

### Check the Browser Console

1. Press **F12** to open Developer Tools
2. Go to the **Console** tab
3. Look for error messages
4. Common errors and solutions:

| Error | Solution |
|-------|----------|
| `NotAllowedError` | Allow camera permissions |
| `NotFoundError` | Connect a camera device |
| `NotReadableError` | Close other apps using camera |
| `OverconstrainedError` | Camera doesn't support requested resolution |

### Try These Diagnostic Steps

```javascript
// Test camera access in browser console (F12)
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera access granted!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('❌ Camera error:', err.name, err.message);
  });
```

---

## 🎥 Camera Requirements

Your camera must support:
- **Resolution:** At least 320x240 (640x480 recommended)
- **Format:** Standard webcam (USB or built-in)
- **Drivers:** Up-to-date drivers installed

---

## ✅ Verification Checklist

- [ ] Camera works in other applications
- [ ] Browser has camera permission
- [ ] No other app is using the camera
- [ ] Browser is up to date
- [ ] Using HTTPS or localhost
- [ ] System camera privacy settings enabled
- [ ] Camera device is enabled (not disabled in Device Manager)
- [ ] Tried restarting browser completely

---

## 📞 Need More Help?

1. Check what error appears in the application
2. Look for the specific error message in browser console (F12)
3. Review the error type:
   - **NotAllowedError** → Permissions issue
   - **NotFoundError** → No camera detected
   - **NotReadableError** → Camera in use
   - **OverconstrainedError** → Camera doesn't support settings

---

## 🔐 Security Note

Browsers block camera access by default for security. This is **normal** and **protects your privacy**. Always verify you trust the website before granting camera access.

✅ **Safe:** `localhost` during development  
✅ **Safe:** HTTPS websites you trust  
❌ **Unsafe:** HTTP websites in production  
❌ **Unsafe:** Unknown or suspicious websites
