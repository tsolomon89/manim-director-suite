/**
 * Complex Number Type System
 *
 * Supports:
 * - Rectangular form: z = a + bi
 * - Polar form: z = r * e^(iθ)
 * - Arithmetic operations
 * - Common complex functions
 */

export interface ComplexNumber {
  /** Real part */
  real: number;

  /** Imaginary part */
  imag: number;
}

export interface PolarComplexNumber {
  /** Magnitude (r) */
  magnitude: number;

  /** Angle in radians (θ) */
  angle: number;
}

/**
 * Complex arithmetic operations
 */
export class Complex implements ComplexNumber {
  constructor(
    public real: number,
    public imag: number
  ) {}

  // ===== Factory Methods =====

  static fromPolar(magnitude: number, angle: number): Complex {
    return new Complex(
      magnitude * Math.cos(angle),
      magnitude * Math.sin(angle)
    );
  }

  static fromString(str: string): Complex {
    // Parse formats: "3+4i", "3-4i", "5i", "7", "2+i", "-3i"
    const cleanStr = str.replace(/\s/g, '');

    // Pure real: "7"
    if (!cleanStr.includes('i')) {
      return new Complex(parseFloat(cleanStr), 0);
    }

    // Pure imaginary: "5i" or "-3i" or "i"
    if (!/[+-]/.test(cleanStr.slice(1))) {
      const imagStr = cleanStr.replace('i', '');
      const imag = imagStr === '' || imagStr === '+' ? 1 :
                   imagStr === '-' ? -1 :
                   parseFloat(imagStr);
      return new Complex(0, imag);
    }

    // Rectangular form: "3+4i" or "3-4i"
    const match = cleanStr.match(/^([+-]?[\d.]+)([+-])([\d.]*)i$/);
    if (match) {
      const real = parseFloat(match[1]);
      const sign = match[2] === '+' ? 1 : -1;
      const imagMagnitude = match[3] === '' ? 1 : parseFloat(match[3]);
      return new Complex(real, sign * imagMagnitude);
    }

    throw new Error(`Invalid complex number format: ${str}`);
  }

  // ===== Conversion Methods =====

  toPolar(): PolarComplexNumber {
    return {
      magnitude: this.magnitude(),
      angle: this.angle(),
    };
  }

  toString(format: 'rectangular' | 'polar' = 'rectangular'): string {
    if (format === 'polar') {
      const polar = this.toPolar();
      return `${polar.magnitude.toFixed(3)}∠${(polar.angle * 180 / Math.PI).toFixed(1)}°`;
    }

    // Rectangular
    if (this.imag === 0) return this.real.toString();
    if (this.real === 0) return this.imag === 1 ? 'i' : `${this.imag}i`;

    const sign = this.imag >= 0 ? '+' : '-';
    const imagPart = Math.abs(this.imag) === 1 ? 'i' : `${Math.abs(this.imag)}i`;
    return `${this.real}${sign}${imagPart}`;
  }

  // ===== Basic Properties =====

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  angle(): number {
    return Math.atan2(this.imag, this.real);
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  // ===== Arithmetic Operations =====

  add(other: Complex): Complex {
    return new Complex(
      this.real + other.real,
      this.imag + other.imag
    );
  }

  subtract(other: Complex): Complex {
    return new Complex(
      this.real - other.real,
      this.imag - other.imag
    );
  }

  multiply(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.real * other, this.imag * other);
    }

    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  divide(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.real / other, this.imag / other);
    }

    const denominator = other.real * other.real + other.imag * other.imag;
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  power(n: number): Complex {
    // Use polar form: (r*e^(iθ))^n = r^n * e^(inθ)
    const polar = this.toPolar();
    return Complex.fromPolar(
      Math.pow(polar.magnitude, n),
      polar.angle * n
    );
  }

  // ===== Complex Functions =====

  exp(): Complex {
    // e^(a+bi) = e^a * (cos(b) + i*sin(b))
    const expReal = Math.exp(this.real);
    return new Complex(
      expReal * Math.cos(this.imag),
      expReal * Math.sin(this.imag)
    );
  }

  sqrt(): Complex {
    // Principal square root
    const polar = this.toPolar();
    return Complex.fromPolar(
      Math.sqrt(polar.magnitude),
      polar.angle / 2
    );
  }

  sin(): Complex {
    // sin(a+bi) = sin(a)*cosh(b) + i*cos(a)*sinh(b)
    return new Complex(
      Math.sin(this.real) * Math.cosh(this.imag),
      Math.cos(this.real) * Math.sinh(this.imag)
    );
  }

  cos(): Complex {
    // cos(a+bi) = cos(a)*cosh(b) - i*sin(a)*sinh(b)
    return new Complex(
      Math.cos(this.real) * Math.cosh(this.imag),
      -Math.sin(this.real) * Math.sinh(this.imag)
    );
  }

  log(): Complex {
    // log(z) = log|z| + i*arg(z)
    const polar = this.toPolar();
    return new Complex(
      Math.log(polar.magnitude),
      polar.angle
    );
  }

  // ===== Utility =====

  equals(other: Complex, epsilon = 1e-10): boolean {
    return Math.abs(this.real - other.real) < epsilon &&
           Math.abs(this.imag - other.imag) < epsilon;
  }

  clone(): Complex {
    return new Complex(this.real, this.imag);
  }
}

