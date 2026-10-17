/**
 * For simple CRUD projects that don't need login:
 *   npm run remove:auth   →   then: npm install
 * Deletes the auth module and everything that exists only for it.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, removeModuleFromRegistry } from './lib/modules-registry';

const AUTH_BLOCK = /\n?# --- auth:start ---[\s\S]*?# --- auth:end ---\n?/;

function removePath(relative: string): void {
  const target = path.join(ROOT_DIR, relative);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`  deleted ${relative}`);
  }
}

function stripAuthEnv(relative: string): void {
  const target = path.join(ROOT_DIR, relative);
  if (!existsSync(target)) return;
  const content = readFileSync(target, 'utf8');
  if (AUTH_BLOCK.test(content)) {
    writeFileSync(target, `${content.replace(AUTH_BLOCK, '\n').trimEnd()}\n`);
    console.log(`  removed auth variables from ${relative}`);
  }
}

function updatePackageJson(): void {
  const file = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8')) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  delete pkg.scripts?.['seed:admin'];
  delete pkg.scripts?.['remove:auth'];
  delete pkg.dependencies?.['jsonwebtoken'];
  delete pkg.dependencies?.['bcryptjs'];
  delete pkg.devDependencies?.['@types/jsonwebtoken'];
  delete pkg.devDependencies?.['@types/bcryptjs'];

  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('  removed auth scripts and dependencies from package.json');
}

function main(): void {
  if (!existsSync(path.join(ROOT_DIR, 'src', 'modules', 'auth'))) {
    console.log('Auth module is already removed.');
    return;
  }

  removeModuleFromRegistry('authModule');
  console.log('  unregistered authModule from src/modules/index.ts');

  removePath('src/modules/auth');
  removePath('scripts/seed-admin.ts');
  stripAuthEnv('.env.example');
  stripAuthEnv('.env');
  updatePackageJson();
  removePath('scripts/remove-auth.ts');

  console.log('\n✅ Auth removed. Now run: npm install');
}

main();
