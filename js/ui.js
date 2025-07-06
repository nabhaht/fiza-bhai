/**
 * UI Manager class to handle all UI-related operations
 */
class UIManager {
  /**
   * Display files in the UI
   * @param {Array} files - Array of file objects from Drive API
   */
  displayFiles(files) {
    const fileListElement = document.getElementById('fileList');
    if (!fileListElement) {
      Logger.error('File list element not found');
      return;
    }

    fileListElement.innerHTML = '';
    if (!files || files.length === 0) {
      fileListElement.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No files found</p></div>';
      Logger.info('No files to display');
      return;
    }

    let html = '<div class="files-grid">';
    files.forEach(file => {
      const fileSize = file.size ? this.formatFileSize(file.size) : '-';
      const modifiedDate = new Date(file.modifiedTime).toLocaleDateString();
      const thumbnailSrc = file.thumbnailLink || file.iconLink || 'https://drive-thirdparty.googleusercontent.com/16/type/application/octet-stream';

      html += `
        <div class="file-card" data-id="${file.id}">
          <div class="file-icon">
            <img src="${thumbnailSrc}" alt="${file.name}" class="file-thumbnail">
          </div>
          <div class="file-details">
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-meta">
              <span>${fileSize}</span>
              <span>${modifiedDate}</span>
            </div>
          </div>
          <div class="file-actions">
            <button class="action-btn view-btn" data-id="${file.id}">View</button>
            <button class="action-btn download-btn" data-id="${file.id}">Download</button>
            <button class="action-btn delete-btn" data-id="${file.id}">Delete</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    fileListElement.innerHTML = html;

    // Add click listeners to file actions
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.id;
        if (fileId) {
          window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
          Logger.info(`Opening file view for ID: ${fileId}`);
        } else {
          Logger.error('View button clicked with no file ID');
          this.showError('Unable to view file: Invalid file ID');
        }
      });
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.id;
        if (fileId) {
          await window.downloadFile(fileId);
          Logger.info(`Initiated download for file ID: ${fileId}`);
        } else {
          Logger.error('Download button clicked with no file ID');
          this.showError('Unable to download file: Invalid file ID');
        }
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.id;
        if (fileId) {
          await window.deleteFile(fileId);
          Logger.info(`Initiated deletion for file ID: ${fileId}`);
        } else {
          Logger.error('Delete button clicked with no file ID');
          this.showError('Unable to delete file: Invalid file ID');
        }
      });
    });

    document.querySelectorAll('.file-card').forEach(card => {
      card.addEventListener('click', () => {
        const fileId = card.dataset.id;
        if (fileId) {
          window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
          Logger.info(`Opening file card view for ID: ${fileId}`);
        } else {
          Logger.error('File card clicked with no file ID');
          this.showError('Unable to view file: Invalid file ID');
        }
      });
    });

    Logger.info(`Displayed ${files.length} files in UI`);
  }

  /**
   * Update UI after successful authentication
   */
  updateUIAfterAuth() {
    const authorizeButton = document.getElementById('authorizeButton');
    const signoutButton = document.getElementById('signoutButton');
    const content = document.getElementById('content');

    if (authorizeButton) authorizeButton.style.display = 'none';
    if (signoutButton) signoutButton.style.display = 'inline-block';
    if (content) content.style.display = 'block';

    this.showSuccess('Welcome! Now viewing your Google Drive files');
    Logger.info('UI updated after authentication');
  }

  /**
   * Update UI after sign out
   */
  updateUIAfterSignOut() {
    const authorizeButton = document.getElementById('authorizeButton');
    const signoutButton = document.getElementById('signoutButton');
    const content = document.getElementById('content');
    const fileList = document.getElementById('fileList');

    if (authorizeButton) authorizeButton.style.display = 'inline-block';
    if (signoutButton) signoutButton.style.display = 'none';
    if (content) content.style.display = 'none';
    if (fileList) fileList.innerHTML = '';

    Logger.info('UI updated after sign out');
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Show loading spinner
   */
  showLoadingSpinner() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'block';
      Logger.info('Showing loading spinner');
    } else {
      Logger.warn('Loading spinner element not found');
    }
  }

  /**
   * Hide loading spinner
   */
  hideLoadingSpinner() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
      Logger.info('Hiding loading spinner');
    } else {
      Logger.warn('Loading spinner element not found');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
      Logger.error(message);
    } else {
      Logger.error(`Error message display failed: ${message}`);
      console.error(message); // Fallback to console
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message to display
   */
  showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
      setTimeout(() => {
        successDiv.style.display = 'none';
      }, 5000);
      Logger.info(message);
    } else {
      Logger.warn(`Success message display failed: ${message}`);
      console.log(message); // Fallback to console
    }
  }
}

/**
 * Initialize UI Manager
 * @returns {UIManager} UI Manager instance
 */
const uiManager = new UIManager();

// Expose functions for global use
window.displayFiles = (files) => uiManager.displayFiles(files);
window.updateUIAfterAuth = () => uiManager.updateUIAfterAuth();
window.updateUIAfterSignOut = () => uiManager.updateUIAfterSignOut();
window.showLoadingSpinner = () => uiManager.showLoadingSpinner();
window.hideLoadingSpinner = () => uiManager.hideLoadingSpinner();
window.showError = (message) => uiManager.showError(message);
window.showSuccess = (message) => uiManager.showSuccess(message);