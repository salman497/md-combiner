import * as path from 'path';
import * as fs from 'fs';

export function getProjectName(fullPath: string): string {
  // Split the path and clean up the parts
  const parts = fullPath.split(path.sep)
    .filter(Boolean) // Remove empty strings
    .filter(part => !['Users', 'user', 'home', 'salmanaziz','Documents', 'github'].includes(part));
  
  // Join parts with underscore only if they don't already contain one
  const projectName = parts
    .slice(0, 3) // Take up to 3 meaningful parts
    .map(part => part.replace(/[_-]+/g, '_')) // Normalize any existing separators to single underscore
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