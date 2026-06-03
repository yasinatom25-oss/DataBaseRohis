const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];
const fileExts = ['.tsx'];

const replacements = [
  { regex: /#e6f4f9/gi, replacement: 'var(--primary-50)' },
];

function scanAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fileExts.includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      replacements.forEach(({ regex, replacement }) => {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated primary-50 in ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(scanAndReplace);
console.log('Primary-50 refactor complete.');
