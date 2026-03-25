const fs = require('fs');
const path = require('path');

const pluginId = 'canvas-link-to-group';
const targetDir = path.join('D:\\Files\\Common\\Vault\\.obsidian\\plugins', pluginId);
const filesToCopy = ['main.js', 'manifest.json'];

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
}

filesToCopy.forEach(file => {
    const src = path.join(__dirname, '..', file);
    const dest = path.join(targetDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${file}`);
    } else {
        console.log(`Skipped (not found): ${file}`);
    }
});

console.log(`\nDeployed to: ${targetDir}`);
