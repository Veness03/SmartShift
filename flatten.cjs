const fs = require('fs');
const path = require('path');

// 1. Combine UI files
const uiFiles = [
  'src/components/ui/textarea.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/label.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/dropdown-menu.tsx',
];

let uiContent = '';
let uiImports = new Set();
let uiBody = '';

for (const file of uiFiles) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  for (const line of lines) {
    if (line.startsWith('import ')) {
      let newImport = line.replace('@/src/lib/utils', './utils');
      uiImports.add(newImport);
    } else {
      uiBody += line + '\n';
    }
  }
}

uiContent = Array.from(uiImports).join('\n') + '\n\n' + uiBody;
fs.writeFileSync('src/ui.tsx', uiContent);

// 2. Move single files
const moves = {
  'src/components/ThemeProvider.tsx': 'src/ThemeProvider.tsx',
  'src/components/Layout.tsx': 'src/Layout.tsx',
  'src/hooks/useAuthGuard.ts': 'src/useAuthGuard.ts',
  'src/pages/Employees.tsx': 'src/Employees.tsx',
  'src/pages/Reports.tsx': 'src/Reports.tsx',
  'src/pages/Auth.tsx': 'src/Auth.tsx',
  'src/pages/Roster.tsx': 'src/Roster.tsx',
  'src/pages/Dashboard.tsx': 'src/Dashboard.tsx',
  'src/pages/Payroll.tsx': 'src/Payroll.tsx',
  'src/pages/Leaves.tsx': 'src/Leaves.tsx',
  'src/lib/utils.ts': 'src/utils.ts',
  'src/lib/supabase.ts': 'src/supabase.ts',
  'src/lib/store.tsx': 'src/store.tsx',
};

for (const [oldPath, newPath] of Object.entries(moves)) {
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, newPath);
  }
}

// 3. Rewrite imports
function rewriteImports(code) {
  return code
    .replace(/@\/src\/components\/ui\/[a-zA-Z0-9_-]+/g, './ui')
    .replace(/@\/src\/components\/ThemeProvider/g, './ThemeProvider')
    .replace(/@\/src\/components\/Layout/g, './Layout')
    .replace(/@\/src\/hooks\/useAuthGuard/g, './useAuthGuard')
    .replace(/@\/src\/lib\/utils/g, './utils')
    .replace(/@\/src\/lib\/supabase/g, './supabase')
    .replace(/@\/src\/lib\/store/g, './store')
    .replace(/@\/src\/pages\/[a-zA-Z0-9_-]+/g, match => {
       const page = match.split('/').pop();
       return `./${page}`;
    })
    // Relative imports cleanup
    .replace(/\.\/components\/Layout/g, './Layout')
    .replace(/\.\/components\/ThemeProvider/g, './ThemeProvider')
    .replace(/\.\/pages\/[a-zA-Z0-9_-]+/g, match => {
       const page = match.split('/').pop();
       return `./${page}`;
    })
    .replace(/\.\/lib\/store/g, './store')
    .replace(/\.\.\/lib\/store/g, './store')
    .replace(/\.\.\/hooks\/useAuthGuard/g, './useAuthGuard')
    .replace(/\.\/ui\/[a-zA-Z0-9_-]+/g, './ui');
}

const srcFiles = fs.readdirSync('src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

for (const file of srcFiles) {
  if (file === 'vite-env.d.ts') continue;
  const filePath = path.join('src', file);
  let code = fs.readFileSync(filePath, 'utf8');
  code = rewriteImports(code);
  fs.writeFileSync(filePath, code);
}

// 4. Clean up old directories
fs.rmSync('src/components', { recursive: true, force: true });
fs.rmSync('src/pages', { recursive: true, force: true });
fs.rmSync('src/hooks', { recursive: true, force: true });
fs.rmSync('src/lib', { recursive: true, force: true });

console.log("Flattening complete.");