/**
 * Common complex constants
 */
export const ComplexConstants = {
  ZERO: new Complex(0, 0),
  ONE: new Complex(1, 0),
  I: new Complex(0, 1),
  NEG_I: new Complex(0, -1),
  NEG_ONE: new Complex(-1, 0),
};

/**
 * Polynomial operations with complex coefficients
 */
export class ComplexPolynomial {
  /**
   * @param coefficients - Ordered from lowest to highest degree
   * Example: [c0, c1, c2] represents c0 + c1*z + c2*z^2
   */
  constructor(public coefficients: Complex[]) {}

  /**
   * Evaluate polynomial at z
   */
  evaluate(z: Complex): Complex {
    let result = ComplexConstants.ZERO;
    let power = ComplexConstants.ONE;

    for (const coef of this.coefficients) {
      result = result.add(coef.multiply(power));
      power = power.multiply(z);
    }

    return result;
  }

  /**
   * Compute derivative polynomial
   */
  derivative(): ComplexPolynomial {
    if (this.coefficients.length <= 1) {
      return new ComplexPolynomial([ComplexConstants.ZERO]);
    }

    const derivCoefs = this.coefficients
      .slice(1)
      .map((coef, idx) => coef.multiply(idx + 1));

    return new ComplexPolynomial(derivCoefs);
  }

  /**
   * Find roots using numerical methods (Durand-Kerner algorithm)
   */
  findRoots(maxIterations = 100, tolerance = 1e-10): Complex[] {
    const degree = this.coefficients.length - 1;
    if (degree === 0) return [];
    if (degree === 1) {
      // Linear: az + b = 0 => z = -b/a
      return [this.coefficients[0].divide(this.coefficients[1]).multiply(-1)];
    }

    // Initialize roots on unit circle
    const roots: Complex[] = [];
    for (let k = 0; k < degree; k++) {
      const angle = 2 * Math.PI * k / degree;
      roots.push(Complex.fromPolar(1, angle));
    }

    // Durand-Kerner iteration
    for (let iter = 0; iter < maxIterations; iter++) {
      const newRoots: Complex[] = [];
      let maxChange = 0;

      for (let i = 0; i < degree; i++) {
        const z = roots[i];
        const pz = this.evaluate(z);

        let denominator = ComplexConstants.ONE;
        for (let j = 0; j < degree; j++) {
          if (i !== j) {
            denominator = denominator.multiply(z.subtract(roots[j]));
          }
        }

        const delta = pz.divide(denominator);
        const newZ = z.subtract(delta);
        newRoots.push(newZ);

        maxChange = Math.max(maxChange, delta.magnitude());
      }

      roots.splice(0, roots.length, ...newRoots);

      if (maxChange < tolerance) {
        break;
      }
    }

    return roots;
  }

  /**
   * Create polynomial from roots
   */
  static fromRoots(roots: Complex[]): ComplexPolynomial {
    if (roots.length === 0) {
      return new ComplexPolynomial([ComplexConstants.ONE]);
    }

    // Start with (z - r0)
    let coeffs = [roots[0].multiply(-1), ComplexConstants.ONE];

    // Multiply by (z - ri) for each subsequent root
    for (let i = 1; i < roots.length; i++) {
      const newCoeffs: Complex[] = [ComplexConstants.ZERO];

      // Multiply existing polynomial by (z - ri)
      for (let j = 0; j < coeffs.length; j++) {
        newCoeffs[j] = newCoeffs[j].add(coeffs[j].multiply(roots[i].multiply(-1)));
        newCoeffs[j + 1] = coeffs[j];
      }

      coeffs = newCoeffs;
    }

    return new ComplexPolynomial(coeffs);
  }
}
