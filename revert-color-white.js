const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];
const fileExts = ['.tsx'];

function scanAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fileExts.includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('color: "var(--bg-card)"')) {
        content = content.replace(/color:\s*"var\(--bg-card\)"/g, 'color: "#ffffff"');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Reverted color in ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(scanAndReplace);
console.log('Revert complete.');
