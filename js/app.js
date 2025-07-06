/**
 * Main application initialization for Google Drive file operations
 * Configures Google API clients and sets up event listeners
 */

/**
 * Configuration for Google Drive API
 * Replace with your own client ID and API key from Google Cloud Console
 */
const APP_CONFIG = {
  CLIENT_ID: '141981759925-bpar7n0dl9st2vgi2dr2b0k6tqoqk7qh.apps.googleusercontent.com',
  API_KEY: 'AIzaSyBIVFDsoo9q6OGbBRKyIs7ulwXHGVI6_V0',
  SCOPES: 'https://www.googleapis.com/auth/drive',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};

/**
 * Application class to manage initialization and UI interactions
 */
class App {
  constructor() {
    this.gapiInited = false;
    this.gisInited = false;
    this.tokenExpiry = null;
    this.refreshInProgress = false;
  }

  /**
   * Initialize the Google API client
   * @returns {Promise<void>}
   */
  async initializeGAPI() {
    try {
      Logger.info('Initializing Google API client');
      await new Promise((resolve, reject) => {
        gapi.load('client', { callback: resolve, onerror: reject });
      });
      await gapi.client.init({
        apiKey: APP_CONFIG.API_KEY,
        discoveryDocs: APP_CONFIG.DISCOVERY_DOCS,
      });
      this.gapiInited = true;
      Logger.info('Google API client initialized');
      this.maybeEnableButtons();
    } catch (error) {
      Logger.error('Error initializing Google API client', error);
      window.showError('Failed to initialize the application. Please refresh and try again.');
    }
  }

  /**
   * Initialize the Google Identity Services client
   */
  initializeGIS() {
    try {
      Logger.info('Initializing Google Identity Services');
      google.accounts.id.initialize({
        client_id: APP_CONFIG.CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
      });
      this.gisInited = true;
      Logger.info('Google Identity Services initialized');
      this.maybeEnableButtons();
    } catch (error) {
      Logger.error('Error initializing Google Identity Services', error);
      window.showError('Failed to initialize authentication. Please refresh and try again.');
    }
  }

  /**
   * Handle credential response after user signs in
   * @param {Object} response - Credential response from Google
   */
  handleCredentialResponse(response) {
    try {
      if (!response.credential) {
        throw new Error('No credential received');
      }
      Logger.info('Google Identity Services authenticated');
      this.updateSigninStatus(true);
    } catch (error) {
      Logger.error('Error handling credential response', error);
      window.showError('Authentication failed. Please try again.');
    }
  }

  /**
   * Check if token is expired or about to expire
   * @returns {boolean} True if token needs refresh
   */
  needsRefresh() {
    if (!this.tokenExpiry) return true;
    
    // Check if token expires in less than 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes > this.tokenExpiry;
  }

