/**
 * Newton Fractal Fragment Shader
 *
 * Implements Newton's method iteration:
 * z_{n+1} = z_n - P(z_n) / P'(z_n)
 *
 * Colors based on which root the iteration converges to
 */

precision highp float;

varying vec2 v_texCoord;

// Uniforms: Viewport transformation
uniform vec2 u_viewportMin;  // Bottom-left corner in complex plane
uniform vec2 u_viewportMax;  // Top-right corner in complex plane
uniform vec2 u_resolution;   // Canvas resolution

// Uniforms: Polynomial coefficients (complex numbers as vec2)
// Supports up to degree 5 polynomial
uniform int u_degree;
uniform vec2 u_coef0;  // Constant term
uniform vec2 u_coef1;  // z coefficient
uniform vec2 u_coef2;  // z^2 coefficient
uniform vec2 u_coef3;  // z^3 coefficient
uniform vec2 u_coef4;  // z^4 coefficient
uniform vec2 u_coef5;  // z^5 coefficient

// Uniforms: Roots (for coloring)
uniform int u_numRoots;
uniform vec2 u_root0;
uniform vec2 u_root1;
uniform vec2 u_root2;
uniform vec2 u_root3;
uniform vec2 u_root4;

// Uniforms: Root colors (RGB)
uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;

// Uniforms: Rendering parameters
uniform int u_maxIterations;
uniform float u_tolerance;
uniform float u_saturationFactor;
uniform vec3 u_divergentColor;
uniform bool u_blackForCycles;

// ===== Complex Number Arithmetic =====

vec2 c_add(vec2 a, vec2 b) {
  return vec2(a.x + b.x, a.y + b.y);
}

vec2 c_sub(vec2 a, vec2 b) {
  return vec2(a.x - b.x, a.y - b.y);
}

vec2 c_mul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 c_div(vec2 a, vec2 b) {
  float denom = b.x * b.x + b.y * b.y;
  return vec2(
    (a.x * b.x + a.y * b.y) / denom,
    (a.y * b.x - a.x * b.y) / denom
  );
}

float c_mag(vec2 z) {
  return sqrt(z.x * z.x + z.y * z.y);
}

vec2 c_pow(vec2 z, int n) {
  if (n == 0) return vec2(1.0, 0.0);
  if (n == 1) return z;

  vec2 result = z;
  for (int i = 1; i < 10; i++) {  // GLSL requires constant loop bounds
    if (i >= n) break;
    result = c_mul(result, z);
  }
  return result;
}

// ===== Polynomial Evaluation =====

vec2 evaluatePolynomial(vec2 z) {
  vec2 result = vec2(0.0, 0.0);

  // Add each coefficient * z^degree
  if (u_degree >= 0) result = c_add(result, u_coef0);
  if (u_degree >= 1) result = c_add(result, c_mul(u_coef1, z));
  if (u_degree >= 2) result = c_add(result, c_mul(u_coef2, c_pow(z, 2)));
  if (u_degree >= 3) result = c_add(result, c_mul(u_coef3, c_pow(z, 3)));
  if (u_degree >= 4) result = c_add(result, c_mul(u_coef4, c_pow(z, 4)));
  if (u_degree >= 5) result = c_add(result, c_mul(u_coef5, c_pow(z, 5)));

  return result;
}

vec2 evaluateDerivative(vec2 z) {
  vec2 result = vec2(0.0, 0.0);

  // Derivative: d/dz (c_n * z^n) = n * c_n * z^(n-1)
  if (u_degree >= 1) result = c_add(result, u_coef1);
  if (u_degree >= 2) result = c_add(result, c_mul(u_coef2, c_mul(vec2(2.0, 0.0), z)));
  if (u_degree >= 3) result = c_add(result, c_mul(u_coef3, c_mul(vec2(3.0, 0.0), c_pow(z, 2))));
  if (u_degree >= 4) result = c_add(result, c_mul(u_coef4, c_mul(vec2(4.0, 0.0), c_pow(z, 3))));
  if (u_degree >= 5) result = c_add(result, c_mul(u_coef5, c_mul(vec2(5.0, 0.0), c_pow(z, 4))));

  return result;
}

// ===== Newton's Method =====

int findNearestRoot(vec2 z) {
  float minDist = 1e10;
  int nearestRoot = -1;

  for (int i = 0; i < 5; i++) {
    if (i >= u_numRoots) break;

    vec2 root;
    if (i == 0) root = u_root0;
    else if (i == 1) root = u_root1;
    else if (i == 2) root = u_root2;
    else if (i == 3) root = u_root3;
    else if (i == 4) root = u_root4;

    float dist = c_mag(c_sub(z, root));
    if (dist < minDist) {
      minDist = dist;
      nearestRoot = i;
    }
  }

  return nearestRoot;
}

vec3 getRootColor(int rootIndex) {
  if (rootIndex == 0) return u_color0;
  if (rootIndex == 1) return u_color1;
  if (rootIndex == 2) return u_color2;
  if (rootIndex == 3) return u_color3;
  if (rootIndex == 4) return u_color4;
  return u_divergentColor;
}

void main() {
  // Map pixel to complex plane
  vec2 uv = v_texCoord;
  vec2 z = mix(u_viewportMin, u_viewportMax, uv);

  // Newton iteration
  int iterations = 0;
  bool converged = false;
  int rootIndex = -1;

  for (int i = 0; i < 1000; i++) {  // GLSL constant loop bound
    if (i >= u_maxIterations) break;

    vec2 pz = evaluatePolynomial(z);
    vec2 dpz = evaluateDerivative(z);

    // Check for convergence
    if (c_mag(pz) < u_tolerance) {
      converged = true;
      iterations = i;
      rootIndex = findNearestRoot(z);
      break;
    }

    // Newton step: z = z - P(z) / P'(z)
    vec2 delta = c_div(pz, dpz);
    z = c_sub(z, delta);

    // Check if step is too small (converged)
    if (c_mag(delta) < u_tolerance) {
      converged = true;
      iterations = i;
      rootIndex = findNearestRoot(z);
      break;
    }

    iterations = i + 1;
  }

  // Determine color
  vec3 color;

  if (!converged && u_blackForCycles) {
    // Non-convergent points are black
    color = vec3(0.0, 0.0, 0.0);
  } else if (!converged) {
    // Divergent color
    color = u_divergentColor;
  } else {
    // Root color
    color = getRootColor(rootIndex);

    // Apply saturation factor based on iteration count
    float saturation = 1.0 - (float(iterations) / float(u_maxIterations)) * u_saturationFactor;
    color = color * saturation;
  }

  gl_FragColor = vec4(color, 1.0);
}
