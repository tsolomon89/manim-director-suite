/**
 * Symbol Registry
 * Manages token normalization, Greek symbol mapping, and built-in constants
 */

export interface TokenMapConfig {
  version: number;
  aliases: Record<string, string>;
  constants: Record<string, {
    glyph: string;
    kind: 'constant' | 'imaginary';
    eval: string | null;
    description: string;
  }>;
  greekGlyphs: Record<string, string>;
  operators: Record<string, {
    glyph: string;
    description: string;
  }>;
  functions: Record<string, {
    description: string;
  }>;
}

// Hardcoded fallback if config fails to load
const FALLBACK_TOKEN_MAP: TokenMapConfig = {
  version: 1,
  aliases: {
    'pi': '\\pi',
    'tau': '\\tau',
    'alpha': '\\alpha',
    'beta': '\\beta',
    'gamma': '\\gamma',
    'Gamma': '\\Gamma',
  },
  constants: {
    '\\pi': { glyph: 'π', kind: 'constant', eval: 'Math.PI', description: 'Pi' },
    '\\tau': { glyph: 'τ', kind: 'constant', eval: '2 * Math.PI', description: 'Tau' },
    'e': { glyph: 'e', kind: 'constant', eval: 'Math.E', description: "Euler's number" },
    'i': { glyph: 'i', kind: 'imaginary', eval: null, description: 'Imaginary unit' },
  },
  greekGlyphs: {
    'pi': 'π',
    'tau': 'τ',
    'alpha': 'α',
    'beta': 'β',
    'gamma': 'γ',
    'Gamma': 'Γ',
    '\\pi': 'π',
    '\\tau': 'τ',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\Gamma': 'Γ',
  },
  operators: {
    '\\cdot': { glyph: '·', description: 'Multiplication dot' },
    '\\le': { glyph: '≤', description: 'Less than or equal' },
    '\\ge': { glyph: '≥', description: 'Greater than or equal' },
  },
  functions: {
    '\\sqrt': { description: 'Square root' },
    '\\log': { description: 'Logarithm' },
  },
};

export class SymbolRegistry {
  private tokenMap: TokenMapConfig;
  private aliasRegex: RegExp | null = null;
  private glyphToLatex: Map<string, string> = new Map();

  constructor(tokenMap?: TokenMapConfig) {
    this.tokenMap = tokenMap || FALLBACK_TOKEN_MAP;
    this.buildReverseMap();
    this.buildAliasRegex();
  }

  /**
   * Load token map from config file
   */
  static async loadFromConfig(configPath: string = '/ai_context/specs/token_map.json'): Promise<SymbolRegistry> {
    try {
      // Try to load from ai_context specs first
      const tokenMapResponse = await fetch(configPath);
      const builtinsResponse = await fetch('/ai_context/specs/builtins.json');

      if (!tokenMapResponse.ok) {
        console.warn(`Failed to load token map from ${configPath}, using fallback`);
        return new SymbolRegistry();
      }

      const tokenMapData = await tokenMapResponse.json();
      const builtinsData = builtinsResponse.ok ? await builtinsResponse.json() : null;

      // Convert new format to old format
      const tokenMap = SymbolRegistry.convertNewFormatToOld(tokenMapData, builtinsData);
      return new SymbolRegistry(tokenMap);
    } catch (error) {
      console.warn('Failed to load token map, using fallback', error);
      return new SymbolRegistry();
    }
  }

