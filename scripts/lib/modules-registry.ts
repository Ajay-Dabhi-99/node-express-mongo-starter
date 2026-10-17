import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
const REGISTRY_FILE = path.join(ROOT_DIR, 'src', 'modules', 'index.ts');
const ARRAY_PATTERN = /export const modules: AppModule\[\] = \[([\s\S]*?)\];/;

function readRegistry(): string {
  return readFileSync(REGISTRY_FILE, 'utf8');
}

function writeArray(source: string, entries: string[]): string {
  return source.replace(
    ARRAY_PATTERN,
    `export const modules: AppModule[] = [${entries.join(', ')}];`,
  );
}

function getEntries(source: string): string[] {
  const match = ARRAY_PATTERN.exec(source);
  if (!match) {
    throw new Error('Could not find the "modules" array in src/modules/index.ts');
  }
  return (match[1] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function addModuleToRegistry(variableName: string, importPath: string): void {
  let source = readRegistry();
  const importLine = `import { ${variableName} } from '${importPath}';`;

  if (!source.includes(importLine)) {
    const lines = source.split('\n');
    let lastImport = -1;
    lines.forEach((line, index) => {
      if (line.startsWith('import ')) lastImport = index;
    });
    lines.splice(lastImport + 1, 0, importLine);
    source = lines.join('\n');
  }

  const entries = getEntries(source);
  if (!entries.includes(variableName)) entries.push(variableName);

  writeFileSync(REGISTRY_FILE, writeArray(source, entries));
}

export function removeModuleFromRegistry(variableName: string): void {
  let source = readRegistry();
  source = source
    .split('\n')
    .filter((line) => !(line.startsWith('import ') && line.includes(`{ ${variableName} }`)))
    .join('\n');

  const entries = getEntries(source).filter((entry) => entry !== variableName);
  writeFileSync(REGISTRY_FILE, writeArray(source, entries));
}
