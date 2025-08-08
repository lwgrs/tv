// Google Drive API configuration
const CLIENT_ID = '288183935816-m664h9cl5uehdsq7ou35uirj9sn1r4fn.apps.googleusercontent.com'; // Replace with your actual Client ID
const API_KEY = ''; // We'll use OAuth only, no API key needed
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapi_inited = false;
let gis_inited = false;

// Initialize the APIs
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapi_inited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gis_inited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapi_inited && gis_inited) {
        document.getElementById('drive-auth-btn').style.display = 'inline-block';
    }
}

// Handle authentication
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('drive-auth-btn').style.display = 'none';
        document.getElementById('drive-sync-btn').style.display = 'inline-block';
        document.getElementById('drive-load-btn').style.display = 'inline-block';
        document.getElementById('drive-status').innerHTML = '✅ Connected to Google Drive';
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// Save data to Google Drive
async function syncToGoogleDrive() {
    try {
        // Get your TV data (assuming you have a function to get all data)
        const tvData = getAllTVData(); // You'll need to implement this based on your existing code
        
        const fileName = 'tv-show-tracker-data.json';
        const fileMetadata = {
            'name': fileName
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
        form.append('file', new Blob([JSON.stringify(tvData, null, 2)], {type: 'application/json'}));
        
        // Check if file already exists
        const existingFiles = await gapi.client.drive.files.list({
            q: `name='${fileName}'`,
            spaces: 'drive'
        });
        
        let response;
        if (existingFiles.result.files.length > 0) {
            // Update existing file
            const fileId = existingFiles.result.files[0].id;
            response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: new Headers({
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                }),
                body: form
            });
        } else {
            // Create new file
            response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                }),
                body: form
            });
        }
        
        if (response.ok) {
            document.getElementById('drive-status').innerHTML = '✅ Data saved to Google Drive!';
            setTimeout(() => {
                document.getElementById('drive-status').innerHTML = '✅ Connected to Google Drive';
            }, 3000);
        } else {
            throw new Error('Failed to save to Drive');
        }
        
    } catch (error) {
        console.error('Error saving to Google Drive:', error);
        document.getElementById('drive-status').innerHTML = '❌ Error saving to Google Drive';
    }
}

// Load data from Google Drive
async function loadFromGoogleDrive() {
    try {
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
        
        // Load the data (you'll need to implement this based on your existing import code)
        loadTVData(tvData); // You'll need to implement this
        
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

// Initialize when page loads
window.addEventListener('load', () => {
    gapiLoaded();
    gisLoaded();
});