import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { DirectoryStructure } from './types';
import { INCLUDED_EXTENSIONS, LARGE_FILE_THRESHOLD, LARGE_FILES_KEY } from './constants';
import { getProjectName, ensureResultFolder, shouldIncludeFile } from './utils';

async function createDirectoryStructure(
  rootPath: string, 
  includeOtherExtensions: boolean
): Promise<void> {
  const structure: DirectoryStructure = {
    separator: '------------------- {fileName} -------------------',
    generateTableOfContent: true,
    outputFormat: 'markdown',
    folders: {},
    [LARGE_FILES_KEY]: []
  };

  const extensions = includeOtherExtensions 
    ? INCLUDED_EXTENSIONS
    : ['.md'];
    console.log(`Finding extensions ${extensions.join(',')} at ${rootPath}`);
  const files = await glob(`**/*{${extensions.join(',')}}`, { cwd: rootPath });

  const filteredFiles = files
    .filter(file => shouldIncludeFile(path.basename(file), extensions))
    .sort((a, b) => a.localeCompare(b));

  filteredFiles.forEach(file => {
    const fullPath = path.join(rootPath, file);
    const fileStats = fs.statSync(fullPath);

    // Check for large files
    if (fileStats.size > LARGE_FILE_THRESHOLD) {
      structure[LARGE_FILES_KEY]?.push(file);
      console.warn(`Large file detected: ${file} (${fileStats.size} bytes)`);
      return;
    }

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

  const resultFolder = ensureResultFolder();
  const projectName = getProjectName(rootPath);
  const outputFileName = path.join(resultFolder, `${projectName}.json`);
  
  fs.writeFileSync(outputFileName, JSON.stringify(structure, null, 2));
  console.log(`Structure saved to ${outputFileName}`);
  console.log(`Total files processed: ${filteredFiles.length} (after filtering)`);
  if (structure[LARGE_FILES_KEY] && structure[LARGE_FILES_KEY]?.length > 0) {
    console.log(`Large files skipped: ${structure[LARGE_FILES_KEY].length}`);
  }
}

const rootPath = process.argv[2];
const includeOtherExtensions = process.argv.includes('-includeOtherExtensions');

if (!rootPath) {
  console.error('Please provide a root directory path');
  process.exit(1);
}

createDirectoryStructure(rootPath, includeOtherExtensions);