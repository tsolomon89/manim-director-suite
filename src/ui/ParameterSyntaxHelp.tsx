import { useState } from 'react';
import './ParameterSyntaxHelp.css';

export function ParameterSyntaxHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="syntax-help">
      <button
        className="syntax-help-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Show syntax help"
      >
        ?
      </button>

      {isOpen && (
        <div className="syntax-help-panel">
          <div className="syntax-help-header">
            <h3>Expression Syntax</h3>
            <button onClick={() => setIsOpen(false)} className="close-button">×</button>
          </div>

          <div className="syntax-help-content">
            <section>
              <h4>Basic Expressions</h4>
              <div className="syntax-examples">
                <code>710</code> <span>Simple constant</span>
                <code>2 * Z</code> <span>Reference other parameters</span>
                <code>Z + T - 5</code> <span>Arithmetic operations</span>
                <code>Z^2</code> <span>Exponentiation</span>
                <code>Z / T</code> <span>Division</span>
              </div>
            </section>

            <section>
              <h4>Mathematical Functions</h4>
              <div className="syntax-examples">
                <code>sin(x)</code> <span>Sine</span>
                <code>cos(x)</code> <span>Cosine</span>
                <code>tan(x)</code> <span>Tangent</span>
                <code>sqrt(x)</code> <span>Square root</span>
                <code>abs(x)</code> <span>Absolute value</span>
                <code>log(x)</code> <span>Natural logarithm</span>
                <code>exp(x)</code> <span>e^x</span>
                <code>floor(x)</code> <span>Round down</span>
                <code>ceil(x)</code> <span>Round up</span>
              </div>
            </section>

            <section>
              <h4>Constants</h4>
              <div className="syntax-examples">
                <code>pi</code> <span>π ≈ 3.14159...</span>
                <code>e</code> <span>Euler's number ≈ 2.71828...</span>
                <code>tau</code> <span>τ = 2π ≈ 6.28318...</span>
                <code>phi</code> <span>Golden ratio ≈ 1.61803...</span>
              </div>
            </section>

            <section>
              <h4>Complex Expressions (MVP - Limited)</h4>
              <div className="syntax-examples">
                <code>e^(i*tau*q)</code> <span>⚠️ Use: exp(i*tau*q)</span>
                <code>2*pi*f</code> <span>✅ Angular frequency</span>
                <code>log(T*tau/2)</code> <span>✅ Logarithmic expression</span>
              </div>
              <p className="syntax-note">
                <strong>Note:</strong> For complex numbers, use <code>exp(i*x)</code> syntax.
                LaTeX-style <code>e^{'{'}i x{'}'}</code> not supported in MVP.
              </p>
            </section>

            <section>
              <h4>Variable Names</h4>
              <div className="syntax-examples">
                <code>Z, T, k</code> <span>✅ Valid names</span>
                <code>angle_1</code> <span>✅ Underscores allowed</span>
                <code>sin, cos</code> <span>❌ Reserved (built-in functions)</span>
                <code>123abc</code> <span>❌ Must start with letter</span>
              </div>
              <p className="syntax-note">
                Names must start with a letter or underscore, followed by letters, numbers, or underscores.
              </p>
            </section>

            <section>
              <h4>Examples from Desmos</h4>
              <div className="syntax-examples">
                <code>Z = 710</code> <span>✅ Simple constant</span>
                <code>T = 1.999</code> <span>✅ Decimal value</span>
                <code>k = log(T*tau/2) / log(tau)</code> <span>✅ Complex formula</span>
                <code>f = Z * T</code> <span>✅ Product of parameters</span>
              </div>
            </section>

            <section>
              <h4>Tips</h4>
              <ul className="syntax-tips">
                <li>Create constants first (e.g., <code>Z=710</code>)</li>
                <li>Then create dependent parameters (e.g., <code>k=2*Z</code>)</li>
                <li>Changing Z will automatically update k</li>
                <li>Use parentheses for clarity: <code>(a+b)*c</code></li>
                <li>Circular dependencies are prevented automatically</li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
