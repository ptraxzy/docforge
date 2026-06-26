import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectFramework } from '../utils/detector.js';
import { compileDocs } from '../utils/compiler.js';
import { scanCodeFiles, getProjectName } from '../utils/fileScanner.js';
import { getServerUrl } from '../utils/config.js';
import { generateOfflineDocs } from '../utils/offlineGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Check if a docs directory only contains placeholder content from `docforge init`.
 * Returns true if docs need to be generated.
 */
async function needsGeneration(docsDir) {
  if (!(await fs.pathExists(docsDir))) {
    return true;
  }

  const files = await fs.readdir(docsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    return true;
  }

  // If there's only one .md file, check if it's the placeholder
  if (mdFiles.length === 1) {
    const content = await fs.readFile(path.join(docsDir, mdFiles[0]), 'utf-8');
    if (content.includes('auto-generated documentation from DocForge')) {
      return true;
    }
  }

  return false;
}

/**
 * Try to ping the DocForge AI server.
 * Returns true if server is reachable and healthy.
 */
async function pingServer(serverUrl) {
  try {
    const { default: axios } = await import('axios');
    const res = await axios.get(`${serverUrl}/health`, { timeout: 3000 });
    return res.status === 200 && res.data.status === 'healthy';
  } catch (e) {
    return false;
  }
}

/**
 * Generate docs via the AI server.
 */
async function generateViaAI(serverUrl, projectName, framework, codeFiles, docOptions, existingDocs = null) {
  const { default: axios } = await import('axios');

  const payload = {
    project_name: projectName,
    files: codeFiles.map(f => ({
      path: f.path,
      content: f.content,
      language: f.language,
    })),
    options: docOptions,
    framework: framework,
    existing_docs: existingDocs,
  };

  const response = await axios.post(`${serverUrl}/generate`, payload, {
    timeout: 600000,
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
    },
  });

  return response.data.docs;
}

