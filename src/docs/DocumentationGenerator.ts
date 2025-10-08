/**
 * Documentation Generator
 *
 * Automatically generates markdown documentation from:
 * - Operator definitions (operator-types.ts)
 * - Fractal presets (fractal-types.ts)
 * - Config schemas (config/types.ts)
 *
 * Run with: npm run docs:generate
 */

import fs from 'fs';
import path from 'path';
import { BUILTIN_OPERATORS, type OperatorDefinition } from '../engine/operator-types.js';
import { FRACTAL_PRESETS } from '../engine/fractal-types.js';
import { unifiedOperatorSystem } from '../engine/UnifiedOperatorSystem.js';
import type { OperatorCapability } from '../engine/operator-capability-types.js';

export class DocumentationGenerator {
  private outputDir: string;

  constructor(outputDir = 'public/docs/reference') {
    this.outputDir = outputDir;
  }

  /**
   * Generate all documentation files
   */
  generateAll(): void {
    console.log('📚 Generating documentation...\n');

    this.generateOperatorReference();
    this.generateFractalPresets();
    this.generateUnifiedOperatorDocs();
    this.generateComplexNumberGuide();
    this.updateIndexJson();

    console.log('\n✅ Documentation generation complete!');
  }

  /**
   * Generate operator reference from BUILTIN_OPERATORS
   */
  private generateOperatorReference(): void {
    const operators = Object.values(BUILTIN_OPERATORS);
    const categories = this.groupByCategory(operators);

    const lines: string[] = [];

    // Header
    lines.push('# Operator Reference');
    lines.push('');
    lines.push('> **Auto-generated from `src/engine/operator-types.ts`**');
    lines.push('> Last updated: ' + new Date().toISOString());
    lines.push('');
    lines.push('Complete reference for all built-in operators in Parametric Keyframe Studio.');
    lines.push('');

    // Table of contents
    lines.push('## Categories');
    lines.push('');
    for (const category of Object.keys(categories)) {
      lines.push(`- [${this.formatCategory(category)}](#${this.slugify(category)})`);
    }
    lines.push('');

    // Each category
    for (const [category, ops] of Object.entries(categories)) {
      lines.push(`## ${this.formatCategory(category)}`);
      lines.push('');

      for (const op of ops) {
        lines.push(`### ${op.name}`);
        lines.push('');

        // Description
        lines.push(`**Description:** ${op.description}`);
        lines.push('');

        // Syntax
        lines.push('**LaTeX Syntax:**');
        lines.push('```latex');
        lines.push(op.latex);
        lines.push('```');
        lines.push('');

        // Internal name
        if (op.mathJsName) {
          lines.push(`**Internal:** \`${op.mathJsName}()\``);
          lines.push('');
        }

        // Arity
        lines.push(`**Arity:** ${op.arity}`);
        lines.push('');

        // Type signature
        lines.push('**Type Signature:**');
        lines.push('```typescript');
        const params = op.signature.params.join(', ');
        const variadic = op.signature.variadic ? ', ...' : '';
        lines.push(`${op.id}(${params}${variadic}) → ${op.signature.returns}`);
        lines.push('```');
        lines.push('');

        // Examples
        if (op.examples.length > 0) {
          lines.push('**Examples:**');
          lines.push('');
          for (const example of op.examples) {
            lines.push(`- \`${example}\``);
          }
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    // Usage in app
    lines.push('## Usage in Application');
    lines.push('');
    lines.push('### LaTeX Input');
    lines.push('');
    lines.push('```typescript');
    lines.push("import { operatorRegistry } from './engine/OperatorRegistry';");
    lines.push('');
    lines.push('// Convert LaTeX to internal format');
    lines.push("const expr = operatorRegistry.fromLatex('\\\\int_{0}^{1} x^2 dx');");
    lines.push("// → 'integrate(x^2, 0, 1, x)'");
    lines.push('```');
    lines.push('');

    lines.push('### LaTeX Output');
    lines.push('');
    lines.push('```typescript');
    lines.push('// Convert internal format to LaTeX');
    lines.push("const latex = operatorRegistry.toLatex('sum(n^2, 0, 10, n)');");
    lines.push("// → '\\\\sum_{n=0}^{10} n^2'");
    lines.push('```');
    lines.push('');

    lines.push('## Custom Operators');
    lines.push('');
    lines.push('You can register custom operators:');
    lines.push('');
    lines.push('```typescript');
    lines.push('operatorRegistry.register({');
    lines.push("  id: 'myop',");
    lines.push("  name: 'My Custom Operator',");
    lines.push("  category: 'special',");
    lines.push("  arity: 'binary',");
    lines.push('  signature: { params: [\'number\', \'number\'], returns: \'number\' },');
    lines.push("  latex: '\\\\operatorname{myop}\\\\left({{{a}}}, {{{b}}}\\\\right)',");
    lines.push("  description: 'Does something special',");
    lines.push('  examples: [\'myop(1, 2)\'],');
    lines.push('  implementation: (a, b) => {');
    lines.push('    // Your logic here');
    lines.push('    return a + b;');
    lines.push('  },');
    lines.push('});');
    lines.push('```');
    lines.push('');

    // Write file
    const outputPath = path.join(this.outputDir, 'operators.md');
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    console.log(`✓ Generated: ${outputPath}`);
  }

  /**
   * Generate fractal presets documentation
   */
  private generateFractalPresets(): void {
    const lines: string[] = [];

    lines.push('# Fractal Presets');
    lines.push('');
    lines.push('> **Auto-generated from `src/engine/fractal-types.ts`**');
    lines.push('> Last updated: ' + new Date().toISOString());
    lines.push('');
    lines.push('Built-in fractal presets ready to use.');
    lines.push('');

    lines.push('## Available Presets');
    lines.push('');

    for (const [id, preset] of Object.entries(FRACTAL_PRESETS)) {
      lines.push(`### ${preset.name}`);
      lines.push('');
      lines.push(`**ID:** \`${id}\``);
      lines.push('');
      lines.push(`**Type:** ${preset.fractalType}`);
      lines.push('');

      // Newton config
      if ('newtonConfig' in preset && preset.newtonConfig) {
        const config = preset.newtonConfig;
        lines.push('**Configuration:**');
        lines.push('');
        lines.push('- **Polynomial Degree:** ' + (config.coefficients?.length ? config.coefficients.length - 1 : 'N/A'));
        lines.push('- **Number of Roots:** ' + (config.rootColors?.length || 0));
        lines.push('- **Root Colors:** ' + (config.rootColors?.join(', ') || 'N/A'));
        lines.push('');
      }

      // Mandelbrot/Julia config
      if ('mandelbrotJuliaConfig' in preset && preset.mandelbrotJuliaConfig) {
        const config = preset.mandelbrotJuliaConfig;
        lines.push('**Configuration:**');
        lines.push('');
        lines.push('- **Power:** ' + (config.power || 2));

        if ('juliaParameter' in config && config.juliaParameter) {
          lines.push(`- **Julia Parameter:** ${config.juliaParameter.real} + ${config.juliaParameter.imag}i`);
        }

        lines.push('- **Max Iterations:** ' + (config.colorMap?.maxIterations || 256));
        lines.push('- **Color Smoothing:** ' + (config.colorMap?.smoothing || 'none'));
        lines.push('');
      }

      lines.push('**Usage:**');
      lines.push('');
      lines.push('```typescript');
      lines.push("import { FractalManager } from './engine/FractalManager';");
      lines.push('');
      lines.push('const manager = new FractalManager();');
      lines.push(`const { fractal } = manager.createFromPreset('${id}');`);
      lines.push('```');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // Custom fractals section
    lines.push('## Creating Custom Fractals');
    lines.push('');

    lines.push('### Newton Fractal (from roots)');
    lines.push('');
    lines.push('```typescript');
    lines.push('manager.createNewtonFromRoots([');
    lines.push('  { real: 1, imag: 0 },');
    lines.push('  { real: -0.5, imag: 0.866 },');
    lines.push('  { real: -0.5, imag: -0.866 },');
    lines.push("], ['#FF0000', '#00FF00', '#0000FF']);");
    lines.push('```');
    lines.push('');

    lines.push('### Mandelbrot Set');
    lines.push('');
    lines.push('```typescript');
    lines.push('manager.createMandelbrot({');
    lines.push('  power: 2,');
    lines.push('  colorMap: {');
    lines.push('    maxIterations: 256,');
    lines.push("    colorScale: ['#000033', '#0000BB', '#FFFFFF'],");
    lines.push("    insideColor: '#000000',");
    lines.push("    smoothing: 'log',");
    lines.push('  },');
    lines.push('});');
    lines.push('```');
    lines.push('');

    lines.push('### Julia Set');
    lines.push('');
    lines.push('```typescript');
    lines.push('manager.createJulia(');
    lines.push('  { real: -0.7, imag: 0.27 },');
    lines.push('  { maxIterations: 256 }');
    lines.push(');');
    lines.push('```');
    lines.push('');

    const outputPath = path.join(this.outputDir, 'fractal-presets.md');
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    console.log(`✓ Generated: ${outputPath}`);
  }

  /**
   * Generate complex number guide
   */
  private generateComplexNumberGuide(): void {
    const lines: string[] = [];

    lines.push('# Complex Numbers Guide');
    lines.push('');
    lines.push('> **Auto-generated documentation**');
    lines.push('> Last updated: ' + new Date().toISOString());
    lines.push('');
    lines.push('Working with complex numbers in Parametric Keyframe Studio.');
    lines.push('');

    lines.push('## Creating Complex Numbers');
    lines.push('');

    lines.push('### Rectangular Form');
    lines.push('');
    lines.push('```typescript');
    lines.push("import { Complex } from './engine/complex-types';");
    lines.push('');
    lines.push('// From real and imaginary parts');
    lines.push('const z = new Complex(3, 4);  // 3 + 4i');
    lines.push('');
    lines.push('// From string');
    lines.push('const w = Complex.fromString("2-i");  // 2 - i');
    lines.push('const u = Complex.fromString("5i");   // 5i');
    lines.push('const v = Complex.fromString("7");    // 7 + 0i');
    lines.push('```');
    lines.push('');

    lines.push('### Polar Form');
    lines.push('');
    lines.push('```typescript');
    lines.push('// From magnitude and angle');
    lines.push('const z = Complex.fromPolar(2, Math.PI / 4);  // 2∠45° = √2 + i√2');
    lines.push('');
    lines.push('// Convert to polar');
    lines.push('const w = new Complex(1, 1);');
    lines.push('const polar = w.toPolar();');
    lines.push('// → { magnitude: 1.414, angle: 0.785 }');
    lines.push('```');
    lines.push('');

    lines.push('## Arithmetic Operations');
    lines.push('');
    lines.push('```typescript');
    lines.push('const z = new Complex(3, 4);');
    lines.push('const w = new Complex(1, 2);');
    lines.push('');
    lines.push('z.add(w)       // (3+4i) + (1+2i) = 4+6i');
    lines.push('z.subtract(w)  // (3+4i) - (1+2i) = 2+2i');
    lines.push('z.multiply(w)  // (3+4i) × (1+2i) = -5+10i');
    lines.push('z.divide(w)    // (3+4i) / (1+2i) = 2.2-0.4i');
    lines.push('z.power(2)     // (3+4i)² = -7+24i');
    lines.push('```');
    lines.push('');

    lines.push('## Complex Functions');
    lines.push('');
    lines.push('```typescript');
    lines.push('const z = new Complex(1, 0);');
    lines.push('');
    lines.push('z.exp()        // e^z');
    lines.push('z.sqrt()       // √z (principal branch)');
    lines.push('z.sin()        // sin(z)');
    lines.push('z.cos()        // cos(z)');
    lines.push('z.log()        // log(z) (principal branch)');
    lines.push('z.conjugate()  // Complex conjugate z̄');
    lines.push('```');
    lines.push('');

    lines.push('## Properties');
    lines.push('');
    lines.push('```typescript');
    lines.push('const z = new Complex(3, 4);');
    lines.push('');
    lines.push('z.magnitude()  // |z| = 5');
    lines.push('z.angle()      // arg(z) = 0.927 radians (≈53.1°)');
    lines.push('z.real         // Real part: 3');
    lines.push('z.imag         // Imaginary part: 4');
    lines.push('z.toString()   // "3+4i"');
    lines.push('```');
    lines.push('');

    lines.push('## Polynomials');
    lines.push('');
    lines.push('```typescript');
    lines.push("import { ComplexPolynomial } from './engine/complex-types';");
    lines.push('');
    lines.push('// Create polynomial: z³ - 1');
    lines.push('const poly = new ComplexPolynomial([');
    lines.push('  { real: -1, imag: 0 },  // -1');
    lines.push('  { real: 0, imag: 0 },   // 0z');
    lines.push('  { real: 0, imag: 0 },   // 0z²');
    lines.push('  { real: 1, imag: 0 },   // z³');
    lines.push(']);');
    lines.push('');
    lines.push('// Evaluate at z = 1');
    lines.push('const result = poly.evaluate({ real: 1, imag: 0 });');
    lines.push('// → { real: 0, imag: 0 }');
    lines.push('');
    lines.push('// Find all roots');
    lines.push('const roots = poly.findRoots();');
    lines.push('// → [1+0i, -0.5+0.866i, -0.5-0.866i]');
    lines.push('');
    lines.push('// Get derivative: 3z²');
    lines.push('const deriv = poly.derivative();');
    lines.push('```');
    lines.push('');

    lines.push('## Use in Parameters');
    lines.push('');
    lines.push('Complex numbers can be used as parameter values:');
    lines.push('');
    lines.push('```typescript');
    lines.push('const param: Parameter = {');
    lines.push("  id: 'z',");
    lines.push("  name: 'z',");
    lines.push('  value: { real: 3, imag: 4 },');
    lines.push('  isComplex: true,');
    lines.push('  uiControl: { type: \'complex\', /* ... */ },');
    lines.push('};');
    lines.push('```');
    lines.push('');

    const outputPath = path.join(this.outputDir, 'complex-numbers.md');
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    console.log(`✓ Generated: ${outputPath}`);
  }

  /**
   * Generate unified operator system documentation
   */
  private generateUnifiedOperatorDocs(): void {
    const lines: string[] = [];

    lines.push('# Unified Operator System');
    lines.push('');
    lines.push('> **Auto-generated from `UnifiedOperatorSystem`**');
    lines.push('> Last updated: ' + new Date().toISOString());
    lines.push('');
    lines.push('Complete guide to the capability-based operator architecture.');
    lines.push('');

    // Get all operators from the system
    const operators = unifiedOperatorSystem.getAllEnabled();

    // Group by category
    const categoryMap = new Map<string, OperatorCapability[]>();
    for (const op of operators) {
      if (!categoryMap.has(op.category)) {
        categoryMap.set(op.category, []);
      }
      categoryMap.get(op.category)!.push(op);
    }

    lines.push('## Available Operators');
    lines.push('');
    lines.push('| Operator | Category | Presets | Complexity |');
    lines.push('|----------|----------|---------|------------|');

    for (const op of operators) {
      const presetCount = op.presets ? Object.keys(op.presets).length : 0;
      lines.push(`| **${op.name}** | ${op.category} | ${presetCount} | ${op.complexity} |`);
    }
    lines.push('');

    // Details for each category
    for (const [category, ops] of categoryMap) {
      lines.push(`## ${this.formatCategory(category)} Operators`);
      lines.push('');

      for (const op of ops) {
        lines.push(`### ${op.name}`);
        lines.push('');
        lines.push(`**ID:** \`${op.id}\``);
        lines.push('');
        lines.push(`**Description:** ${op.description}`);
        lines.push('');

        // Visualization modes
        lines.push('**Visualization Modes:**');
        lines.push('');
        const modes = Object.keys(op.visualizationModes);
        for (const mode of modes) {
          lines.push(`- ${mode}`);
        }
        lines.push('');

        // Required controls
        lines.push('**Required Controls:**');
        lines.push('');
        for (const control of op.requiredControls) {
          lines.push(`- **${control.label}** (\`${control.id}\`) - ${control.type}`);
          if (control.description) {
            lines.push(`  - ${control.description}`);
          }
        }
        lines.push('');

        // Presets
        if (op.presets && Object.keys(op.presets).length > 0) {
          lines.push('**Presets:**');
          lines.push('');
          for (const [presetId, preset] of Object.entries(op.presets)) {
            lines.push(`- **${preset.name}** (\`${presetId}\`) - ${preset.description}`);
          }
          lines.push('');
        }

        // Usage example
        lines.push('**Usage:**');
        lines.push('');
        lines.push('```typescript');
        lines.push("import { unifiedOperatorSystem } from './engine/UnifiedOperatorSystem';");
        lines.push('');
        if (op.presets && Object.keys(op.presets).length > 0) {
          const firstPresetId = Object.keys(op.presets)[0];
          lines.push('// From preset');
          lines.push(`const plottable = unifiedOperatorSystem.createFromPreset('${firstPresetId}');`);
          lines.push('');
        }
        lines.push('// Custom configuration');
        lines.push(`const plottable = unifiedOperatorSystem.create('${op.id}', {`);
        lines.push(`  operatorId: '${op.id}',`);
        lines.push('  values: {');
        for (const control of op.requiredControls.slice(0, 2)) {
          lines.push(`    ${control.id}: ${JSON.stringify(control.default)},`);
        }
        if (op.requiredControls.length > 2) {
          lines.push('    // ... more controls');
        }
        lines.push('  },');
        lines.push('});');
        lines.push('```');
        lines.push('');

        lines.push('---');
        lines.push('');
      }
    }

    // API reference
    lines.push('## API Reference');
    lines.push('');
    lines.push('### UnifiedOperatorSystem Methods');
    lines.push('');
    lines.push('```typescript');
    lines.push('// Get all enabled operators');
    lines.push('const operators = unifiedOperatorSystem.getAllEnabled();');
    lines.push('');
    lines.push('// Get operators by category');
    lines.push("const fractals = unifiedOperatorSystem.getByCategory('fractal');");
    lines.push('');
    lines.push('// Get controls for an operator');
    lines.push("const controls = unifiedOperatorSystem.getControlsFor('newton');");
    lines.push('');
    lines.push('// Search operators');
    lines.push("const results = unifiedOperatorSystem.search('mandelbrot');");
    lines.push('');
    lines.push('// Get most used');
    lines.push('const popular = unifiedOperatorSystem.getMostUsed(5);');
    lines.push('```');
    lines.push('');

    const outputPath = path.join(this.outputDir, 'unified-operators.md');
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    console.log(`✓ Generated: ${outputPath}`);
  }

  /**
   * Update index.json with new documentation files
   */
  private updateIndexJson(): void {
    const indexPath = path.join('public/docs', 'index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    // Find reference category
    const refCategory = index.categories.find((c: any) => c.id === 'reference');
    if (!refCategory) return;

    // Add new docs if they don't exist
    const newDocs = [
      {
        id: 'operators',
        title: 'Operator Reference',
        file: 'reference/operators.md',
        description: 'Complete reference for all mathematical operators',
        tags: ['operators', 'math', 'reference', 'auto-generated'],
        order: 5,
      },
      {
        id: 'unified-operators',
        title: 'Unified Operator System',
        file: 'reference/unified-operators.md',
        description: 'Capability-based operator architecture and API',
        tags: ['operators', 'architecture', 'api', 'auto-generated'],
        order: 6,
      },
      {
        id: 'fractal-presets',
        title: 'Fractal Presets',
        file: 'reference/fractal-presets.md',
        description: 'Built-in fractal configurations and usage',
        tags: ['fractals', 'presets', 'reference', 'auto-generated'],
        order: 7,
      },
      {
        id: 'complex-numbers',
        title: 'Complex Numbers',
        file: 'reference/complex-numbers.md',
        description: 'Working with complex numbers and polynomials',
        tags: ['complex', 'math', 'reference', 'auto-generated'],
        order: 8,
      },
    ];

    for (const newDoc of newDocs) {
      const exists = refCategory.documents.some((d: any) => d.id === newDoc.id);
      if (!exists) {
        refCategory.documents.push(newDoc);
      }
    }

    // Sort by order
    refCategory.documents.sort((a: any, b: any) => a.order - b.order);

    // Write updated index
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    console.log(`✓ Updated: ${indexPath}`);
  }

  /**
   * Group operators by category
   */
  private groupByCategory(operators: OperatorDefinition[]): Record<string, OperatorDefinition[]> {
    const groups: Record<string, OperatorDefinition[]> = {};

    for (const op of operators) {
      if (!groups[op.category]) {
        groups[op.category] = [];
      }
      groups[op.category].push(op);
    }

    return groups;
  }

  /**
   * Format category name
   */
  private formatCategory(category: string): string {
    return category
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Convert string to slug
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

// CLI entry point
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const generator = new DocumentationGenerator();
  generator.generateAll();
}
