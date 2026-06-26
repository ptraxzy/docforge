import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export async function init() {
  console.log(chalk.blue('Initializing DocForge\n'));

  const projectDir = process.cwd();
  const docforgeDir = path.join(projectDir, '.docforge');

  // Create .docforge directory
  await fs.ensureDir(docforgeDir);

  // Create config file
  const config = {
    version: '0.1.0',
    project: path.basename(projectDir),
    created: new Date().toISOString(),
  };

  await fs.writeJson(path.join(docforgeDir, 'config.json'), config, { spaces: 2 });

  // Create docs directory with placeholder
  const docsDir = path.join(projectDir, 'docs');
  await fs.ensureDir(docsDir);

  // Create placeholder README
  const readmeContent = `# Documentation

This directory contains auto-generated documentation from DocForge.

## Generate Documentation

\`\`\`bash
npx docforge generate
\`\`\`

## Configuration

Edit \`.docforge/config.json\` to customize documentation generation.
`;

  await fs.writeFile(path.join(docsDir, 'README.md'), readmeContent);

  console.log(chalk.green('[Success] DocForge initialized!\n'));
  console.log(chalk.blue('Created:'));
  console.log(chalk.gray('   .docforge/config.json'));
  console.log(chalk.gray('   docs/README.md\n'));
  console.log(chalk.blue('Next steps:'));
  console.log(chalk.gray('   1. Start the server: docforge serve'));
  console.log(chalk.gray('   2. Generate docs: docforge generate'));
  console.log(chalk.gray('   3. Or set your server: docforge set-server <url>\n'));
}
