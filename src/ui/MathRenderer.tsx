/**
 * Math Renderer
 * Pretty-renders mathematical expressions with Greek symbols, fractions, superscripts, etc.
 */

import React from 'react';
import { symbolRegistry } from '../engine/SymbolRegistry';
import './MathRenderer.css';

export interface MathRendererProps {
  /** Expression to render */
  expression: string;

  /** Display mode: inline or block */
  mode?: 'inline' | 'block';

  /** Additional CSS class */
  className?: string;

  /** Optional style overrides */
  style?: React.CSSProperties;
}

/**
 * Render a mathematical expression with pretty formatting
 */
export function MathRenderer({ expression, mode = 'inline', className, style }: MathRendererProps) {
  const rendered = prettyRender(expression);

  return (
    <span
      className={`math-renderer math-${mode} ${className || ''}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

/**
 * Convert expression to pretty HTML
 * Handles:
 * - Greek symbols (π, τ, α, etc.)
 * - Fractions (a/b → styled fraction)
 * - Superscripts (a^2 → a²)
 * - Subscripts (x_{gain} → x with subscript)
 * - Multiplication dot (2*x → 2·x)
 */
function prettyRender(expression: string): string {
  let html = expression;

  // Normalize Greek symbols first
  html = symbolRegistry.normalizeExpression(html);

  // Handle subscripts: x_{text} → x<sub>text</sub>
  html = html.replace(/([a-zA-Zα-ωΑ-Ω])_\{([^}]+)\}/g, (_match, base, subscript) => {
    return `${base}<sub>${subscript}</sub>`;
  });

  // Handle superscripts with braces: a^{bc} → a<sup>bc</sup>
  html = html.replace(/([a-zA-Zα-ωΑ-Ω0-9)])\^\{([^}]+)\}/g, (_match, base, exponent) => {
    return `${base}<sup>${exponent}</sup>`;
  });

  // Handle simple superscripts: a^2 → a²
  html = html.replace(/([a-zA-Zα-ωΑ-Ω0-9)])\^([0-9])/g, (_match, base, exponent) => {
    return `${base}<sup>${exponent}</sup>`;
  });

  // Handle fractions: a/b → styled fraction
  // Match numerator/denominator pairs
  html = html.replace(/(\([^)]+\)|[a-zA-Zα-ωΑ-Ω0-9π]+)\/(\([^)]+\)|[a-zA-Zα-ωΑ-Ω0-9π]+)/g, (_match, num, denom) => {
    // Remove outer parentheses if present
    const cleanNum = num.replace(/^\(|\)$/g, '');
    const cleanDenom = denom.replace(/^\(|\)$/g, '');
    return `<span class="fraction"><span class="numerator">${cleanNum}</span><span class="denominator">${cleanDenom}</span></span>`;
  });

  // Handle implicit multiplication with dot
  // Replace * with · (middle dot) for display
  html = html.replace(/\*/g, '·');

  // Handle operators
  html = html.replace(/≤/g, '≤');
  html = html.replace(/≥/g, '≥');
  html = html.replace(/≠/g, '≠');
  html = html.replace(/≈/g, '≈');

  // Escape any remaining HTML special characters (except our generated tags)
  // html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return html;
}

/**
 * Inline math renderer (shorthand)
 */
export function InlineMath({ children }: { children: string }) {
  return <MathRenderer expression={children} mode="inline" />;
}

/**
 * Block math renderer (shorthand)
 */
export function BlockMath({ children }: { children: string }) {
  return <MathRenderer expression={children} mode="block" />;
}

/**
 * Display Greek symbol picker helper
 */
export interface GreekSymbolPickerProps {
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

export function GreekSymbolPicker({ onSelect, onClose }: GreekSymbolPickerProps) {
  const symbols = symbolRegistry.getGreekSymbols();

  return (
    <div className="greek-symbol-picker">
      <div className="picker-header">
        <h3>Greek Symbols</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="symbol-grid">
        {symbols.map(({ latex, glyph }) => (
          <button
            key={latex}
            className="symbol-button"
            onClick={() => {
              onSelect(glyph);
              onClose();
            }}
            title={latex}
          >
            {glyph}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Input field with live math preview
 */
export interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showPreview?: boolean;
}

export function MathInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  className,
  autoFocus,
  showPreview = true,
}: MathInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className={`math-input-wrapper ${className || ''}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="math-input"
      />
      {showPreview && !isFocused && value && (
        <div className="math-preview">
          <MathRenderer expression={value} mode="inline" />
        </div>
      )}
    </div>
  );
}
