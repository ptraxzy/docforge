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
      { timeout: 1500 },
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
 * Display update warning if a newer version exists.
 * @param {string} currentVersion 
 */
export async function displayUpdateMessage(currentVersion) {
  if (!updatePromise) return;
  try {
    const latestVersion = await updatePromise;
    if (latestVersion && latestVersion !== currentVersion) {
      console.log(
        chalk.yellow(`\nUpdate available: ${chalk.gray(currentVersion)} → ${chalk.green(latestVersion)}`) +
        chalk.yellow(`\nRun ${chalk.cyan('npm install -g @ultramaxoo/docforge')} to update.\n`)
      );
    }
  } catch (e) {
    // ignore
  }
}
