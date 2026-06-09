const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];
const fileExts = ['.tsx', '.ts'];

function scanAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fileExts.includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Look for h1 with style={{ ... color: "var(--text-main)" ... }}
      // Replace color: "var(--text-main)" inside style with className="text-brand-primary dark:text-blue-400"
      // Actually, since they might not have className, let's just do a regex replace on the h1 specifically
      const h1Regex = /<h1\s+style={{[^}]*color:\s*["']var\(--text-main\)["'][^}]*}}\s*>/g;
      // Wait, there might already be a className. Let's just remove color: "var(--text-main)" from the style, and add the classes.
      // A safer approach:
      if (/<h1[^>]*color:\s*["']var\(--text-main\)["']/.test(content)) {
          content = content.replace(/(<h1[^>]*?)style={{([^}]*?)color:\s*["']var\(--text-main\)["']([^}]*?)}}([^>]*?)>/g, (match, p1, p2, p3, p4) => {
              // Combine p2 and p3 (the rest of the styles)
              const remainingStyle = `${p2}${p3}`.replace(/,\s*,/g, ',').replace(/{\s*,/, '{').replace(/,\s*}/, '}');
              let newStyleAttr = `style={{${remainingStyle}}}`;
              if (newStyleAttr === 'style={{}}' || newStyleAttr === 'style={{ }}' || newStyleAttr === 'style={{,}}') {
                  newStyleAttr = '';
              }
              // Check if className already exists
              if (match.includes('className=')) {
                  // If it has className, inject text-brand-primary dark:text-blue-400
                  return match.replace(/className=["']([^"']*)["']/, `className="$1 text-brand-primary dark:text-blue-400"`)
                              .replace(/style={{[^}]*color:\s*["']var\(--text-main\)["'][^}]*}}/, newStyleAttr);
              } else {
                  return `${p1} className="text-brand-primary dark:text-blue-400" ${newStyleAttr} ${p4}>`;
              }
          });
          modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Refactored headers in ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(scanAndReplace);
console.log('Header refactor script execution complete.');
