/**
 * UI management functions
 */

/**
 * Display files in the UI
 * @param {Array} files - Array of file objects from Drive API
 */
function displayFiles(files) {
  const fileListElement = document.getElementById('fileList');
  
  if (!files || files.length === 0) {
    fileListElement.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No files found</p></div>';
    return;
  }
  
  let html = '<div class="files-grid">';
  
  files.forEach(file => {
    const fileSize = file.size ? formatFileSize(file.size) : '-';
    const modifiedDate = new Date(file.modifiedTime).toLocaleDateString();
    const thumbnailSrc = file.thumbnailLink || (file.iconLink || 'img/file-icon.png');
    
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
      window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
    });
  });
  
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileId = btn.dataset.id;
      downloadFile(fileId);
    });
  });
  
  // Make entire card clickable to view file
  document.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('click', () => {
      const fileId = card.dataset.id;
      window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
    });
  });
}

/**
* Update UI after successful authentication
*/
function updateUIAfterAuth() {
document.getElementById('authorizeButton').style.display = 'none';
document.getElementById('signoutButton').style.display = 'inline-block';
document.getElementById('content').style.display = 'block';

// Show a welcome message
showSuccess('Welcome! Now viewing your Google Drive files');
}

/**
* Format file size in human-readable format
* @param {number} bytes - File size in bytes
* @returns {string} Formatted file size
*/
function formatFileSize(bytes) {
if (bytes === 0) return '0 Bytes';

const k = 1024;
const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
const i = Math.floor(Math.log(bytes) / Math.log(k));

return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
* Show loading spinner
*/
function showLoadingSpinner() {
document.getElementById('loading').style.display = 'block';
}

/**
* Hide loading spinner
*/
function hideLoadingSpinner() {
document.getElementById('loading').style.display = 'none';
}

/**
* Update UI after sign out
*/
function updateUIAfterSignOut() {
document.getElementById('authorizeButton').style.display = 'inline-block';
document.getElementById('signoutButton').style.display = 'none';
document.getElementById('content').style.display = 'none';
document.getElementById('fileList').innerHTML = '';
}

/**
* Show error message
* @param {string} message - Error message to display
*/
function showError(message) {
// You can implement a toast notification system here
alert(message);
}

/**
* Show success message
* @param {string} message - Success message to display
*/
function showSuccess(message) {
// You can implement a toast notification system here
alert(message);
}