import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';

/**
 * Slugify a string for HTML ID anchors.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Scan a directory of markdown files and compile them to HTML & metadata JSON database.
 */
export async function compileDocs(docsDir) {
  const docsData = {};
  
  if (!(await fs.pathExists(docsDir))) {
    return docsData;
  }
  
  const files = await fs.readdir(docsDir);
  const mdFiles = files.filter(f => {
    if (!f.endsWith('.md')) return false;
    const name = f.toLowerCase();
    // Exclude developer/private/sensitive files from the public site compilation
    if (name === 'readme.md' || name === 'api.md' || name === 'architecture.md' || name === 'changelog.md') {
      return false;
    }
    return true;
  });
  
  for (const file of mdFiles) {
    const filePath = path.join(docsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse using marked lexer to extract metadata
    const tokens = marked.lexer(content);
    
    // Extract Title (from H1 heading or default to filename)
    let title = path.basename(file, '.md');
    // Normalize casing for display (e.g. readme -> README, api -> API, or capitalise)
    if (title.toLowerCase() === 'readme') title = 'Overview';
    else if (title.toLowerCase() === 'api') title = 'API Reference';
    else if (title.toLowerCase() === 'architecture') title = 'Architecture';
    else if (title.toLowerCase() === 'changelog') title = 'Changelog';
    else title = title.charAt(0).toUpperCase() + title.slice(1);

    const firstH1 = tokens.find(t => t.type === 'heading' && t.depth === 1);
    if (firstH1) {
      title = firstH1.text;
    }
    
    // Extract TOC (H2 and H3 headings)
    const toc = [];
    tokens.forEach(t => {
      if (t.type === 'heading' && (t.depth === 2 || t.depth === 3)) {
        toc.push({
          text: t.text,
          id: slugify(t.text),
          level: t.depth
        });
      }
    });
    
    // Extract plain text for local fuzzy search index
    const textPieces = [];
    tokens.forEach(t => {
      if (t.text) {
        textPieces.push(t.text);
      } else if (t.type === 'paragraph' && t.tokens) {
        t.tokens.forEach(st => {
          if (st.text) textPieces.push(st.text);
        });
      }
    });
    const plainText = textPieces.join(' ');
    
    // Compile to HTML
    const html = marked.parse(content);
    
    // Key used for routing/tabs (e.g. 'readme', 'api', 'architecture')
    const key = path.basename(file, '.md').toLowerCase();
    docsData[key] = {
      title,
      html,
      toc,
      plainText
    };
  }
  
  return docsData;
}
