# Security Notice for macOS Users

## Why does macOS show a security warning?

When you download and try to open the DailyBrief Setup app, macOS will show a warning:

> "DailyBrief Setup" cannot be opened because the developer cannot be verified.
> macOS cannot verify that this app is free from malware.

**This is expected and safe.** Here's why:

## Why isn't the app signed?

Apple requires a paid **Apple Developer Program** membership ($99/year) to code-sign apps. This is an open-source hackathon project, so the app is not code-signed.

## Is the app safe?

✅ **Yes, the app is safe:**
- All source code is visible in this public GitHub repository
- You can review exactly what the app does before installing
- The app only authenticates with NotebookLM - no other access required
- No telemetry, analytics, or data collection

## How to install (Bypass Gatekeeper)

### Method 1: Right-click to Open (Easiest)

1. **Right-click** (or Control+click) on "DailyBrief Setup" in your Applications folder
2. Select **"Open"**
3. Click **"Open"** in the confirmation dialog
4. The app will now open normally

### Method 2: System Settings

1. Try to open the app normally (it will be blocked)
2. Go to **System Settings** > **Privacy & Security**
3. Scroll down to the Security section
4. Find the message about "DailyBrief Setup was blocked"
5. Click **"Open Anyway"**
6. Click **"Open"** in the confirmation dialog

## What does the app do?

1. Opens a browser window to sign into Google/NotebookLM
2. Captures your authentication cookies (stored locally on your computer)
3. Uploads these credentials to the DailyBrief server
4. Closes automatically

**That's it!** After setup, you never need to run it again.

## Want to sign the app yourself?

If you have an Apple Developer account, you can build and sign the app yourself:

```bash
cd desktop
npm install
npm run make:dmg
# Then sign with: codesign --deep --force --sign "Your Developer ID" out/DailyBrief-Setup.dmg
```

## Questions?

If you have concerns about security, please:
- Review the source code in this repository
- Open an issue on GitHub
- Build the app from source yourself
