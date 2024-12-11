import * as fs from 'fs';
import * as path from 'path';
import markdownToc from 'markdown-toc';
import { DirectoryStructure } from './types';
import { ensureResultFolder } from './utils';

function generateTableOfContents(structure: DirectoryStructure, prefix = ''): string {
  let content = '';

  // Add root files
  Object.entries(structure)
    .filter(([key, value]) => 
      key !== 'folders' && 
      !key.startsWith('_') && 
      typeof value === 'string'
    )
    .forEach(([filename]) => {
      content += `- ${prefix}${filename}\n`;
    });

  // Add folders and their files
  if (structure.folders) {
    Object.entries(structure.folders).forEach(([folderName, folderContent]) => {
      content += `- ${prefix}${folderName}/\n`;
      content += generateTableOfContents(folderContent, `  ${prefix}`);
    });
  }

  return content;
}

function combineFiles(structure: DirectoryStructure): string {
  let content = '';
  const separator = structure.separator || '-------------------';

  if (structure.generateTableOfContent) {
    content += '# Table of Contents\n\n';
    content += generateTableOfContents(structure);
    content += '\n\n';
  }

  // Process root files first
  Object.entries(structure)
    .filter(([key, value]) => 
      key !== 'folders' && 
      !key.startsWith('_') && 
      typeof value === 'string'
    )
    .forEach(([filename, filepath]) => {
      const fileContent = fs.readFileSync(filepath as string, 'utf-8');
      content += separator.replace('{fileName}', filename) + '\n\n';
      content += fileContent + '\n\n';
    });

  function processFolder(folderStructure: DirectoryStructure) {
    Object.entries(folderStructure)
      .filter(([key, value]) => 
        key !== 'folders' && 
        !key.startsWith('_') && 
        typeof value === 'string'
      )
      .forEach(([filename, filepath]) => {
        const fileContent = fs.readFileSync(filepath as string, 'utf-8');
        content += separator.replace('{fileName}', filename) + '\n\n';
        content += fileContent + '\n\n';
      });

    if (folderStructure.folders) {
      Object.values(folderStructure.folders).forEach(processFolder);
    }
  }

  if (structure.folders) {
    Object.values(structure.folders).forEach(processFolder);
  }

  return content;
}

async function processStructureFile(structureFilePath: string): Promise<void> {
    const structure: DirectoryStructure = JSON.parse(
      fs.readFileSync(structureFilePath, 'utf-8')
    );
  
    const content = combineFiles(structure);
    const resultFolder = ensureResultFolder();
    const outputFileName = path.join(
      resultFolder, 
      path.basename(structureFilePath, '.json') + '_combined.md'
    );
    
    fs.writeFileSync(outputFileName, content);
    console.log(`Combined markdown saved to ${outputFileName}`);
  }
  
  const structureFilePath = process.argv[2];
  if (!structureFilePath) {
    console.error('Please provide a structure JSON file path');
    process.exit(1);
  }
  
  processStructureFile(structureFilePath);