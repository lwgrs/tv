// 288183935816-m664h9cl5uehdsq7ou35uirj9sn1r4fn.apps.googleusercontent.com
// Google Drive API configuration
const CLIENT_ID = '288183935816-m664h9cl5uehdsq7ou35uirj9sn1r4fn.apps.googleusercontent.com'; // Replace with your actual Client ID
const API_KEY = ''; // Not needed for this approach
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let isSignedIn = false;

// Make sure functions are available globally
window.handleAuthClick = handleAuthClick;
window.handleSignOutClick = handleSignOutClick;
window.syncToGoogleDrive = syncToGoogleDrive;
window.loadFromGoogleDrive = loadFromGoogleDrive;

// Initialize when page loads
window.addEventListener('load', () => {
    // Wait for gapi to be available
    if (typeof gapi === 'undefined') {
        console.error('Google API not loaded');
        return;
    }
    
    gapi.load('auth2', initAuth);
    gapi.load('client', initClient);
});

async function initClient() {
    await gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
    });
}

async function initAuth() {
    await gapi.auth2.init({
        client_id: CLIENT_ID,
    });
    
    const authInstance = gapi.auth2.getAuthInstance();
    isSignedIn = authInstance.isSignedIn.get();
    
    updateSignInStatus();
    
    // Listen for sign-in state changes
    authInstance.isSignedIn.listen(updateSignInStatus);
}

function updateSignInStatus() {
    const authInstance = gapi.auth2.getAuthInstance();
    isSignedIn = authInstance.isSignedIn.get();
    
    if (isSignedIn) {
        document.getElementById('drive-auth-btn').style.display = 'none';
        document.getElementById('drive-sync-btn').style.display = 'inline-block';
        document.getElementById('drive-load-btn').style.display = 'inline-block';
        document.getElementById('drive-status').innerHTML = '✅ Connected to Google Drive';
    } else {
        document.getElementById('drive-auth-btn').style.display = 'inline-block';
        document.getElementById('drive-sync-btn').style.display = 'none';
        document.getElementById('drive-load-btn').style.display = 'none';
        document.getElementById('drive-status').innerHTML = '';
    }
}

// Handle authentication
function handleAuthClick() {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn({
        scope: SCOPES
    });
}

// Handle sign out
function handleSignOutClick() {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut();
}

// Save data to Google Drive
async function syncToGoogleDrive() {
    try {
        if (!isSignedIn) {
            document.getElementById('drive-status').innerHTML = '❌ Please sign in first';
            return;
        }
        
        // Get your TV data
        const tvData = getAllTVData();
        
        const fileName = 'tv-show-tracker-data.json';
        const fileMetadata = {
            'name': fileName
        };
        
        // Check if file already exists
        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}'`,
            spaces: 'drive'
        });
        
        const fileContent = JSON.stringify(tvData, null, 2);
        
        if (response.result.files.length > 0) {
            // Update existing file
            const fileId = response.result.files[0].id;
            await gapi.client.request({
                'path': `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
                'method': 'PATCH',
                'params': {'uploadType': 'media'},
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': fileContent
            });
        } else {
            // Create new file
            await gapi.client.request({
                'path': 'https://www.googleapis.com/upload/drive/v3/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
                },
                'body': `--foo_bar_baz\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(fileMetadata)}\r\n--foo_bar_baz\r\nContent-Type: application/json\r\n\r\n${fileContent}\r\n--foo_bar_baz--`
            });
        }
        
        document.getElementById('drive-status').innerHTML = '✅ Data saved to Google Drive!';
        setTimeout(() => {
            document.getElementById('drive-status').innerHTML = '✅ Connected to Google Drive';
        }, 3000);
        
    } catch (error) {
        console.error('Error saving to Google Drive:', error);
        document.getElementById('drive-status').innerHTML = '❌ Error saving to Google Drive';
    }
}

// Load data from Google Drive
async function loadFromGoogleDrive() {
    try {
        if (!isSignedIn) {
            document.getElementById('drive-status').innerHTML = '❌ Please sign in first';
            return;
        }
        
        const fileName = 'tv-show-tracker-data.json';
        
        // Find the file
        const files = await gapi.client.drive.files.list({
            q: `name='${fileName}'`,
            spaces: 'drive'
        });
        
        if (files.result.files.length === 0) {
            document.getElementById('drive-status').innerHTML = '⚠️ No backup found in Google Drive';
            return;
        }
        
        const fileId = files.result.files[0].id;
        
        // Download the file content
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        const tvData = JSON.parse(response.body);
        
        // Load the data using the same logic as importJSON
        loadTVData(tvData);
        
        document.getElementById('drive-status').innerHTML = '✅ Data loaded from Google Drive!';
        setTimeout(() => {
            document.getElementById('drive-status').innerHTML = '✅ Connected to Google Drive';
        }, 3000);
        
    } catch (error) {
        console.error('Error loading from Google Drive:', error);
        document.getElementById('drive-status').innerHTML = '❌ Error loading from Google Drive';
    }
}

// Helper functions - using the exact same logic as the existing export/import
function getAllTVData() {
    // Use the same function that exportJSON() uses
    return getShowsObject();
}

function loadTVData(data) {
    // Use the same logic that importJSON() uses
    if (typeof data === "object" && typeof data.settings !== "undefined" && typeof data.shows !== "undefined") {
        commitToLS(data);
        refreshDisplay(data);
        markChanged(false);
    } else {
        console.error("Invalid data structure for TV data");
        document.getElementById('drive-status').innerHTML = '❌ Invalid data format';
    }
}

// Ensure functions are globally available
window.handleAuthClick = handleAuthClick;
window.handleSignOutClick = handleSignOutClick;
window.syncToGoogleDrive = syncToGoogleDrive;
window.loadFromGoogleDrive = loadFromGoogleDrive;