# Creating Your First GitHub Release

The desktop app has been built successfully! Follow these steps to create a GitHub release:

## Step 1: Go to GitHub Releases

1. Go to: https://github.com/jishakambo-art/hackathon/releases
2. Click "Create a new release"

## Step 2: Create a Tag

1. In the "Choose a tag" dropdown, type: `v1.0.0`
2. Click "Create new tag: v1.0.0 on publish"

## Step 3: Fill in Release Details

- **Release title**: `DailyBrief Desktop v1.0.0`
- **Description**:
```markdown
## DailyBrief Desktop App

Download and run the desktop app to connect your NotebookLM account.

### ⚠️ Security Notice

This app is **not code-signed** (requires $99/year Apple Developer account). macOS will show a warning that it "cannot verify the developer" or "cannot check for malware." This is normal for open-source apps. The source code is fully visible in this repository.

### Installation

**Option 1: DMG (Recommended)**
1. Download `DailyBrief-Setup-Mac.dmg` below
2. Open the DMG file
3. Drag "DailyBrief Setup" to your Applications folder
4. **First Launch**: Right-click (or Control+click) the app in Applications and select "Open"
5. Click "Open" when macOS asks "Are you sure you want to open it?"
6. For subsequent launches, you can open it normally

**Option 2: ZIP**
1. Download `DailyBrief-Setup-Mac.zip` below
2. Extract the ZIP file
3. Drag "DailyBrief Setup.app" to your Applications folder
4. **First Launch**: Right-click (or Control+click) the app and select "Open"
5. Click "Open" when macOS asks "Are you sure you want to open it?"

**Alternative Method:**
If the above doesn't work, try this:
1. Try to open the app normally (it will be blocked)
2. Go to **System Settings** > **Privacy & Security**
3. Scroll down to find a message about "DailyBrief Setup"
4. Click **"Open Anyway"**
5. Click **"Open"** in the confirmation dialog

### Requirements
- macOS 10.13 or later
- Internet connection

### What's New (v1.0.0)
- Initial release
- NotebookLM authentication via browser
- Secure credential upload to server
- No unnecessary permission requests (Bluetooth, Camera, etc.)
- App closes properly when quit
```

## Step 4: Upload the Files

1. Click "Attach binaries by dropping them here or selecting them"

2. **Upload DMG** (Recommended):
   - Navigate to: `/Users/jishakambo/Documents/Hackathon/desktop/out/`
   - Upload: `DailyBrief-Setup.dmg`
   - Rename to: `DailyBrief-Setup-Mac.dmg`

3. **Upload ZIP** (Alternative):
   - Navigate to: `/Users/jishakambo/Documents/Hackathon/desktop/out/make/zip/darwin/x64/`
   - Upload: `DailyBrief Setup-darwin-x64-1.0.0.zip`
   - Rename to: `DailyBrief-Setup-Mac.zip`

## Step 5: Publish

1. Leave "Set as the latest release" checked
2. Click "Publish release"

## Done!

Users can now download the app from:
https://github.com/jishakambo-art/hackathon/releases/latest

The download button in your web app will automatically point to the latest release.