export async function buildSite(options = {}) {
  const projectDir = process.cwd();

  console.log(chalk.blue('DocForge - Documentation Website Builder'));
  console.log(chalk.dim.gray('by xputra.dev\n'));

  // 1. Detect framework
  console.log(chalk.yellow('Detecting project framework...'));
  const frameworkInfo = await detectFramework(projectDir);
  const framework = frameworkInfo.type;
  const targetRoot = frameworkInfo.root;
  console.log(chalk.green(`[OK] Detected framework: ${framework.toUpperCase()} (at root: ${path.relative(projectDir, targetRoot) || '.'})`));

  // 2. Auto-locate docs directory
  let docsDir = options.input;
  if (!docsDir) {
    const possiblePaths = [
      path.join(projectDir, 'docs'),
      path.join(projectDir, '..', 'docs'),
      path.join(projectDir, 'frontend', 'docs'),
      path.join(projectDir, 'backend', 'docs'),
    ];

    for (const p of possiblePaths) {
      if (await fs.pathExists(p)) {
        try {
          const files = await fs.readdir(p);
          if (files.some(f => f.endsWith('.md'))) {
            docsDir = p;
            break;
          }
        } catch (e) {}
      }
    }

    docsDir = docsDir || path.join(projectDir, 'docs');
  }

  console.log(chalk.gray(`Docs directory: ${docsDir}`));

  // 3. Generate/Update docs via AI unless compile-only is set
  if (options.compileOnly) {
    console.log(chalk.green('[OK] Compile-only mode: skipping AI analysis and generation.'));
  } else {
    // Scan code files
    console.log(chalk.yellow('Scanning project files for AI documentation generation...'));
    let codeFiles;
    try {
      codeFiles = await scanCodeFiles(projectDir);
    } catch (e) {
      console.log(chalk.red(`[Error] Failed to scan code files: ${e.message}`));
      process.exit(1);
    }

    if (codeFiles.length === 0) {
      console.log(chalk.red('[Error] No code files found in this project.'));
      process.exit(1);
    }

    console.log(chalk.green(`[OK] Found ${codeFiles.length} code files`));

    // Determine user doc targets
    const docOptions = {
      include_introduction: true,
      include_features: true,
      include_configuration: true,
    };

    const projectName = getProjectName(projectDir);

    // Try AI server first
    const serverUrl = getServerUrl();
    console.log(chalk.yellow(`Checking AI server at ${serverUrl}...`));
    const serverAvailable = await pingServer(serverUrl);

    let generatedDocs;

    if (serverAvailable) {
      console.log(chalk.green('[OK] AI server is reachable.'));

      const targets = ['introduction.md', 'features.md', 'configuration.md'];

      console.log(chalk.bold.magenta('\n🧠 AI THINKING SYSTEM'));
      console.log(chalk.gray('──────────────────────────────────────────────'));
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(chalk.blue('  [Step 1/3] Checking target documentation pages...'));

      const docs = {};
      const promises = targets.map(async (filename) => {
        const filePath = path.join(docsDir, filename);
        const exists = await fs.pathExists(filePath);
        let existingContent = null;
        await new Promise(resolve => setTimeout(resolve, 200));
        if (exists) {
          console.log(`    └─ ${chalk.yellow('EDIT & APPEND')} : ${chalk.cyan(filename)} (existing content loaded)`);
          existingContent = await fs.readFile(filePath, 'utf-8');
        } else {
          console.log(`    └─ ${chalk.green('AUTO CREATE')}   : ${chalk.cyan(filename)} (file not found, will create new)`);
        }

        // Single-file options
        const singleOptions = {
          include_readme: false,
          include_api: false,
          include_architecture: false,
          include_changelog: false,
          include_introduction: filename === 'introduction.md',
          include_features: filename === 'features.md',
          include_configuration: filename === 'configuration.md',
        };

        const existingDocsPayload = existingContent ? { [filename]: existingContent } : null;

        try {
          const startTime = Date.now();
          const singleDocs = await generateViaAI(
            serverUrl,
            projectName,
            framework,
            codeFiles,
            singleOptions,
            existingDocsPayload
          );
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          docs[filename] = singleDocs[filename];
          console.log(chalk.green(`   [OK] Generated ${filename} via AI (${duration}s)`));
        } catch (e) {
          console.log(chalk.yellow(`   [Warn] AI failed for ${filename}: ${e.message}. Generating offline...`));
          const offlineDocs = await generateOfflineDocs(projectDir, framework, codeFiles);
          if (filename === 'introduction.md') {
            docs[filename] = offlineDocs['README.md'] || '';
          } else if (filename === 'features.md') {
            docs[filename] = offlineDocs['API.md'] || '';
          } else if (filename === 'configuration.md') {
            docs[filename] = offlineDocs['ARCHITECTURE.md'] || '';
          } else {
            docs[filename] = offlineDocs[filename] || '';
          }
          console.log(chalk.green(`   [OK] Generated ${filename} offline`));
        }
      });

      console.log(chalk.blue('\n  [Step 2/3] Analyzing codebase framework & structure...'));
      await new Promise(resolve => setTimeout(resolve, 250));
      console.log(`    └─ Detected Framework: ${chalk.bold.green(framework.toUpperCase())}`);
      console.log(`    └─ Scanned Code Files: ${chalk.bold.green(codeFiles.length)} files`);

      await new Promise(resolve => setTimeout(resolve, 350));
      console.log(chalk.blue('\n  [Step 3/3] Launching AI reasoning engine...'));
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log(chalk.magenta('    └─ 🧠 AI is thinking, reasoning, and merging documents... Please wait.\n'));

      await Promise.all(promises);
      generatedDocs = docs;
    } else {
      console.log(chalk.yellow('[Info] AI server not available. Using offline documentation generator.'));
      const offlineDocs = await generateOfflineDocs(projectDir, framework, codeFiles);
      generatedDocs = {
        'introduction.md': offlineDocs['README.md'] || '',
        'features.md': offlineDocs['API.md'] || '',
        'configuration.md': offlineDocs['ARCHITECTURE.md'] || '',
      };
      console.log(chalk.green(`[OK] Offline generated ${Object.keys(generatedDocs).length} documents`));
    }

    // Save generated docs to docs directory
    await fs.ensureDir(docsDir);
    for (const [filename, content] of Object.entries(generatedDocs)) {
      const filePath = path.join(docsDir, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(chalk.gray(`   [Saved] ${filename}`));
    }
    console.log('');
  }

  // 4. Compile docs database
  console.log(chalk.yellow('Compiling markdown files...'));
  const docsData = await compileDocs(docsDir);
  const docCount = Object.keys(docsData).length;

  if (docCount === 0) {
    console.log(chalk.red('[Error] No markdown documentation files (.md) found to compile.'));
    process.exit(1);
  }
  console.log(chalk.green(`[OK] Compiled ${docCount} documents`));

  // 5. Match template & destination
  let templateFile = '';
  let destFile = '';
  let instructions = '';

  switch (framework) {
    case 'laravel':
      templateFile = 'laravel.blade.php';
      const viewsDir = path.join(targetRoot, 'resources', 'views');
      if (await fs.pathExists(viewsDir)) {
        destFile = path.join(viewsDir, 'docs.blade.php');
      } else {
        destFile = path.join(targetRoot, 'docs.blade.php');
      }
      instructions = `
${chalk.bold('Laravel Integration:')}
   1. The blade view is saved to: ${chalk.cyan(path.relative(projectDir, destFile))}
   2. Add this route to your ${chalk.bold('routes/web.php')}:
      ${chalk.cyan("Route::view('/docs', 'docs');")}
   3. Open your browser and navigate to ${chalk.cyan('/docs')}`;
      break;

    case 'react-next':
      templateFile = 'react-component.tsx';
      const appDocsDir = path.join(targetRoot, 'app', 'docs');
      const pagesDocsDir = path.join(targetRoot, 'pages');

      if (await fs.pathExists(path.join(targetRoot, 'app'))) {
        await fs.ensureDir(appDocsDir);
        destFile = path.join(appDocsDir, 'page.tsx');
      } else if (await fs.pathExists(pagesDocsDir)) {
        destFile = path.join(pagesDocsDir, 'docs.tsx');
      } else {
        destFile = path.join(targetRoot, 'Docs.tsx');
      }
      instructions = `
${chalk.bold('Next.js Integration:')}
   1. The React component is saved to: ${chalk.cyan(path.relative(projectDir, destFile))}
   2. Run your server: ${chalk.bold('npm run dev')}
   3. Open your browser and navigate to ${chalk.cyan('/docs')}`;
      break;

    case 'react-vite':
      templateFile = 'react-component.tsx';
      const vitePagesDir = path.join(targetRoot, 'src', 'pages');
      const viteCompDir = path.join(targetRoot, 'src', 'components');
      const srcDir = path.join(targetRoot, 'src');

      if (await fs.pathExists(vitePagesDir)) {
        destFile = path.join(vitePagesDir, 'Docs.tsx');
      } else if (await fs.pathExists(viteCompDir)) {
        destFile = path.join(viteCompDir, 'Docs.tsx');
      } else if (await fs.pathExists(srcDir)) {
        destFile = path.join(srcDir, 'Docs.tsx');
      } else {
        destFile = path.join(targetRoot, 'Docs.tsx');
      }
      instructions = `
${chalk.bold('React / Vite Integration:')}
   1. The React component is saved to: ${chalk.cyan(path.relative(projectDir, destFile))}
   2. Import it in your router file (e.g. ${chalk.bold('App.tsx')}):
      ${chalk.cyan("import Docs from './" + path.relative(path.dirname(destFile), destFile).replace('.tsx', '').replace(/\\/g, '/') + "';")}
   3. Add route details:
      ${chalk.cyan("<Route path=\"/docs\" element={<Docs />} />")}`;
      break;

    default: // static
      templateFile = 'static.html';
      const staticOutputDir = options.output || path.join(targetRoot, 'docs-site');
      await fs.ensureDir(staticOutputDir);
      destFile = path.join(staticOutputDir, 'index.html');
      instructions = `
${chalk.bold('Static Site Integration:')}
   1. The static HTML is saved to: ${chalk.cyan(path.relative(projectDir, destFile))}
   2. You can open this file directly in any browser:
      ${chalk.cyan(`file://${destFile}`)}
   3. Deploy this file directly to GitHub Pages, Netlify, Vercel, or any static hosting service.`;
      break;
  }

  // 6. Inject compiled docs JSON into template
  console.log(chalk.yellow('Generating template files...'));
  const templatePath = path.join(TEMPLATES_DIR, templateFile);

  if (!(await fs.pathExists(templatePath))) {
    console.log(chalk.red(`[Error] Template file not found: ${templatePath}`));
    process.exit(1);
  }

  let templateContent = await fs.readFile(templatePath, 'utf-8');

  // Replace the placeholder with the actual stringified database
  const docsDataString = JSON.stringify(docsData, null, 2);
  templateContent = templateContent.replace('__DOCS_DATA_PLACEHOLDER__', docsDataString);

  // Write file
  await fs.ensureDir(path.dirname(destFile));
  await fs.writeFile(destFile, templateContent, 'utf-8');

  console.log(chalk.green(`[Success] Documentation site built successfully!\n`));
  console.log(instructions);
  console.log();
}
