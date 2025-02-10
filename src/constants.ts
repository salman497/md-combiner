export const INCLUDED_EXTENSIONS = ['.md', '.txt', '.yaml', '.yml', '.json', '.ts', '.js', '.ipynb', '.mdx'];
export const LARGE_FILE_THRESHOLD = 102400; // 100 KB in bytes
export const LARGE_FILES_KEY = 'largeTextContentFiles';
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;
export const IGNORED_SYSTEM_FOLDERS = ['Users', 'user', 'home', 'salmanaziz','Documents', 'github'];

export const IGNORED_FILES = [
  'contributing.md',
  'CONTRIBUTING.md',
  'license.md',
  'LICENSE.md',
  'CODE_OF_CONDUCT.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'SUPPORT.md',
  'AUTHORS.md',
  '.gitignore.md'
];