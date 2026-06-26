import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';

/**
 * Detect the project framework in the directory.
 * Returns: { type: 'laravel' | 'react-next' | 'react-vite' | 'static', root: string }
 */
export async function detectFramework(projectDir = process.cwd()) {
  // Search for package.json and composer.json/artisan up to 2 levels deep
  const packageJsons = await glob('**/package.json', {
    cwd: projectDir,
    ignore: ['**/node_modules/**', '**/vendor/**'],
    absolute: true,
  });

  const artisans = await glob('**/artisan', {
    cwd: projectDir,
    ignore: ['**/node_modules/**', '**/vendor/**'],
    absolute: true,
  });

  const composerJsons = await glob('**/composer.json', {
    cwd: projectDir,
    ignore: ['**/node_modules/**', '**/vendor/**'],
    absolute: true,
  });

  // 1. Check Laravel
  let laravelPath = null;
  if (artisans.length > 0) {
    laravelPath = path.dirname(artisans[0]);
  } else if (composerJsons.length > 0) {
    for (const compPath of composerJsons) {
      try {
        const composer = await fs.readJson(compPath);
        const req = composer.require || {};
        if (req['laravel/framework']) {
          laravelPath = path.dirname(compPath);
          break;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (laravelPath) {
    return { type: 'laravel', root: laravelPath };
  }

  // 2. Check React / Next
  for (const pkgPath of packageJsons) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const root = path.dirname(pkgPath);
      
      if (deps['next']) {
        return { type: 'react-next', root };
      }
      if (deps['react']) {
        return { type: 'react-vite', root };
      }
    } catch (e) {
      // ignore
    }
  }
  
  return { type: 'static', root: projectDir };
}
