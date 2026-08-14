import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.resolve(rootDir, 'packages/web');
const webDist = path.resolve(webDir, 'dist');
const rootDist = path.resolve(rootDir, 'dist');

console.log('[Build] Compiling WriteFix AI Web Studio...');
execSync('npx vite build', {
  cwd: webDir,
  stdio: 'inherit',
});

// Clean up any accidental nested packages folder
const nestedPackages = path.resolve(webDir, 'packages');
if (fs.existsSync(nestedPackages)) {
  fs.rmSync(nestedPackages, { recursive: true, force: true });
}

// Mirror dist to root ./dist so both root and packages/web/dist are up to date
if (fs.existsSync(webDist)) {
  fs.cpSync(webDist, rootDist, { recursive: true, force: true });
  console.log('[Build] Successfully mirrored dist output to both ./dist and ./packages/web/dist');
}