  /**
   * Convert new ai_context JSON format to old TokenMapConfig format
   */
  private static convertNewFormatToOld(tokenMapData: any, builtinsData: any): TokenMapConfig {
    const aliases: Record<string, string> = {};
    const constants: Record<string, {
      glyph: string;
      kind: 'constant' | 'imaginary';
      eval: string | null;
      description: string;
    }> = {};
    const greekGlyphs: Record<string, string> = {};
    const operators: Record<string, { glyph: string; description: string; }> = {};
    const functions: Record<string, { description: string; }> = {};

    // Process token map rules
    if (tokenMapData.rules) {
      for (const rule of tokenMapData.rules) {
        // Store Greek glyphs
        greekGlyphs[rule.alias] = rule.glyph;

        // If it has a bare token, store as alias
        if (rule.allowBare && rule.bareToken) {
          aliases[rule.bareToken] = rule.alias;
        }
      }
    }

    // Process keyboard operators
    if (tokenMapData.keyboard) {
      if (tokenMapData.keyboard.power) {
        operators['^'] = { glyph: '^', description: 'Power' };
      }
      if (tokenMapData.keyboard.subscript) {
        operators['_'] = { glyph: '_', description: 'Subscript' };
      }
      if (tokenMapData.keyboard.fraction) {
        operators['/'] = { glyph: '/', description: 'Fraction' };
      }
    }

    // Process builtins
    if (builtinsData && builtinsData.constants) {
      for (const builtin of builtinsData.constants) {
        let evalExpr: string | null = null;

        // Map value names to actual eval expressions
        if (builtin.value === 'EULER_NUMBER') {
          evalExpr = 'Math.E';
        } else if (builtin.value === 'PI') {
          evalExpr = 'Math.PI';
        } else if (builtin.value === 'TAU') {
          evalExpr = '2 * Math.PI';
        } else if (builtin.value === 'INFINITY') {
          evalExpr = 'Infinity';
        } else if (builtin.value === 'IMAG_UNIT') {
          evalExpr = null; // No real eval for complex
        }

        const kind: 'constant' | 'imaginary' = builtin.value === 'IMAG_UNIT' ? 'imaginary' : 'constant';

        constants[builtin.name] = {
          glyph: builtin.glyph,
          kind: kind,
          eval: evalExpr,
          description: builtin.description
        };

        // Also store glyph mapping
        greekGlyphs[builtin.name] = builtin.glyph;
      }
    }

    return {
      version: tokenMapData.version || 1,
      aliases,
      constants,
      greekGlyphs,
      operators,
      functions
    };
  }

  /**
   * Build reverse mapping from glyphs to LaTeX commands
   */
  private buildReverseMap(): void {
    // Greek glyphs
    for (const [latex, glyph] of Object.entries(this.tokenMap.greekGlyphs)) {
      this.glyphToLatex.set(glyph, latex);
    }
    // Constants
    for (const [latex, info] of Object.entries(this.tokenMap.constants)) {
      this.glyphToLatex.set(info.glyph, latex);
    }
    // Operators
    for (const [latex, info] of Object.entries(this.tokenMap.operators)) {
      this.glyphToLatex.set(info.glyph, latex);
    }
  }

  /**
   * Build regex for matching aliases at token boundaries
   */
  private buildAliasRegex(): void {
    // Sort aliases by length (longest first) to match greedily
    const aliases = Object.keys(this.tokenMap.aliases).sort((a, b) => b.length - a.length);

    // Build regex pattern with word boundaries
    // Match at start, end, or surrounded by non-letters
    const patterns = aliases.map(alias => {
      // Escape special regex characters
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `(?<=^|[^a-zA-Z])${escaped}(?=$|[^a-zA-Z])`;
    });

    if (patterns.length > 0) {
      this.aliasRegex = new RegExp(patterns.join('|'), 'g');
    }
  }

  /**
   * Normalize a single token (convert aliases to canonical form)
   * @param token - Input token (e.g., 'pi', '\pi', 'π')
   * @returns Normalized LaTeX token (e.g., '\pi')
   */
  normalizeToken(token: string): string {
    // If it's already an alias, return the normalized form
    if (this.tokenMap.aliases[token]) {
      return this.tokenMap.aliases[token];
    }

    // If it's a glyph, convert to LaTeX
    if (this.glyphToLatex.has(token)) {
      return this.glyphToLatex.get(token)!;
    }

    // Return as-is if not found
    return token;
  }

  /**
   * Convert normalized token to display glyph
   * @param normalized - Normalized LaTeX token (e.g., '\pi')
   * @returns Display glyph (e.g., 'π')
   */
  toGlyph(normalized: string): string {
    // Check Greek glyphs
    if (this.tokenMap.greekGlyphs[normalized]) {
      return this.tokenMap.greekGlyphs[normalized];
    }

    // Check constants
    if (this.tokenMap.constants[normalized]) {
      return this.tokenMap.constants[normalized].glyph;
    }

    // Check operators
    if (this.tokenMap.operators[normalized]) {
      return this.tokenMap.operators[normalized].glyph;
    }

    // Return as-is if not found
    return normalized;
  }

