const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];
const fileExts = ['.tsx'];

const replacements = [
  { regex: /#fef2f2/gi, replacement: 'var(--danger-bg)' },
  { regex: /#fecaca/gi, replacement: 'var(--danger-border)' },
  { regex: /#dc2626/gi, replacement: 'var(--danger-text)' },
  { regex: /background:\s*"white"/gi, replacement: 'background: "var(--bg-card)"' },
  { regex: /backgroundColor:\s*"white"/gi, replacement: 'backgroundColor: "var(--bg-card)"' },
  { regex: /color:\s*"white"/gi, replacement: 'color: "var(--bg-card)"' },
  { regex: /background:\s*'white'/gi, replacement: "background: 'var(--bg-card)'" },
  { regex: /background:\s*"#fff"/gi, replacement: 'background: "var(--bg-card)"' }
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
        console.log(`Updated alerts in ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(scanAndReplace);
console.log('Alert refactor complete.');
