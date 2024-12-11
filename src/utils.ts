import * as path from 'path';
import * as fs from 'fs';

export function getProjectName(fullPath: string): string {
  const parts = fullPath.split(path.sep);
  // Find the first meaningful parent folders after filtering out system folders
  const systemFolders = ['Users', 'user', 'home', 'Documents', 'github', 'salmanaziz'];
  const meaningfulParts = parts.filter(part => !systemFolders.includes(part));
  
  // Take up to 3 meaningful folder names
  return meaningfulParts.slice(0, 3).join('_');
}

export function ensureResultFolder(): string {
  const resultFolder = path.join(process.cwd(), 'result');
  if (!fs.existsSync(resultFolder)) {
    fs.mkdirSync(resultFolder, { recursive: true });
  }
  return resultFolder;
}