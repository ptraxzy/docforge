import { diffLines } from 'diff';
import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';

/**
 * Print a Git-like colored unified diff in the terminal.
 */
export function printDiff(filename, oldContent, newContent) {
  console.log(chalk.bold.cyan(`\n--- a/${filename}`));
  console.log(chalk.bold.cyan(`+++ b/${filename}\n`));

  const changes = diffLines(oldContent, newContent);
  
  changes.forEach((part) => {
    const lines = part.value.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    lines.forEach((line) => {
      if (part.added) {
        console.log(chalk.green(`+ ${line}`));
      } else if (part.removed) {
        console.log(chalk.red(`- ${line}`));
      } else {
        console.log(chalk.gray(`  ${line}`));
      }
    });
  });
  console.log();
}

/**
 * Prompt the user to Save, Preview, or Discard the changes.
 */
export async function confirmAndSaveDocs(docsMap, outputDir) {
  const fileStatuses = [];
  const diffsToPreview = [];

  for (const [filename, newContent] of Object.entries(docsMap)) {
    const outputPath = path.join(outputDir, filename);
    const fileExists = await fs.pathExists(outputPath);
    
    if (fileExists) {
      const oldContent = await fs.readFile(outputPath, 'utf-8');
      if (oldContent.trim() === newContent.trim()) {
        fileStatuses.push({ filename, status: 'unchanged' });
      } else {
        fileStatuses.push({ filename, status: 'modified' });
        diffsToPreview.push({ filename, oldContent, newContent });
      }
    } else {
      fileStatuses.push({ filename, status: 'new' });
      diffsToPreview.push({ filename, oldContent: '', newContent });
    }
  }

  // If everything is unchanged, exit early
  if (fileStatuses.every(f => f.status === 'unchanged')) {
    console.log(chalk.green('[OK] Documentation is already up-to-date. No changes needed.'));
    return true;
  }

  // Display summary of changes
  console.log(chalk.blue('AI has generated documentation:'));
  fileStatuses.forEach(f => {
    if (f.status === 'new') {
      console.log(chalk.green(`   [NEW]      ${f.filename}`));
    } else if (f.status === 'modified') {
      console.log(chalk.yellow(`   [MODIFIED] ${f.filename}`));
    } else {
      console.log(chalk.gray(`   [UNCHANGED] ${f.filename}`));
    }
  });
  console.log();

  // Prompt Loop
  while (true) {
    const response = await prompts({
      type: 'select',
      name: 'action',
      message: 'Choose an action:',
      choices: [
        { title: 'Save all changes to disk', value: 'save' },
        { title: 'Preview differences (Diff)', value: 'diff' },
        { title: 'Discard all changes', value: 'discard' }
      ]
    });

    if (response.action === 'save') {
      await fs.ensureDir(outputDir);
      
      for (const [filename, newContent] of Object.entries(docsMap)) {
        const outputPath = path.join(outputDir, filename);
        await fs.writeFile(outputPath, newContent, 'utf-8');
        console.log(chalk.green(`   [Wrote] ${filename}`));
      }
      console.log(chalk.blue(`\nDocumentation successfully saved to: ${outputDir}/\n`));
      return true;
    } else if (response.action === 'diff') {
      if (diffsToPreview.length === 0) {
        console.log(chalk.gray('No changes to show.\n'));
      } else {
        diffsToPreview.forEach(diffInfo => {
          printDiff(diffInfo.filename, diffInfo.oldContent, diffInfo.newContent);
        });
      }
    } else {
      console.log(chalk.yellow('\nChanges discarded.'));
      return false;
    }
  }
}
