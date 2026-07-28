// Quick script to verify the service account credentials work
const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const credentials = require(CREDENTIALS_PATH);

console.log('Service Account Email:', credentials.client_email);
console.log('Project ID:', credentials.project_id);
console.log('');

async function verify() {
  try {
    // Authenticate with the service account
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/webmasters']
    });

    const authClient = await auth.getClient();
    console.log('✅ Service account credentials are VALID - authentication successful!\n');

    // Try listing sites the service account has access to
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
    
    try {
      const sites = await searchconsole.sites.list();
      console.log('Sites accessible to this service account:');
      if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
        sites.data.siteEntry.forEach(site => {
          console.log(`  - ${site.siteUrl} (${site.permissionLevel})`);
        });
      } else {
        console.log('  (none - the service account has not been granted access to any GSC properties yet)');
        console.log('\n⚠️  You need to add this email as a user in Google Search Console:');
        console.log(`   ${credentials.client_email}`);
      }
    } catch (apiErr) {
      if (apiErr.message.includes('has not been used') || apiErr.message.includes('disabled')) {
        console.log('❌ Search Console API is NOT ENABLED in your GCP project.');
        console.log('   Go to: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com');
        console.log(`   Project: ${credentials.project_id}`);
        console.log('   Click "Enable"');
      } else {
        console.log('❌ API Error:', apiErr.message);
      }
    }
  } catch (err) {
    console.log('❌ Authentication FAILED:', err.message);
    console.log('\n   The service account credentials may be invalid or the account may have been deleted.');
  }
}

verify();
