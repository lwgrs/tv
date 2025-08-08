// GitHub Gist configuration
const GITHUB_TOKEN = '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'; // Replace with your actual token
const GIST_FILENAME = 'tv-show-tracker-data.json';
const GIST_DESCRIPTION = 'TV Show Tracker Data Backup';

let currentGistId = null;

// Initialize when page loads
window.addEventListener('load', () => {
    // Check if we have a stored gist ID
    currentGistId = localStorage.getItem('tvTrackerGistId');
    updateGistStatus();
});

function updateGistStatus() {
    const statusDiv = document.getElementById('gist-status');
    const authBtn = document.getElementById('gist-auth-btn');
    const syncBtn = document.getElementById('gist-sync-btn');
    const loadBtn = document.getElementById('gist-load-btn');
    
    if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        statusDiv.innerHTML = '⚠️ Please add your GitHub token';
        authBtn.style.display = 'none';
        syncBtn.style.display = 'none';
        loadBtn.style.display = 'none';
    } else {
        statusDiv.innerHTML = currentGistId ? '✅ Connected to GitHub Gist' : '📝 Ready to create gist';
        authBtn.style.display = 'none';
        syncBtn.style.display = 'inline-block';
        loadBtn.style.display = 'inline-block';
    }
}

// Create or update gist with TV data
async function syncToGitHubGist() {
    try {
        if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
            document.getElementById('gist-status').innerHTML = '❌ Please add your GitHub token';
            return;
        }
        
        // Get your TV data
        const tvData = getAllTVData();
        
        const gistData = {
            description: GIST_DESCRIPTION,
            public: false, // Private gist
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(tvData, null, 2)
                }
            }
        };
        
        let response;
        
        if (currentGistId) {
            // Update existing gist
            response = await fetch(`https://api.github.com/gists/${currentGistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'TV-Show-Tracker'
                },
                body: JSON.stringify(gistData)
            });
        } else {
            // Create new gist
            response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'TV-Show-Tracker'
                },
                body: JSON.stringify(gistData)
            });
        }
        
        if (response.ok) {
            const result = await response.json();
            currentGistId = result.id;
            localStorage.setItem('tvTrackerGistId', currentGistId);
            
            document.getElementById('gist-status').innerHTML = '✅ Data saved to GitHub Gist!';
            setTimeout(() => {
                document.getElementById('gist-status').innerHTML = '✅ Connected to GitHub Gist';
            }, 3000);
        } else {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message}`);
        }
        
    } catch (error) {
        console.error('Error saving to GitHub Gist:', error);
        document.getElementById('gist-status').innerHTML = '❌ Error saving to GitHub Gist: ' + error.message;
    }
}

// Load data from GitHub Gist
async function loadFromGitHubGist() {
    try {
        if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
            document.getElementById('gist-status').innerHTML = '❌ Please add your GitHub token';
            return;
        }
        
        if (!currentGistId) {
            document.getElementById('gist-status').innerHTML = '⚠️ No gist found. Save data first to create one.';
            return;
        }
        
        const response = await fetch(`https://api.github.com/gists/${currentGistId}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'TV-Show-Tracker'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // Gist was deleted, clear the stored ID
                localStorage.removeItem('tvTrackerGistId');
                currentGistId = null;
                throw new Error('Gist not found. It may have been deleted.');
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const gist = await response.json();
        
        if (!gist.files[GIST_FILENAME]) {
            throw new Error('TV data file not found in gist');
        }
        
        const tvDataText = gist.files[GIST_FILENAME].content;
        const tvData = JSON.parse(tvDataText);
        
        // Load the data using the same logic as importJSON
        loadTVData(tvData);
        
        document.getElementById('gist-status').innerHTML = '✅ Data loaded from GitHub Gist!';
        setTimeout(() => {
            document.getElementById('gist-status').innerHTML = '✅ Connected to GitHub Gist';
        }, 3000);
        
    } catch (error) {
        console.error('Error loading from GitHub Gist:', error);
        document.getElementById('gist-status').innerHTML = '❌ Error loading from GitHub Gist: ' + error.message;
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
        document.getElementById('gist-status').innerHTML = '❌ Invalid data format';
    }
}

// Make functions globally available
window.syncToGitHubGist = syncToGitHubGist;
window.loadFromGitHubGist = loadFromGitHubGist;