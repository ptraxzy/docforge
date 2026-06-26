import https from 'https';
import chalk from 'chalk';

let updatePromise = null;

/**
 * Start update check asynchronously in the background.
 */
export function startUpdateCheck() {
  updatePromise = new Promise((resolve) => {
    const req = https.get(
      'https://registry.npmjs.org/@ultramaxoo/docforge/latest',
      { timeout: 1000 },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const info = JSON.parse(data);
              resolve(info.version || null);
              return;
            }
          } catch (e) {
            // ignore JSON parse errors
          }
          resolve(null);
        });
      }
    );

    req.on('error', () => {
      resolve(null);
    });
    req.end();
  });
}

/**
 * Compare semantic versions to check if latest is newer than current.
 * @param {string} latest 
 * @param {string} current 
 * @returns {boolean}
 */
function isNewerVersion(latest, current) {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);
  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

/**
 * Display update warning if a newer version exists.
 * @param {string} currentVersion 
 */
export async function displayUpdateMessage(currentVersion) {
  if (!updatePromise) return;
  try {
    const latestVersion = await updatePromise;
    if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
      console.log(
        chalk.yellow(`\nUpdate available: ${chalk.gray(currentVersion)} → ${chalk.green(latestVersion)}`) +
        chalk.yellow(`\nRun ${chalk.cyan('docforge update')} to update.\n`)
      );
    }
  } catch (e) {
    // ignore
  }
}
