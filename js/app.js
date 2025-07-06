const CONFIG = {
  CLIENT_ID: '369545060808-tthl1fa0ium5sqlp6nfklo3vmpgf4vjp.apps.googleusercontent.com',
  API_KEY: 'AIzaSyAj9FKvxXKDEndBRaKYhZOWNeDJMmwUMdg',
  SCOPES: 'https://www.googleapis.com/auth/drive.readonly', // Changed from drive.file to see all files
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};

/**
* Main application initialization
* Contains configuration and app initialization
*/

// Track initialization status
let gapiInited = false;
let gisInited = false;

/**
* Initialize the Google API client
*/
function initializeGAPI() {
gapi.load('client', async () => {
  try {
    await gapi.client.init({
      apiKey: CONFIG.API_KEY,
      discoveryDocs: CONFIG.DISCOVERY_DOCS
    });
    gapiInited = true;
    maybeEnableButtons();
    console.log('Google API client initialized');
  } catch (error) {
    console.error('Error initializing Google API client:', error);
    showError('Failed to initialize the application. Please refresh and try again.');
  }
});
}

/**
* Enable buttons when APIs are ready
*/
function maybeEnableButtons() {
if (gapiInited && gisInited) {
  document.getElementById('authorizeButton').style.display = 'inline-block';
}
}

/**
* Initialize application and set up event listeners
*/
function initApp() {
// Initialize APIs
initializeGAPI();
initializeGIS();
gisInited = true;

// Set up event listeners
document.getElementById('authorizeButton').addEventListener('click', handleAuthClick);
document.getElementById('signoutButton').addEventListener('click', handleSignoutClick);
document.getElementById('searchButton').addEventListener('click', searchFiles);
document.getElementById('uploadButton').addEventListener('click', handleFileUpload);

// Search on Enter key press
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchFiles();
  }
});
}

/**
* Handle file upload button click
*/
function handleFileUpload() {
const fileInput = document.getElementById('fileInput');
if (fileInput.files.length > 0) {
  uploadFile(fileInput.files[0]);
} else {
  showError('Please select a file to upload');
}
}

// Start application when window loads
window.onload = initApp;