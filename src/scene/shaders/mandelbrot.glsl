/**
 * Mandelbrot Set Fragment Shader
 *
 * Implements Mandelbrot iteration:
 * z_{n+1} = z_n^p + c
 *
 * where c is the pixel coordinate and z_0 = 0
 *
 * Colors based on escape time (iteration count)
 */

precision highp float;

varying vec2 v_texCoord;

// Uniforms: Viewport transformation
uniform vec2 u_viewportMin;
uniform vec2 u_viewportMax;
uniform vec2 u_resolution;

// Uniforms: Mandelbrot parameters
uniform int u_power;              // Power (2 for classic Mandelbrot)
uniform int u_maxIterations;
uniform float u_escapeRadius;

// Uniforms: Coloring
uniform int u_numColorStops;      // Number of colors in scale
uniform vec3 u_colorStop0;
uniform vec3 u_colorStop1;
uniform vec3 u_colorStop2;
uniform vec3 u_colorStop3;
uniform vec3 u_colorStop4;
uniform vec3 u_colorStop5;
uniform vec3 u_colorStop6;
uniform vec3 u_colorStop7;
uniform vec3 u_colorStop8;
uniform vec3 u_insideColor;       // Color for points inside set
uniform int u_smoothingMode;      // 0=none, 1=linear, 2=log, 3=sqrt

// ===== Complex Arithmetic =====

vec2 c_mul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 c_add(vec2 a, vec2 b) {
  return vec2(a.x + b.x, a.y + b.y);
}

float c_mag(vec2 z) {
  return sqrt(z.x * z.x + z.y * z.y);
}

float c_mag_sq(vec2 z) {
  return z.x * z.x + z.y * z.y;
}

vec2 c_pow(vec2 z, int n) {
  if (n == 1) return z;
  if (n == 2) return c_mul(z, z);

  vec2 result = z;
  for (int i = 1; i < 10; i++) {
    if (i >= n) break;
    result = c_mul(result, z);
  }
  return result;
}

// ===== Color Interpolation =====

vec3 getColorStop(int index) {
  if (index == 0) return u_colorStop0;
  if (index == 1) return u_colorStop1;
  if (index == 2) return u_colorStop2;
  if (index == 3) return u_colorStop3;
  if (index == 4) return u_colorStop4;
  if (index == 5) return u_colorStop5;
  if (index == 6) return u_colorStop6;
  if (index == 7) return u_colorStop7;
  if (index == 8) return u_colorStop8;
  return vec3(1.0, 1.0, 1.0);
}

vec3 interpolateColor(float t) {
  // t is in [0, 1] range
  if (u_numColorStops == 1) return getColorStop(0);

  // Map t to color stop index
  float scaledT = t * float(u_numColorStops - 1);
  int lowerIndex = int(floor(scaledT));
  int upperIndex = min(lowerIndex + 1, u_numColorStops - 1);
  float localT = fract(scaledT);

  vec3 lowerColor = getColorStop(lowerIndex);
  vec3 upperColor = getColorStop(upperIndex);

  return mix(lowerColor, upperColor, localT);
}

// ===== Mandelbrot Iteration =====

void main() {
  // Map pixel to complex plane
  vec2 uv = v_texCoord;
  vec2 c = mix(u_viewportMin, u_viewportMax, uv);

  // Mandelbrot iteration: z_{n+1} = z_n^p + c, z_0 = 0
  vec2 z = vec2(0.0, 0.0);
  float escapeRadiusSq = u_escapeRadius * u_escapeRadius;
  int iterations = 0;
  float smoothValue = 0.0;

  for (int i = 0; i < 1000; i++) {
    if (i >= u_maxIterations) break;

    // z = z^power + c
    z = c_add(c_pow(z, u_power), c);

    float mag_sq = c_mag_sq(z);

    // Check escape
    if (mag_sq > escapeRadiusSq) {
      iterations = i;

      // Smooth coloring (continuous escape time)
      if (u_smoothingMode == 2) {
        // Log smoothing
        smoothValue = float(i) + 1.0 - log(log(sqrt(mag_sq))) / log(float(u_power));
      } else if (u_smoothingMode == 3) {
        // Sqrt smoothing
        smoothValue = float(i) + 1.0 - sqrt(sqrt(mag_sq) / u_escapeRadius);
      } else {
        // Linear or no smoothing
        smoothValue = float(i);
      }

      break;
    }

    iterations = i + 1;
  }

  // Determine color
  vec3 color;

  if (iterations >= u_maxIterations) {
    // Inside the set
    color = u_insideColor;
  } else {
    // Outside the set - use escape time coloring
    float t;

    if (u_smoothingMode >= 1) {
      // Normalized smooth value
      t = smoothValue / float(u_maxIterations);
    } else {
      // Non-smooth
      t = float(iterations) / float(u_maxIterations);
    }

    t = clamp(t, 0.0, 1.0);
    color = interpolateColor(t);
  }

  gl_FragColor = vec4(color, 1.0);
}
