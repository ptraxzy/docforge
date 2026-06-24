import axios from 'axios';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { getServerUrl } from '../utils/config.js';
import { scanCodeFiles, getProjectName } from '../utils/fileScanner.js';

export async function generate(projectPath, options) {
  const serverUrl = options.server || getServerUrl();
  const outputDir = options.output || './docs';

  console.log(chalk.blue('📄 DocForge - AI Documentation Generator\n'));
  console.log(chalk.gray(`Project: ${projectPath || '.'}`));
  console.log(chalk.gray(`Server: ${serverUrl}`));
  console.log(chalk.gray(`Output: ${outputDir}\n`));

  // Scan for code files
  console.log(chalk.yellow('🔍 Scanning code files...'));
  
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
  
  // 1. Defaults
  const docOptions = {
    include_readme: true,
    include_api: true,
    include_architecture: false,
    include_changelog: false,
  };

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
  };

  // Send to server
  console.log(chalk.yellow('🤖 Generating documentation with AI...\n'));

  try {
    const response = await axios.post(`${serverUrl}/generate`, payload, {
      timeout: 120000, // 2 min timeout for AI generation
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { docs, metadata } = response.data;

    console.log(chalk.green(`✅ Generated ${Object.keys(docs).length} documentation files\n`));
    console.log(chalk.gray(`   Files processed: ${metadata.files_processed}`));
    console.log(chalk.gray(`   Tokens used: ${metadata.tokens_used}\n`));

    // Write docs to output directory
    await fs.ensureDir(outputDir);

    for (const [filename, content] of Object.entries(docs)) {
      const outputPath = path.join(outputDir, filename);
      await fs.writeFile(outputPath, content, 'utf-8');
      console.log(chalk.green(`   ✓ ${filename}`));
    }

    console.log(chalk.blue(`\n📚 Documentation saved to: ${outputDir}/\n`));

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red(`\n❌ Cannot connect to DocForge server at ${serverUrl}`));
      console.log(chalk.yellow('\nMake sure the server is running:'));
      console.log(chalk.gray('   docforge serve'));
      console.log(chalk.gray('   # or set a different server:'));
      console.log(chalk.gray('   docforge set-server <url>\n'));
    } else if (error.response) {
      console.log(chalk.red(`\n❌ Server error: ${error.response.data?.detail || error.message}`));
    } else {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
    process.exit(1);
  }
}
