export const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_motion;
uniform float u_density;
uniform float u_contrast;

out vec4 out_color;

float hash21(vec2 point) {
  point = fract(point * vec2(123.34, 456.21));
  point += dot(point, point + 45.32);
  return fract(point.x * point.y);
}

float valueNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);
  float a = hash21(cell);
  float b = hash21(cell + vec2(1.0, 0.0));
  float c = hash21(cell + vec2(0.0, 1.0));
  float d = hash21(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 4; octave += 1) {
    value += amplitude * valueNoise(point);
    point = point * 2.0 + vec2(17.0, 11.0);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / resolution;
  float aspect = resolution.x / resolution.y;
  vec2 point = (uv - 0.5) * vec2(aspect, 1.0);
  float time = u_time * u_motion;
  vec2 drift = vec2(time * 3.0, -time * 2.0);

  float broad = fbm(point * 1.05 + drift);
  vec2 warp = vec2(
    fbm(point * 1.08 + drift * 0.72),
    fbm(point * 1.12 - drift * 0.56)
  );
  float detail = fbm((point + (warp - 0.5) * 0.34) * 1.55 - drift * 0.42);
  float field = clamp(broad * 0.68 + detail * 0.32, 0.0, 1.0);
  float quantizedField = floor(field * 6.0 + 0.5) / 6.0;
  float paletteField = mix(field, quantizedField, 0.52);

  vec3 base = vec3(0.063, 0.173, 0.286);
  vec3 middle = vec3(0.145, 0.341, 0.475);
  vec3 light = vec3(0.475, 0.616, 0.690);
  vec3 color = mix(base, middle, smoothstep(0.24, 0.62, paletteField));
  color = mix(color, light, smoothstep(0.56, 0.84, paletteField) * u_contrast * 0.72);

  vec2 cell = fract(gl_FragCoord.xy / 4.0) - 0.5;
  float dot = step(length(cell), 0.17 + field * 0.13);
  float halftone = dot * smoothstep(0.42, 0.78, field) * u_density;
  color = mix(color, light, halftone);

  float vignette = smoothstep(1.32, 0.30, length(point * vec2(0.70, 0.86)));
  color *= mix(0.86, 1.0, vignette);
  out_color = vec4(color, 1.0);
}
`;
