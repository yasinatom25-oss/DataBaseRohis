const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];
const fileExts = ['.tsx', '.ts'];

const replacements = [
  // Replace inline styles with Tailwind classes where safely possible, or just add the new tokens
  { regex: /bg-white/g, replacement: 'bg-bg-surface' },
  { regex: /border-\[var\(--border-color\)\]/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /border-border-color/g, replacement: 'border-slate-200 dark:border-slate-700' },
  
  // Shadows
  { regex: /shadow-sm(?!\s*dark:shadow-none)/g, replacement: 'shadow-sm dark:shadow-none' },
  { regex: /shadow-md(?!\s*dark:shadow-none)/g, replacement: 'shadow-md dark:shadow-none' },
  { regex: /shadow-lg(?!\s*dark:shadow-none)/g, replacement: 'shadow-lg dark:shadow-none' },

  // Replace manual hex colors if any are found that match the old ones
  { regex: /text-\[#1e293b\]/gi, replacement: 'text-text-main' },
  { regex: /text-\[#64748b\]/gi, replacement: 'text-text-muted' },

  // Replace generic text-main with tailwind class where applicable
  // Note: we might have style={{ color: "var(--text-main)" }}, which we'll leave as is because it works natively with dark mode due to CSS variables.
  // But if there are classNames like text-[var(--text-main)], we can swap them:
  { regex: /text-\[var\(--text-main\)\]/g, replacement: 'text-text-main' },
  { regex: /text-\[var\(--text-muted\)\]/g, replacement: 'text-text-muted' },
  { regex: /bg-\[var\(--bg-main\)\]/g, replacement: 'bg-bg-canvas' },
  { regex: /bg-\[var\(--bg-card\)\]/g, replacement: 'bg-bg-surface' },
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
        console.log(`Refactored Dark Mode tokens in ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(scanAndReplace);
console.log('Refactor script execution complete.');
