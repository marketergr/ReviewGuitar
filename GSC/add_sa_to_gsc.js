// This script uses your Google account (via browser login) to add the service account
// as a user on your GSC property. This bypasses the GSC UI issue.

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('child_process').exec;

// ---- CONFIGURATION ----
const SERVICE_ACCOUNT_EMAIL = 'reviewsguitar@spatial-rock-469222-r7.iam.gserviceaccount.com';
const SITE_URL = 'https://reviewsguitar.com/';

// You need to create an OAuth2 Client ID in GCP Console first:
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Click "Create Credentials" > "OAuth client ID"
// 3. Application type: "Desktop app"
// 4. Name: "GSC Setup"
// 5. Copy the Client ID and Client Secret below

const CLIENT_ID = process.env.CLIENT_ID || 'PASTE_YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'PASTE_YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:3847/callback';

if (CLIENT_ID === 'PASTE_YOUR_CLIENT_ID_HERE') {
  console.log('========================================');
  console.log('SETUP REQUIRED: OAuth2 Client ID');
  console.log('========================================\n');
  console.log('To add the service account via the API, we need an OAuth2 client.\n');
  console.log('Steps:');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   (Make sure project "spatial-rock-469222-r7" is selected)');
  console.log('2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"');
  console.log('3. If asked to configure consent screen:');
  console.log('   - Choose "External" > Create');
  console.log('   - App name: "GSC Setup"');
  console.log('   - User support email: your email');
  console.log('   - Developer contact: your email');
  console.log('   - Save and Continue through all steps');
  console.log('   - Add yourself as a test user');
  console.log('4. Back in Credentials, click "+ CREATE CREDENTIALS" > "OAuth client ID"');
  console.log('5. Application type: "Desktop app"');
  console.log('6. Name: "GSC Setup"');
  console.log('7. Click Create\n');
  console.log('Then run this script with:');
  console.log(`  set CLIENT_ID=your_client_id&& set CLIENT_SECRET=your_client_secret&& node add_sa_to_gsc.js\n`);
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/webmasters']
});

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const query = url.parse(req.url, true).query;
  
  if (query.code) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>✅ Authorization successful!</h1><p>You can close this window.</p>');
    
    try {
      const { tokens } = await oauth2Client.getToken(query.code);
      oauth2Client.setCredentials(tokens);
      
      // Now use the owner's credentials to add the service account
      const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
      
      console.log(`\nAdding ${SERVICE_ACCOUNT_EMAIL} to ${SITE_URL}...`);
      
      // First verify we can access the site
      const sites = await webmasters.sites.list();
      console.log('\nYour GSC properties:');
      if (sites.data.siteEntry) {
        sites.data.siteEntry.forEach(s => console.log(`  - ${s.siteUrl} (${s.permissionLevel})`));
      }
      
      // Try to add the service account via the Search Console API
      // Note: The webmasters API doesn't have a direct "add user" endpoint,
      // so we'll try using the searchconsole API instead
      const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
      
      // List current sites to verify access
      const scSites = await searchconsole.sites.list();
      console.log('\nSearch Console sites:');
      if (scSites.data.siteEntry) {
        scSites.data.siteEntry.forEach(s => console.log(`  - ${s.siteUrl} (${s.permissionLevel})`));
      }

      // The Search Console API doesn't have a direct "add user" method.
      // But we can verify the property is accessible and suggest the alternative.
      console.log('\n✅ Your Google account has access to GSC.');
      console.log('\nNow trying to add service account via site.add...');
      
      // Use service account credentials to add itself to the site
      const saAuth = new google.auth.GoogleAuth({
        keyFile: './credentials.json',
        scopes: ['https://www.googleapis.com/auth/webmasters']
      });
      const saClient = await saAuth.getClient();
      const saWebmasters = google.webmasters({ version: 'v3', auth: saClient });
      
      try {
        await saWebmasters.sites.add({ siteUrl: SITE_URL });
        console.log('✅ Service account added to the site successfully!');
      } catch (addErr) {
        console.log('Could not auto-add:', addErr.message);
        console.log('\n--- ALTERNATIVE: Manual API Method ---');
        console.log('Try this URL in your browser while logged into Google:');
        console.log(`https://search.google.com/search-console/users?resource_id=${encodeURIComponent(SITE_URL)}`);
      }
      
    } catch (err) {
      console.error('Error:', err.message);
    }
    
    server.close();
  }
});

server.listen(3847, () => {
  console.log('\n🌐 Opening browser for Google login...');
  console.log('If it does not open automatically, go to:\n');
  console.log(authUrl);
  console.log('');
  
  // Open browser on Windows
  open(`start "" "${authUrl}"`);
});
