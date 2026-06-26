import axios from 'axios';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import prompts from 'prompts';
import { getServerUrl } from '../utils/config.js';
import { scanCodeFiles, getProjectName } from '../utils/fileScanner.js';
import { confirmAndSaveDocs } from '../utils/diffViewer.js';
import { detectFramework } from '../utils/detector.js';

export async function generate(projectPath, options) {
  const serverUrl = options.server || getServerUrl();
  let outputDir = options.output || './docs';

  // 1. Setup default generation options
  const docOptions = {
    include_readme: true,
    include_api: true,
    include_architecture: false,
    include_changelog: false,
  };

  // 2. Check if we should run interactively
  // Run interactive prompts if no command line override flags are passed
  const hasFlags = process.argv.slice(2).some(arg => arg.startsWith('-'));

  if (!hasFlags) {
    console.log(chalk.blue('DocForge - Interactive Document Generator\n'));
    
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
        type: 'text',
        name: 'outputDir',
        message: 'Enter output directory:',
        initial: outputDir
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
    outputDir = response.outputDir;
    console.log(); // Blank line for clean spacing
  } else {
    // Non-interactive mode (using CLI flags)
    console.log(chalk.blue('DocForge - AI Documentation Generator\n'));
    console.log(chalk.gray(`Project: ${projectPath || '.'}`));
    console.log(chalk.gray(`Server:  ${serverUrl}`));
    console.log(chalk.gray(`Output:  ${outputDir}\n`));
  }

  // Scan for framework
  const frameworkInfo = await detectFramework(projectPath || process.cwd());
  const framework = frameworkInfo.type;

  // Scan for code files
  console.log(chalk.yellow('Scanning code files...'));
  
  const includePatterns = options.include || null;
  const excludePatterns = options.exclude || null;
  
  let files;
  try {
    files = await scanCodeFiles(projectPath || process.cwd(), includePatterns, excludePatterns);
  } catch (e) {
    console.log(chalk.red(`Error scanning files: ${e.message}`));
    process.exit(1);
  }

  if (files.length === 0) {
    console.log(chalk.red('No code files found. Make sure you are in a project directory.'));
    process.exit(1);
  }

  console.log(chalk.green(`Found ${files.length} code files\n`));

  // Prepare request
  const projectName = getProjectName(projectPath || process.cwd());

  // 2. Load config from .docforge/config.json if it exists
  const projectRoot = projectPath || process.cwd();
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

  const payload = {
    project_name: projectName,
    files: files.map(f => ({
      path: f.path,
      content: f.content,
      language: f.language,
    })),
    options: docOptions,
    framework: framework,
  };

  // Send to server
  console.log(chalk.yellow('Generating documentation with AI...\n'));

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
    await confirmAndSaveDocs(docs, outputDir);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red(`\n[Error] Cannot connect to DocForge server at ${serverUrl}`));
      console.log(chalk.yellow('\nMake sure the server is running:'));
      console.log(chalk.gray('   docforge serve'));
      console.log(chalk.gray('   # or set a different server:'));
      console.log(chalk.gray('   docforge set-server <url>\n'));
    } else if (error.response) {
      console.log(chalk.red(`\n[Error] Server error: ${error.response.data?.detail || error.message}`));
    } else {
      console.log(chalk.red(`\n[Error] Error: ${error.message}`));
    }
    process.exit(1);
  }
}
