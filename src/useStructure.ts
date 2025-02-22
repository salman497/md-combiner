import * as fs from 'fs';
import { createReadStream } from 'fs';
import { promisify } from 'util';
import * as readline from 'readline';
import * as path from 'path';
import markdownToc from 'markdown-toc';
import { DirectoryStructure } from './types';
import { 
  CHUNK_SIZE, 
  CHUNK_OVERLAP, 
  LARGE_FILES_KEY,
  LARGE_FILE_THRESHOLD 
} from './constants';
import { ensureResultFolder } from './utils';

// Helper functions
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getFileLanguage(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const languageMap: { [key: string]: string } = {
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.ts': 'typescript',
    '.js': 'javascript',
    '.txt': 'text',
    '.md': 'markdown',
    '.mdx': 'markdown for jsx',
    '.jsx': 'jsx',
    '.tsx': 'tsx',
    '.css': 'css',
    '.scss': 'scss',
    '.sql': 'sql',
    '.sh': 'bash',
    '.py': 'python',
    '.ipynb': 'jupyter-notebook'
  };
  return languageMap[ext] || 'text';
}

function createChunks(content: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + CHUNK_SIZE, content.length);
    // Try to end at a natural boundary
    let adjustedEnd = end;
    if (end < content.length) {
      const nextNewline = content.indexOf('\n', end);
      const nextPeriod = content.indexOf('.', end);
      if (nextNewline !== -1 && nextNewline - end < 50) {
        adjustedEnd = nextNewline;
      } else if (nextPeriod !== -1 && nextPeriod - end < 50) {
        adjustedEnd = nextPeriod + 1;
      }
    }
    chunks.push(content.slice(start, adjustedEnd));
    start = adjustedEnd - CHUNK_OVERLAP;
  }
  return chunks;
}

function addMetadata(filename: string, filepath: string, content: string): string {

/*  created: ${stats.birthtime.toISOString()}
modified: ${stats.mtime.toISOString()}
size: ${stats.size} */

  const stats = fs.statSync(filepath);
  return `---
source: ${filename}
path: ${filepath}
type: ${getFileLanguage(filename)}
---
${content}`;
}

function formatContent(filename: string, content: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.md') {
    return content;
  }
  const language = getFileLanguage(filename);
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

function generateTableOfContents(structure: DirectoryStructure, prefix = ''): string {
  let content = '';
  
  // Process files in current level
  Object.entries(structure)
    .filter(([key, value]) => 
      key !== 'folders' && 
      key !== LARGE_FILES_KEY &&
      !key.startsWith('_') && 
      typeof value === 'string' &&
      key !== 'separator' &&
      key !== 'outputFormat'
    )
    .forEach(([filename]) => {
      content += `- ${prefix}${filename}\n`;
    });

  // Process folders
  if (structure.folders) {
    Object.entries(structure.folders)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([folderName, folderContent]) => {
        content += `- ${prefix}${folderName}/\n`;
        content += generateTableOfContents(folderContent, `  ${prefix}`);
      });
  }
  return content;
}

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/[^\S\n]+/g, ' ') // Normalize whitespace
    .trim();
}

