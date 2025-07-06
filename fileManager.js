/**
 * Google Drive File Operations
 * Handles listing, searching, uploading, downloading, and deleting files
 */

/**
 * Configuration for Google Drive API
 */
const DRIVE_CONFIG = {
  API_PATH: '/upload/drive/v3/files',
  DEFAULT_PAGE_SIZE: 50,
  DEFAULT_FIELDS: 'files(id, name, mimeType, iconLink, modifiedTime, size, thumbnailLink)',
  DEFAULT_ORDER_BY: 'modifiedTime desc',
  MULTIPART_BOUNDARY: '-------314159265358979323846',
  DEFAULT_MIME_TYPE: 'application/octet-stream',
};

/**
 * Google Drive Service class to handle all file operations
 */
class GoogleDriveService {
  constructor() {
    this.authChecked = false;
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  async checkAuth() {
    if (!this.authChecked) {
      this.authChecked = true;
      if (!gapi?.client?.drive) {
        Logger.error('Google API client not initialized');
        showError('Please sign in before performing operations');
        return false;
      }
    }
    return await window.checkAuth();
  }

  /**
   * List files from Google Drive
   * @param {string} [query=''] - Optional search query
   * @returns {Promise<Array>} List of files
   */
  async listFiles(query = '') {
    if (!await this.checkAuth()) return [];

    showLoadingSpinner();
    try {
      const params = {
        pageSize: DRIVE_CONFIG.DEFAULT_PAGE_SIZE,
        fields: DRIVE_CONFIG.DEFAULT_FIELDS,
        orderBy: DRIVE_CONFIG.DEFAULT_ORDER_BY,
      };

      if (query) {
        params.q = `name contains '${query}'`;
      }

      Logger.info(`Listing files with query: ${query}`);
      const response = await gapi.client.drive.files.list(params);
      const files = response.result.files || [];
      displayFiles(files);
      Logger.info(`Successfully listed ${files.length} files`);
      return files;
    } catch (error) {
      Logger.error('Error fetching files', error);
      showError('Could not load files. Please try again.');
      return [];
    } finally {
      hideLoadingSpinner();
    }
  }

  /**
   * Upload a file to Google Drive
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload response
   */
  async uploadFile(file) {
    if (!await this.checkAuth() || !file) {
      Logger.warn('Upload aborted: Missing auth or file');
      showError('Please sign in and select a valid file');
      return null;
    }

    showLoadingSpinner();
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || DRIVE_CONFIG.DEFAULT_MIME_TYPE,
      };

      const reader = new FileReader();
      const readFilePromise = new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file); // Use ArrayBuffer for binary data
      });

      const content = await readFilePromise;
      const base64Data = this.arrayBufferToBase64(content);

      const delimiter = `\r\n--${DRIVE_CONFIG.MULTIPART_BOUNDARY}\r\n`;
      const closeDelimiter = `\r\n--${DRIVE_CONFIG.MULTIPART_BOUNDARY}--`;
      const contentType = file.type || DRIVE_CONFIG.DEFAULT_MIME_TYPE;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${contentType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        closeDelimiter;

      Logger.info(`Uploading file: ${file.name}, size: ${file.size} bytes`);
      const response = await gapi.client.request({
        path: DRIVE_CONFIG.API_PATH,
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': `multipart/related; boundary="${DRIVE_CONFIG.MULTIPART_BOUNDARY}"`,
        },
        body: multipartRequestBody,
      });

      Logger.info(`File uploaded successfully: ${file.name}`);
      showSuccess('File uploaded successfully!');
      await this.listFiles(); // Refresh file list
      return response.result;
    } catch (error) {
      Logger.error(`Error uploading file: ${file.name}`, error);
      showError(`Upload failed: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      hideLoadingSpinner();
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
   * @returns {string} Base64 encoded string
   */
  arrayBufferToBase64(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    } catch (error) {
      Logger.error('Error converting ArrayBuffer to Base64', error);
      throw new Error('Failed to encode file content');
    }
  }

  /**
   * Search for files by name
   * @returns {Promise<void>}
   */
  async searchFiles() {
    if (!await this.checkAuth()) return;

    const query = document.getElementById('searchInput')?.value.trim() || '';
    Logger.info(`Searching files with query: ${query}`);
    await this.listFiles(query);
  }

  /**
   * Download a file from Google Drive
   * @param {string} fileId - The ID of the file to download
   * @returns {Promise<void>}
   */
  async downloadFile(fileId) {
    if (!await this.checkAuth()) return;

    try {
      Logger.info(`Downloading file with ID: ${fileId}`);
      const metadataResponse = await gapi.client.drive.files.get({
        fileId,
        fields: 'name',
      });

      const fileName = metadataResponse.result.name;
      const response = await gapi.client.drive.files.get({
        fileId,
        alt: 'media',
      });

      const blob = new Blob([response.body], { type: DRIVE_CONFIG.DEFAULT_MIME_TYPE });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      Logger.info(`File downloaded: ${fileName}`);
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      Logger.error(`Error downloading file ID: ${fileId}`, error);
      showError('Could not download file. Please try again.');
    }
  }

  /**
   * Delete a file from Google Drive
   * @param {string} fileId - The ID of the file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    if (!await this.checkAuth()) return;

    if (!confirm('Are you sure you want to delete this file?')) {
      Logger.info('File deletion cancelled by user');
      return;
    }

    showLoadingSpinner();
    try {
      Logger.info(`Deleting file with ID: ${fileId}`);
      await gapi.client.drive.files.delete({ fileId });
      showSuccess('File deleted successfully!');
      await this.listFiles();
    } catch (error) {
      Logger.error(`Error deleting file ID: ${fileId}`, error);
      showError('Could not delete file. Please try again.');
    } finally {
      hideLoadingSpinner();
    }
  }
}

/**
 * Initialize Google Drive Service
 * @returns {GoogleDriveService} Service instance
 */
const driveService = new GoogleDriveService();

// Expose async functions for global use (e.g., from HTML event handlers)
window.listFiles = async () => await driveService.listFiles();
window.uploadFile = async (file) => await driveService.uploadFile(file);
window.searchFiles = async () => await driveService.searchFiles();
window.downloadFile = async (fileId) => await driveService.downloadFile(fileId);
window.deleteFile = async (fileId) => await driveService.deleteFile(fileId);