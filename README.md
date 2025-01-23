# md-combiner
Combine repository docs into a single markdown file, so that you can perform RAG or Use in Custom GPT!

## 🚀 Features
- Convert folder structures into a single markdown document.
- Auto-generates Table of Contents (optional).
- Supports multiple file extensions (e.g., `.md`, `.txt`, `.json`, etc.).

## 📖 Usage

### Step 1: Install
```bash
npm install
```

### Step 2: Create Folder Structure
```bash
npm run create-md-structure -- "<Your Folder Path>"
```

This will generate a JSON file in the `./result` folder with the structure below:
```
{
  "separator": "------------------- {fileName} -------------------",
  "generateTableOfContent": true,
  "outputFormat": "markdown",
  "folders": { ... }, // Organized files here.
  "intro.md": "/path/to/intro.md",
  "largeTextContentFiles": [] // Large files, so that you cleanup manually.
}
```
Supported extensions that will be combine into markdown: `.md`, `.txt`, `.yaml`, `.yml`, `.json`, `.ts`, `.js`, `.ipynb`, to exclude other extension add `-excludeOtherExtensions` to the command or update constant.ts:


### Step 3: Generate Combined Markdown
Once you have the JSON Structure and reviewed, then combine all files into one markdown:
```bash
npm run generate-md -- "./result/<your-structure-file>.json"
```


