import axios from 'axios';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import prompts from 'prompts';
import { getServerUrl } from '../utils/config.js';
import { scanCodeFiles, getProjectName } from '../utils/fileScanner.js';
import { confirmAndSaveDocs } from '../utils/diffViewer.js';
import { detectFramework } from '../utils/detector.js';
import { generateOfflineDocs } from '../utils/offlineGenerator.js';

export async function generate(projectPath, options) {
  const serverUrl = options.server || getServerUrl();
  let outputDir = options.output || './';

  // 1. Initialize project analysis first
  console.log(chalk.blue('DocForge - AI Documentation Generator'));
  console.log(chalk.dim.gray('by xputra.dev\n'));
  console.log(chalk.yellow('Analyzing project structure...'));

  const projectRoot = projectPath || process.cwd();

  // Scan for framework
  const frameworkInfo = await detectFramework(projectRoot);
  const framework = frameworkInfo.type;

  // Scan for code files
  const includePatterns = options.include || null;
  const excludePatterns = options.exclude || null;
  
  let files;
  try {
    files = await scanCodeFiles(projectRoot, includePatterns, excludePatterns);
  } catch (e) {
    console.log(chalk.red(`Error scanning files: ${e.message}`));
    process.exit(1);
  }

  if (files.length === 0) {
    console.log(chalk.red('No code files found. Make sure you are in a project directory.'));
    process.exit(1);
  }

  console.log(chalk.green(`[OK] Analysis complete!`));
  console.log(chalk.gray(`     Framework: ${framework.toUpperCase()}`));
  console.log(chalk.gray(`     Files found: ${files.length} files`));
  console.log(chalk.gray(`     Target Output: ${outputDir}\n`));

  // 2. Setup default generation options
  const docOptions = {
    include_readme: true,
    include_api: true,
    include_architecture: false,
    include_changelog: false,
  };

  // 3. Check if we should run interactively
  // Run interactive prompts if no command line override flags are passed
  const hasFlags = process.argv.slice(2).some(arg => arg.startsWith('-'));

  if (!hasFlags) {
    const questions = [
      {
        type: 'multiselect',
        name: 'files',
        message: 'Select documentation files to generate:',
        choices: [
          { title: 'README.md (Project overview & setup)', value: 'readme', selected: true },
          { title: 'API.md (Reference of endpoints/classes/functions)', value: 'api', selected: true },
          { title: 'ARCHITECTURE.md (High-level architecture design)', value: 'architecture', selected: false },
          { title: 'CHANGELOG.md (Version histories)', value: 'changelog', selected: false }
        ],
        hint: '- Space to select. Enter to submit.'
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Ready to generate docs with AI?',
        initial: true
      }
    ];

    const response = await prompts(questions);

    // If cancelled (Ctrl+C) or chosen No
    if (response.confirm === undefined || !response.confirm) {
      console.log(chalk.gray('\nGeneration cancelled.'));
      process.exit(0);
    }

    docOptions.include_readme = response.files.includes('readme');
    docOptions.include_api = response.files.includes('api');
    docOptions.include_architecture = response.files.includes('architecture');
    docOptions.include_changelog = response.files.includes('changelog');
    console.log(); // Blank line for clean spacing
  } else {
    // Non-interactive mode (using CLI flags)
    console.log(chalk.gray(`Project: ${projectRoot}`));
    console.log(chalk.gray(`Server:  ${serverUrl}`));
    console.log(chalk.gray(`Output:  ${outputDir}\n`));
  }

  // Prepare request
  const projectName = getProjectName(projectPath || process.cwd());

  // 2. Load config from .docforge/config.json if it exists
  const configPath = path.join(projectRoot, '.docforge', 'config.json');
  try {
    if (await fs.pathExists(configPath)) {
      const localConfig = await fs.readJson(configPath);
      if (localConfig.options) {
        Object.assign(docOptions, localConfig.options);
      }
    }
  } catch (e) {
    // Ignore config read issues
  }

  // 3. Override from CLI flags
  const args = process.argv;
  if (args.includes('--readme')) docOptions.include_readme = true;
  else if (args.includes('--no-readme')) docOptions.include_readme = false;

  if (args.includes('--api')) docOptions.include_api = true;
  else if (args.includes('--no-api')) docOptions.include_api = false;

  if (args.includes('--architecture') || args.includes('--arch')) docOptions.include_architecture = true;
  else if (args.includes('--no-architecture') || args.includes('--no-arch')) docOptions.include_architecture = false;

  if (args.includes('--changelog')) docOptions.include_changelog = true;
  else if (args.includes('--no-changelog')) docOptions.include_changelog = false;

  // Scan for existing target documents to enable edit/append
  console.log(chalk.bold.magenta('\n🧠 AI THINKING SYSTEM'));
  console.log(chalk.gray('──────────────────────────────────────────────'));
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log(chalk.blue('  [Step 1/3] Checking target workspace files...'));
  
  const existingDocs = {};
  const optionToFilename = {
    include_readme: 'README.md',
    include_api: 'API.md',
    include_architecture: 'ARCHITECTURE.md',
    include_changelog: 'CHANGELOG.md',
    include_introduction: 'introduction.md',
    include_features: 'features.md',
    include_configuration: 'configuration.md',
  };

  for (const [opt, filename] of Object.entries(optionToFilename)) {
    if (docOptions[opt]) {
      const filePath = path.join(outputDir, filename);
      const exists = await fs.pathExists(filePath);
      await new Promise(resolve => setTimeout(resolve, 200));
      if (exists) {
        console.log(`    └─ ${chalk.yellow('EDIT & APPEND')} : ${chalk.cyan(filename)} (existing content loaded)`);
        existingDocs[filename] = await fs.readFile(filePath, 'utf-8');
      } else {
        console.log(`    └─ ${chalk.green('AUTO CREATE')}   : ${chalk.cyan(filename)} (file not found, will create new)`);
      }
    }
  }

  await new Promise(resolve => setTimeout(resolve, 350));
  console.log(chalk.blue('\n  [Step 2/3] Analyzing codebase framework & structure...'));
  await new Promise(resolve => setTimeout(resolve, 250));
  console.log(`    └─ Detected Framework: ${chalk.bold.green(framework.toUpperCase())}`);
  console.log(`    └─ Scanned Code Files: ${chalk.bold.green(files.length)} files`);

  await new Promise(resolve => setTimeout(resolve, 350));
  console.log(chalk.blue('\n  [Step 3/3] Launching AI reasoning engine...'));
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log(chalk.magenta('    └─ 🧠 AI is thinking, reasoning, and merging documents... Please wait.\n'));

  const payload = {
    project_name: projectName,
    files: files.map(f => ({
      path: f.path,
      content: f.content,
      language: f.language,
    })),
    options: docOptions,
    framework: framework,
    existing_docs: existingDocs,
  };

  try {
    const response = await axios.post(`${serverUrl}/generate`, payload, {
      timeout: 600000, // 10 min timeout for AI generation
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
    });

    const { docs, metadata } = response.data;

    console.log(chalk.green(`[Success] Generated ${Object.keys(docs).length} documentation files\n`));
    console.log(chalk.gray(`   Files processed: ${metadata.files_processed}`));
    console.log(chalk.gray(`   Tokens used: ${metadata.tokens_used}\n`));

    // Write docs to output directory with review confirmation
    const refineContext = {
      serverUrl,
      projectName,
      files: files.map(f => ({
        path: f.path,
        content: f.content,
        language: f.language,
      })),
      framework,
      options: docOptions,
    };
    await confirmAndSaveDocs(docs, outputDir, refineContext);

  } catch (error) {
    console.log(chalk.yellow(`\n[Info] AI server offline or returned an error: ${error.message}`));
    console.log(chalk.yellow('Automatically falling back to local system documentation generator...\n'));

    try {
      const offlineDocs = await generateOfflineDocs(projectRoot, framework, files);

      // Filter offline docs based on docOptions
      const docs = {};
      if (docOptions.include_readme && offlineDocs['README.md']) {
        docs['README.md'] = offlineDocs['README.md'];
      }
      if (docOptions.include_api && offlineDocs['API.md']) {
        docs['API.md'] = offlineDocs['API.md'];
      }
      if (docOptions.include_architecture && offlineDocs['ARCHITECTURE.md']) {
        docs['ARCHITECTURE.md'] = offlineDocs['ARCHITECTURE.md'];
      }
      if (docOptions.include_changelog && offlineDocs['CHANGELOG.md']) {
        docs['CHANGELOG.md'] = offlineDocs['CHANGELOG.md'];
      }

      if (Object.keys(docs).length === 0) {
        console.log(chalk.yellow('No documentation files selected for offline generation.'));
        process.exit(0);
      }

      console.log(chalk.green(`[Success] Generated ${Object.keys(docs).length} documentation files offline\n`));
      await confirmAndSaveDocs(docs, outputDir);
    } catch (offlineErr) {
      console.log(chalk.red(`\n[Error] Offline generation failed: ${offlineErr.message}`));
      process.exit(1);
    }
  }
}
