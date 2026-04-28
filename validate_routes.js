const fs = require('fs');
const path = require('path');

const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

const missingFiles = [];
const verifiedRoutes = [];

if (vercelConfig.rewrites) {
    vercelConfig.rewrites.forEach(route => {
        // Remove leading slash for local path resolution
        const localPath = route.destination.startsWith('/') ? route.destination.substring(1) : route.destination;
        const fullPath = path.join(process.cwd(), localPath);

        if (!fs.existsSync(fullPath)) {
            missingFiles.push({
                source: route.source,
                destination: route.destination,
                reason: 'File not found'
            });
        } else {
            verifiedRoutes.push(route.source);
        }
    });
}

console.log('--- VALIDATION REPORT ---');
console.log(`Total Routes Checked: ${vercelConfig.rewrites ? vercelConfig.rewrites.length : 0}`);
console.log(`Verified Routes: ${verifiedRoutes.length}`);
console.log(`Missing Files: ${missingFiles.length}`);

if (missingFiles.length > 0) {
    console.log('\n--- MISSING FILES (404 RISKS) ---');
    missingFiles.forEach(m => {
        console.log(`Source: ${m.source} -> Destination: ${m.destination}`);
    });
}
