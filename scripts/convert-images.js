#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function ensureSharp() {
  try {
    return require('sharp');
  } catch (error) {
    console.error('⚠️  The `sharp` package is required. Install it with `npm install sharp --save-dev`.');
    process.exit(1);
  }
}

function collectImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectImages(fullPath);
    }
    if (/\.(png|jpe?g)$/i.test(entry.name)) {
      return [fullPath];
    }
    return [];
  });
}

(async function main() {
  const [targetDir = 'assets', outputDir = 'assets/webp'] = process.argv.slice(2);
  const sharp = await ensureSharp();

  const absoluteTarget = path.resolve(process.cwd(), targetDir);
  const absoluteOutput = path.resolve(process.cwd(), outputDir);

  const files = collectImages(absoluteTarget);
  if (!files.length) {
    console.log(`No PNG or JPEG files found in ${targetDir}.`);
    return;
  }

  fs.mkdirSync(absoluteOutput, { recursive: true });

  await Promise.all(
    files.map(async (filePath) => {
      const relative = path.relative(absoluteTarget, filePath);
      const baseName = path.basename(relative, path.extname(relative));
      const outDir = path.join(absoluteOutput, path.dirname(relative));
      fs.mkdirSync(outDir, { recursive: true });
      const destination = path.join(outDir, `${baseName}.webp`);
      await sharp(filePath)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(destination);
      console.log(`Converted ${filePath} -> ${destination}`);
    })
  );
})();
