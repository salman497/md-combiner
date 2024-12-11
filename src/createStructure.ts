import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { DirectoryStructure } from './types';

const IGNORED_PATHS = ['Users', 'salmanaziz', 'github'];

async function createDirectoryStructure(rootPath: string): Promise<void> {
  // Explicitly type the initial structure
  const structure: DirectoryStructure = {
    separator: '------------------- {fileName} -------------------',
    generateTableOfContent: true,
    outputFormat: 'markdown',
    folders: {}
  };

  const files = await glob('**/*.md', { cwd: rootPath });
  
  files.sort((a, b) => a.localeCompare(b));

  files.forEach(file => {
    const fullPath = path.join(rootPath, file);
    const pathParts = file.split(path.sep);
    
    if (pathParts.length === 1) {
      structure[pathParts[0]] = fullPath;
      return;
    }

    let current: DirectoryStructure = structure;
    pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1) {
        current[part] = fullPath;
      } else {
        if (!current.folders) {
          current.folders = {};
        }
        if (!current.folders[part]) {
          current.folders[part] = {
            folders: {}
          };
        }
        current = current.folders[part];
      }
    });
  });

  const outputFileName = path.basename(rootPath) + '.json';
  fs.writeFileSync(outputFileName, JSON.stringify(structure, null, 2));
  console.log(`Structure saved to ${outputFileName}`);
}

const rootPath = process.argv[2];
if (!rootPath) {
  console.error('Please provide a root directory path');
  process.exit(1);
}

createDirectoryStructure(rootPath);