import * as path from 'path';
import * as fs from 'fs';
import { IGNORED_FILES, IGNORED_SYSTEM_FOLDERS } from './constants';

export function getProjectName(fullPath: string): string {
  const parts = fullPath.split(path.sep)
    .filter(Boolean)
    .filter(part => !IGNORED_SYSTEM_FOLDERS.includes(part));
  
  const projectName = parts
    .slice(0, 3)
    .map(part => part.replace(/[_-]+/g, '_'))
    .join('_');

  return projectName;
}

export function ensureResultFolder(): string {
  const resultFolder = path.join(process.cwd(), 'result');
  if (!fs.existsSync(resultFolder)) {
    fs.mkdirSync(resultFolder, { recursive: true });
  }
  return resultFolder;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function shouldIncludeFile(filename: string, allowedExtensions: string[]): boolean {
  
  const lowercaseFilename = filename.toLowerCase();

  const isAllowedExtension = allowedExtensions.some(extension =>
    lowercaseFilename.endsWith(extension.toLowerCase())
  );
  
  const isIgnored = IGNORED_FILES.some(ignoreFile =>
    ignoreFile.toLowerCase() === lowercaseFilename
  );

  return isAllowedExtension && !isIgnored;
}