  /**
   * Check if a name is a built-in constant or function
   * @param name - Symbol name to check
   * @returns True if it's a reserved built-in
   */
  isBuiltin(name: string): boolean {
    const normalized = this.normalizeToken(name);

    // Check constants
    if (this.tokenMap.constants[normalized]) {
      return true;
    }

    // Check functions
    if (this.tokenMap.functions[normalized]) {
      return true;
    }

    // Additional built-ins not in token map
    const additionalBuiltins = [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
      'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
      'sqrt', 'cbrt', 'abs', 'sign', 'floor', 'ceil', 'round',
      'exp', 'log', 'log10', 'log2', 'ln',
      'pow', 'mod', 'min', 'max',
      'true', 'false', 'null', 'undefined',
    ];

    return additionalBuiltins.includes(name);
  }

  /**
   * Get numeric value for a constant
   * @param name - Constant name (e.g., 'π', '\pi')
   * @returns Numeric value or null if not a constant
   */
  valueOf(name: string): number | null {
    const normalized = this.normalizeToken(name);
    const constant = this.tokenMap.constants[normalized];

    if (!constant || !constant.eval) {
      return null;
    }

    try {
      // Evaluate the expression (e.g., 'Math.PI', '2 * Math.PI')
      // eslint-disable-next-line no-eval
      return eval(constant.eval);
    } catch {
      return null;
    }
  }

  /**
   * Expand all aliases in an expression
   * @param expression - Raw input expression
   * @returns Expression with aliases expanded to glyphs
   */
  expandAliases(expression: string): string {
    if (!this.aliasRegex) {
      return expression;
    }

    // Replace all aliases with their glyphs
    return expression.replace(this.aliasRegex, (match) => {
      const normalized = this.normalizeToken(match);
      return this.toGlyph(normalized);
    });
  }

  /**
   * Normalize an entire expression (expand aliases, convert to glyphs)
   * @param expression - Raw input expression
   * @returns Normalized expression with glyphs
   */
  normalizeExpression(expression: string): string {
    let normalized = expression;

    // First expand LaTeX commands (\pi → π, \tau → τ) - process backslash versions FIRST
    const greekEntries = Object.entries(this.tokenMap.greekGlyphs);
    // Sort so backslash versions come first
    greekEntries.sort((a, b) => (b[0].includes('\\') ? 1 : 0) - (a[0].includes('\\') ? 1 : 0));

    for (const [latex, glyph] of greekEntries) {
      normalized = normalized.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), glyph);
    }

    // Then expand bare aliases (pi → π) for any remaining
    normalized = this.expandAliases(normalized);

    // Expand operators
    for (const [latex, info] of Object.entries(this.tokenMap.operators)) {
      normalized = normalized.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), info.glyph);
    }

    return normalized;
  }

  /**
   * Check if a symbol is a Greek letter
   */
  isGreekSymbol(symbol: string): boolean {
    const normalized = this.normalizeToken(symbol);
    return this.tokenMap.greekGlyphs[normalized] !== undefined;
  }

  /**
   * Get all available Greek symbols
   */
  getGreekSymbols(): Array<{ latex: string; glyph: string }> {
    return Object.entries(this.tokenMap.greekGlyphs).map(([latex, glyph]) => ({
      latex,
      glyph,
    }));
  }

  /**
   * Get all available constants
   */
  getConstants(): Array<{ name: string; glyph: string; value: number | null; description: string }> {
    return Object.entries(this.tokenMap.constants).map(([name, info]) => ({
      name,
      glyph: info.glyph,
      value: this.valueOf(name),
      description: info.description,
    }));
  }
}

// Create singleton instance (will be initialized asynchronously)
let symbolRegistryInstance: SymbolRegistry | null = null;

export async function getSymbolRegistry(): Promise<SymbolRegistry> {
  if (!symbolRegistryInstance) {
    symbolRegistryInstance = await SymbolRegistry.loadFromConfig();
  }
  return symbolRegistryInstance;
}

// Create synchronous instance with fallback (for immediate use)
export const symbolRegistry = new SymbolRegistry();
