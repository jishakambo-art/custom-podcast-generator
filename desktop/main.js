const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { chromium } = require('playwright');
const fs = require('fs').promises;
const fetch = require('node-fetch');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f9fafb',
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Authenticate with NotebookLM
let currentBrowser = null;
let currentContext = null;

ipcMain.handle('authenticate-notebooklm', async (event, userId) => {
  try {
    console.log('Starting NotebookLM authentication for user:', userId);

    // Create credentials directory
    const credentialsDir = path.join(app.getPath('userData'), 'notebooklm_credentials');
    await fs.mkdir(credentialsDir, { recursive: true });

    const credentialsPath = path.join(credentialsDir, `${userId}.json`);

    // Launch browser for authentication
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--password-store=basic',
      ],
    });

    currentBrowser = browser;

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    currentContext = context;

    const page = await context.newPage();

    // Navigate to NotebookLM
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });

    console.log('Browser opened, waiting for user to complete authentication');

    // Return immediately - the frontend will wait for user confirmation
    return {
      success: true,
      message: 'Browser opened, waiting for authentication',
      credentialsPath,
      needsConfirmation: true,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    if (currentBrowser) {
      await currentBrowser.close();
      currentBrowser = null;
      currentContext = null;
    }
    return {
      success: false,
      message: error.message,
    };
  }
});

// Complete NotebookLM authentication after user confirms
ipcMain.handle('complete-notebooklm-auth', async (event, userId) => {
  try {
    if (!currentContext || !currentBrowser) {
      throw new Error('No active browser session');
    }

    console.log('Completing NotebookLM authentication for user:', userId);

    const credentialsDir = path.join(app.getPath('userData'), 'notebooklm_credentials');
    await fs.mkdir(credentialsDir, { recursive: true });

    const credentialsPath = path.join(credentialsDir, `${userId}.json`);

    console.log('Saving credentials to:', credentialsPath);

    // Save storage state (cookies, localStorage, etc.)
    await currentContext.storageState({ path: credentialsPath });

    console.log('Credentials file saved');

    // Close browser
    await currentBrowser.close();
    currentBrowser = null;
    currentContext = null;

    console.log('Browser closed, authentication completed');

    return {
      success: true,
      message: 'Successfully authenticated with NotebookLM',
      credentialsPath,
    };
  } catch (error) {
    console.error('Complete authentication error:', error);
    if (currentBrowser) {
      await currentBrowser.close();
      currentBrowser = null;
      currentContext = null;
    }
    return {
      success: false,
      message: error.message,
    };
  }
});

// Upload credentials to server
ipcMain.handle('upload-credentials', async (event, { userId, token, apiUrl }) => {
  try {
    console.log('Uploading credentials to server for user:', userId);
    console.log('API URL:', apiUrl);

    const credentialsDir = path.join(app.getPath('userData'), 'notebooklm_credentials');
    const credentialsPath = path.join(credentialsDir, `${userId}.json`);

    console.log('Reading credentials from:', credentialsPath);

    // Check if file exists
    try {
      await fs.access(credentialsPath);
    } catch (err) {
      throw new Error(`Credentials file not found at ${credentialsPath}. Make sure you completed the NotebookLM sign-in.`);
    }

    // Read credentials file
    const credentialsData = await fs.readFile(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsData);

    console.log('Credentials loaded, uploading to server...');

    // Upload to server
    const response = await fetch(`${apiUrl}/auth/notebooklm/upload-credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        credentials: credentials,
      }),
    });

    console.log('Server response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      let errorDetail;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(errorDetail || 'Failed to upload credentials');
    }

    const result = await response.json();

    console.log('Credentials uploaded successfully:', result);

    return {
      success: true,
      message: 'Credentials uploaded successfully',
      result,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
});

// Open external URL
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});
