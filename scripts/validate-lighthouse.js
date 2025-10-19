#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const MIN_SCORE = 90;

function exitWithError(message) {
  console.error(`\u274c ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    const absolute = path.resolve(process.cwd(), filePath);
    const contents = fs.readFileSync(absolute, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    exitWithError(`Unable to read Lighthouse results at ${filePath}: ${error.message}`);
  }
}

function evaluateManifest(manifestEntry) {
  if (!manifestEntry) return null;
  if (manifestEntry.summary) {
    return manifestEntry.summary;
  }
  if (manifestEntry.categories) {
    return {
      performance: manifestEntry.categories.performance.score,
      accessibility: manifestEntry.categories.accessibility.score
    };
  }
  return null;
}

(function main() {
  const resultsPath = process.env.LHCI_RESULTS_PATH;
  if (!resultsPath) {
    exitWithError('LHCI_RESULTS_PATH environment variable is missing.');
  }

  const manifest = readJson(resultsPath);
  const entries = Array.isArray(manifest) ? manifest : [manifest];

  const failing = [];

  entries.forEach((entry) => {
    const summary = evaluateManifest(entry);
    if (!summary) return;
    const performance = Math.round((summary.performance || 0) * 100);
    const accessibility = Math.round((summary.accessibility || 0) * 100);

    if (performance < MIN_SCORE) {
      failing.push(`Performance score ${performance} is below ${MIN_SCORE}.`);
    }
    if (accessibility < MIN_SCORE) {
      failing.push(`Accessibility score ${accessibility} is below ${MIN_SCORE}.`);
    }
    console.log(`\u2705 Lighthouse summary for ${entry.url || 'site'}: Performance ${performance}, Accessibility ${accessibility}`);
  });

  if (failing.length) {
    failing.forEach((message) => console.error(`\u26a0\ufe0f ${message}`));
    process.exit(1);
  }

  console.log('\u2728 Lighthouse scores meet the required thresholds.');
})();
