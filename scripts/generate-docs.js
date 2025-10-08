#!/usr/bin/env node
/**
 * Documentation Generation Script
 *
 * Compiles TypeScript and runs documentation generator
 * Usage: npm run docs:generate
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('🔨 Compiling TypeScript...');
  try {
    execSync('npx tsc --project tsconfig.docs.json', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }

  console.log('\n📚 Generating documentation...');
  try {
    // Import and run the generator directly
    const { DocumentationGenerator } = await import('../dist/docs/DocumentationGenerator.js');
    const generator = new DocumentationGenerator();
    generator.generateAll();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Documentation generation failed');
    console.error(error);
    process.exit(1);
  }
})();
