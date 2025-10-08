/**
 * Fractal Vertex Shader
 *
 * Simple pass-through for full-screen quad rendering
 */

attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass position to fragment shader as texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;

  // Position for full-screen quad
  gl_Position = vec4(a_position, 0.0, 1.0);
}