  /**
   * Validate token with a test API call
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateToken() {
    try {
      // Make a lightweight API call to verify token validity
      await gapi.client.drive.about.get({
        fields: 'user'
      });
      Logger.debug('Token validated successfully');
      return true;
    } catch (error) {
      Logger.error('Token validation failed', error);
      return false;
    }
  }

  /**
   * Refresh the authentication token if needed
   * @returns {Promise<boolean>} True if token is valid after potential refresh
   */
  async refreshTokenIfNeeded() {
    const token = gapi.client.getToken();
    if (!token) {
      Logger.warn('No token found for refresh');
      return false;
    }
    
    if (this.needsRefresh() && !this.refreshInProgress) {
      Logger.info('Token needs refresh, requesting new token');
      this.refreshInProgress = true;
      
      try {
        return await new Promise((resolve) => {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: APP_CONFIG.CLIENT_ID,
            scope: APP_CONFIG.SCOPES,
            callback: (response) => {
              if (!response.error) {
                const expiresIn = response.expires_in || 3600;
                this.tokenExpiry = Date.now() + (expiresIn * 1000);
                Logger.info('Token refreshed successfully');
                resolve(true);
              } else {
                Logger.error('Failed to refresh token', response.error);
                this.refreshInProgress = false;
                resolve(false);
              }
            }
          });
          
          tokenClient.requestAccessToken({ prompt: '' });
        });
      } catch (error) {
        Logger.error('Error during token refresh', error);
        return false;
      } finally {
        this.refreshInProgress = false;
      }
    }
    
    return await this.validateToken();
  }

  /**
   * Enable buttons when APIs are ready
   */
  maybeEnableButtons() {
    if (this.gapiInited && this.gisInited) {
      const authorizeButton = document.getElementById('authorizeButton');
      if (authorizeButton) {
        authorizeButton.style.display = 'inline-block';
      }
      Logger.info('Buttons enabled: APIs initialized');
    }
  }

  /**
   * Update UI based on sign-in status
   * @param {boolean} isSignedIn - Whether the user is signed in
   */
  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      window.updateUIAfterAuth();
    } else {
      window.updateUIAfterSignOut();
    }
  }

  /**
   * Handle auth click event
   * @returns {Promise<void>}
   */
  async handleAuthClick() {
    try {
      Logger.info('Initiating authentication');
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: APP_CONFIG.CLIENT_ID,
        scope: APP_CONFIG.SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse && !tokenResponse.error) {
            Logger.info('Authentication successful');
            const expiresIn = tokenResponse.expires_in || 3600;
            this.tokenExpiry = Date.now() + (expiresIn * 1000);
            this.updateSigninStatus(true);
            await window.listFiles(); // Load files after sign-in
          } else {
            Logger.error('Authentication failed', tokenResponse?.error);
            this.updateSigninStatus(false);
            window.showError('Authentication failed. Please try again.');
          }
        },
      });
      tokenClient.requestAccessToken();
    } catch (error) {
      Logger.error('Error during authentication', error);
      window.showError('Authentication failed. Please try again.');
    }
  }

  /**
   * Handle sign out click event
   * @returns {Promise<void>}
   */
  async handleSignoutClick() {
    try {
      const token = gapi.client.getToken();
      if (token !== null) {
        Logger.info('Initiating sign out');
        await new Promise((resolve) => {
          google.accounts.oauth2.revoke(token.access_token, resolve);
        });
        gapi.client.setToken('');
        this.tokenExpiry = null;
        this.updateSigninStatus(false);
        Logger.info('User signed out');
      }
    } catch (error) {
      Logger.error('Error during sign out', error);
      window.showError('Sign out failed. Please try again.');
    }
  }

  /**
   * Initialize application and set up event listeners
   * @returns {Promise<void>}
   */
  async initApp() {
    Logger.info('Initializing application');
    await this.initializeGAPI();
    this.initializeGIS();

    // Set up event listeners
    const authorizeButton = document.getElementById('authorizeButton');
    const signoutButton = document.getElementById('signoutButton');
    const searchButton = document.getElementById('searchButton');
    const uploadButton = document.getElementById('uploadButton');
    const searchInput = document.getElementById('searchInput');

    if (authorizeButton) {
      authorizeButton.addEventListener('click', () => this.handleAuthClick());
    }
    if (signoutButton) {
      signoutButton.addEventListener('click', () => this.handleSignoutClick());
    }
    if (searchButton) {
      searchButton.addEventListener('click', async () => {
        await window.searchFiles();
      });
    }
    if (uploadButton) {
      uploadButton.addEventListener('click', async () => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput?.files?.length > 0) {
          await window.uploadFile(fileInput.files[0]);
        } else {
          window.showError('Please select a file to upload');
        }
      });
    }
    if (searchInput) {
      searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          await window.searchFiles();
        }
      });
    }

    Logger.info('Event listeners set up');
  }
}

// Create app instance
const app = new App();

// Start application when window loads
window.onload = async () => {
  await app.initApp();
  
  // Set global auth function for fileManager.js
  window.checkAuth = async () => await app.refreshTokenIfNeeded();
};