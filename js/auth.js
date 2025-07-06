/**
 * Authentication handling for Google Drive API
 */
let tokenClient = null;
let isAuthenticated = false;

/**
 * Initialize Google Identity Services
 */
function initializeGIS() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPES,
    callback: handleAuthResponse
  });
  console.log('Google Identity Services initialized');
}

/**
 * Handle authorization button click
 */
function handleAuthClick() {
  showLoadingSpinner();
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Handle the authentication response
 */
function handleAuthResponse(response) {
  hideLoadingSpinner();
  
  if (response.error) {
    console.error('Authentication error:', response);
    showError('Authentication failed. Please try again.');
    return;
  }
  
  isAuthenticated = true;
  updateUIAfterAuth();
  listFiles();
}

/**
 * Handle sign out button click
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token) {
    showLoadingSpinner();
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken('');
      isAuthenticated = false;
      updateUIAfterSignOut();
      hideLoadingSpinner();
    });
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function checkAuth() {
  return isAuthenticated;
}