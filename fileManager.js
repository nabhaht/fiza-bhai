/**
 * Google Drive file operations
 * Handles listing, searching, and uploading files
 */

/**
 * List files from Google Drive
 * @param {string} query - Optional search query
 */
async function listFiles(query = '') {
  if (!checkAuth()) return;
  
  showLoadingSpinner();
  try {
      const params = {
          pageSize: 50, // Increased for more files
          fields: 'files(id, name, mimeType, iconLink, modifiedTime, size, thumbnailLink)',
          orderBy: 'modifiedTime desc'
      };
      
      if (query) {
          params.q = `name contains '${query}'`;
      }
      
      const response = await gapi.client.drive.files.list(params);
      displayFiles(response.result.files);
  } catch (error) {
      console.error('Error fetching files:', error);
      showError('Could not load files. Please try again.');
  } finally {
      hideLoadingSpinner();
  }
}

/**
* Upload a file to Google Drive
* @param {File} file - The file to upload
*/
async function uploadFile(file) {
  if (!checkAuth() || !file) return;
  
  showLoadingSpinner();
  try {
    const metadata = {
      name: file.name,
      mimeType: file.type
    };
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      
      const contentType = file.type || 'application/octet-stream';
      const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + contentType + '\r\n\r\n' +
          content +
          close_delim;
      
      const request = gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
      });
      
      const response = await request;
      console.log('File uploaded:', response);
      showSuccess('File uploaded successfully!');
      
      // Refresh file list
      listFiles();
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    showError('Could not upload file. Please try again.');
    hideLoadingSpinner();
  }
}

/**
* Search for files by name
*/
function searchFiles() {
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    listFiles(query);
  } else {
    listFiles();
  }
}

/**
* Download a file from Google Drive
* @param {string} fileId - The ID of the file to download
*/
async function downloadFile(fileId) {
  if (!checkAuth()) return;
  
  try {
    // Get file metadata first to get the file name
    const metadataResponse = await gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'name'
    });
    
    const fileName = metadataResponse.result.name;
    
    // Get the file content
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    
    // Create a download link
    const blob = new Blob([response.body], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    showError('Could not download file. Please try again.');
  }
}

/**
* Delete a file from Google Drive
* @param {string} fileId - The ID of the file to delete
*/
async function deleteFile(fileId) {
  if (!checkAuth()) return;
  
  if (!confirm('Are you sure you want to delete this file?')) {
    return;
  }
  
  showLoadingSpinner();
  try {
    await gapi.client.drive.files.delete({
      fileId: fileId
    });
    
    showSuccess('File deleted successfully!');
    listFiles(); // Refresh the file list
  } catch (error) {
    console.error('Error deleting file:', error);
    showError('Could not delete file. Please try again.');
  } finally {
    hideLoadingSpinner();
  }
}