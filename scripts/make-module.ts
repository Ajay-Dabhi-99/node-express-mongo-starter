/**
 * Generates a complete, standard feature module in 1 second:
 *   npm run make:module order        → src/modules/orders  (route: /api/v1/orders)
 *   npm run make:module blog-post    → src/modules/blog-posts
 * Then open the generated model/schema files and add your real fields.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, addModuleToRegistry } from './lib/modules-registry';

const TEMPLATES_DIR = path.join(__dirname, 'templates', 'module');

const toKebab = (value: string) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

const toPascal = (kebab: string) =>
  kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const toCamel = (kebab: string) => {
  const pascal = toPascal(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

function pluralize(word: string): string {
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

function main(): void {
  const rawName = process.argv[2];
  if (!rawName) {
    console.error('Usage: npm run make:module <singular-name>   e.g. order, blog-post');
    process.exit(1);
  }

  const file = toKebab(rawName);
  if (!/^[a-z][a-z0-9-]*$/.test(file)) {
    console.error(`Invalid module name "${rawName}". Use letters, numbers and dashes.`);
    process.exit(1);
  }

  const route = pluralize(file);
  const tokens: Record<string, string> = {
    __Name__: toPascal(file),
    __name__: toCamel(file),
    __file__: file,
    __route__: route,
    __Tag__: toPascal(route).replace(/([a-z])([A-Z])/g, '$1 $2'),
    __CODE__: file.replace(/-/g, '_').toUpperCase(),
  };

  const moduleDir = path.join(ROOT_DIR, 'src', 'modules', route);
  if (existsSync(moduleDir)) {
    console.error(`Module folder already exists: src/modules/${route}`);
    process.exit(1);
  }

  mkdirSync(path.join(moduleDir, '__tests__'), { recursive: true });

  for (const template of readdirSync(TEMPLATES_DIR)) {
    let content = readFileSync(path.join(TEMPLATES_DIR, template), 'utf8');
    for (const [token, value] of Object.entries(tokens)) {
      content = content.split(token).join(value);
    }

    const kind = template.replace('.ts.tpl', '');
    const target =
      kind === 'index'
        ? 'index.ts'
        : kind === 'test'
          ? path.join('__tests__', `${file}.routes.test.ts`)
          : `${file}.${kind}.ts`;

    writeFileSync(path.join(moduleDir, target), content);
    console.log(`  created src/modules/${route}/${target}`);
  }

  addModuleToRegistry(`${tokens.__name__}Module`, `./${route}`);
  console.log(`  registered ${tokens.__name__}Module in src/modules/index.ts`);
  console.log(`\n✅ Module ready → /api/v1/${route}  (edit the model + schema to add your fields)`);
}

main();