async function processFile(
  filename: string, 
  filepath: string, 
  separator: string
): Promise<string> {
  try {
    // Check if file exists
    await promisify(fs.access)(filepath);
    
    let content = '';
    const fileStream = createReadStream(filepath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    // Read file line by line
    for await (const line of rl) {
      content += line + '\n';
    }

    const normalizedContent = normalizeContent(content);
    const formattedContent = formatContent(filename, normalizedContent);
    const contentWithMetadata = addMetadata(filename, filepath, formattedContent);
    
    return `${separator.replace('{fileName}', filename)}\n\n${contentWithMetadata}\n\n`;
  } catch (error) {
    if(!filepath.includes('fileName') && !filepath.includes('markdown')) {
      console.warn(`Warning: Could not read file ${filepath}: ${getErrorMessage(error)}`);
    }
    return '';
  }
}

async function combineFiles(structure: DirectoryStructure): Promise<string> {
  let content = '';
  const separator = structure.separator || '-------------------';
  
  // Add header with processing timestamp
  content += `# Combined Documentation\n\n`;
  content += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add table of contents
  if (structure.generateTableOfContent) {
    content += '# Table of Contents\n\n';
    content += generateTableOfContents(structure);
    content += '\n\n';
  }

  // Add large files section
  if (structure[LARGE_FILES_KEY] && structure[LARGE_FILES_KEY]?.length > 0) {
    content += '## Large Files (Skipped)\n\n';
    content += 'The following files exceeded the size limit ' +
               `(${LARGE_FILE_THRESHOLD / 1024}KB) and were skipped:\n\n`;
    structure[LARGE_FILES_KEY].forEach(file => {
      content += `- ${file}\n`;
    });
    content += '\n\n';
  }

  // Process root files
  const rootFiles = Object.entries(structure)
    .filter(([key, value]) => 
      key !== 'folders' && 
      key !== LARGE_FILES_KEY &&
      !key.startsWith('_') && 
      typeof value === 'string' &&
      key !== 'separator' &&
      key !== 'outputFormat'
    )
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [filename, filepath] of rootFiles) {
    content += await processFile(filename, filepath as string, separator);
  }

  // Recursive function to process folders
  async function processFolder(folderStructure: DirectoryStructure, currentPath: string = '') {
    const files = Object.entries(folderStructure)
      .filter(([key, value]) => 
        key !== 'folders' && 
        !key.startsWith('_') && 
        typeof value === 'string'
      )
      .sort(([a], [b]) => a.localeCompare(b));

    for (const [filename, filepath] of files) {
      const fullPath = currentPath ? `${currentPath}/${filename}` : filename;
      content += await processFile(fullPath, filepath as string, separator);
    }

    if (folderStructure.folders) {
      const sortedFolders = Object.entries(folderStructure.folders)
        .sort(([a], [b]) => a.localeCompare(b));
      
      for (const [folderName, folderContent] of sortedFolders) {
        const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        await processFolder(folderContent, newPath);
      }
    }
  }

  // Process all folders
  if (structure.folders) {
    await processFolder(structure);
  }

  return content;
}

async function processStructureFile(structureFilePath: string): Promise<void> {
  try {
    // Read and parse structure file
    const structure: DirectoryStructure = JSON.parse(
      fs.readFileSync(structureFilePath, 'utf-8')
    );
    
    // Generate combined content
    console.log('Generating combined content...');
    const content = await combineFiles(structure);
    
    // Create output file
    const resultFolder = ensureResultFolder();
    const outputFileName = path.join(
      resultFolder, 
      path.basename(structureFilePath, '.json') + '_combined.md'
    );
    
    // Write the combined content
    fs.writeFileSync(outputFileName, content);
    console.log(`Combined markdown saved to ${outputFileName}`);
    
    // Generate statistics
    const stats = {
      totalSize: Buffer.from(content).length,
      totalChunks: createChunks(content).length,
      averageChunkSize: Math.round(Buffer.from(content).length / createChunks(content).length)
    };
    
    console.log('\nProcessing Statistics:');
    console.log(`Total content size: ${Math.round(stats.totalSize / 1024)}KB`);
    console.log(`Total chunks: ${stats.totalChunks}`);
    console.log(`Average chunk size: ${Math.round(stats.averageChunkSize / 1024)}KB`);
  } catch (error) {
    console.error(`Error processing structure file: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

// Command line handling
const structureFilePath = process.argv[2];
if (!structureFilePath) {
  console.error('Please provide a structure JSON file path');
  process.exit(1);
}

processStructureFile(structureFilePath).catch(error => {
  console.error(`Unhandled error: ${getErrorMessage(error)}`);
  process.exit(1);
});