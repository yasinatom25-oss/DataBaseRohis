const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];
const fileExts = ['.tsx'];

const replacements = [
  { regex: /#ffffff/gi, replacement: 'var(--bg-card)' },
  { regex: /#fff(?![a-zA-Z0-9])/gi, replacement: 'var(--bg-card)' },
  { regex: /#f8fafc/gi, replacement: 'var(--bg-main)' },
  { regex: /#1e293b/gi, replacement: 'var(--text-main)' },
  { regex: /#64748b/gi, replacement: 'var(--text-muted)' },
  { regex: /#94a3b8/gi, replacement: 'var(--text-muted)' },
  { regex: /#475569/gi, replacement: 'var(--text-main)' },
  { regex: /#e2e8f0/gi, replacement: 'var(--border-color)' },
  { regex: /#f1f5f9/gi, replacement: 'var(--hover-bg)' },
  { regex: /#cbd5e1/gi, replacement: 'var(--border-color)' },
  { regex: /#334155/gi, replacement: 'var(--text-main)' },
  { regex: /background:\s*"white"/gi, replacement: 'background: "var(--bg-card)"' },
  { regex: /backgroundColor:\s*"white"/gi, replacement: 'backgroundColor: "var(--bg-card)"' }
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
        console.log(`Updated colors in ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(scanAndReplace);
console.log('Refactor complete.');
