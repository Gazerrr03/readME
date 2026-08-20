export const FULLSCREEN_VERTEX_SHADER = /* glsl */`
varying vec2 vUv;

void main() {
  vUv = (position.xy * 0.5) + 0.5;
  gl_Position = vec4(position, 1.0);
}
`;

export const SIMULATION_FRAGMENT_SHADER = /* glsl */`
uniform sampler2D uState;
uniform sampler2D uOrigin;
uniform float uDelta;
uniform float uTime;
uniform float uTimeScale;
uniform float uNoiseScale;
uniform float uCurlStrength;
uniform float uLifeSeconds;
uniform float uSpawnRadius;
uniform float uInitialize;

varying vec2 vUv;

vec4 permute(vec4 value) {
  return mod(((value * 34.0) + 1.0) * value, 289.0);
}

vec4 taylorInvSqrt(vec4 value) {
  return 1.79284291400159 - (0.85373472095314 * value);
}

float simplexNoise(vec3 point) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 cell = floor(point + dot(point, C.yyy));
  vec3 x0 = point - cell + dot(cell, C.xxx);
  vec3 stepA = step(x0.yzx, x0.xyz);
  vec3 stepB = 1.0 - stepA;
  vec3 i1 = min(stepA.xyz, stepB.zxy);
  vec3 i2 = max(stepA.xyz, stepB.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  cell = mod(cell, 289.0);
  vec4 p = permute(permute(permute(
    cell.z + vec4(0.0, i1.z, i2.z, 1.0)
  ) + cell.y + vec4(0.0, i1.y, i2.y, 1.0))
    + cell.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n = 1.0 / 7.0;
  vec3 ns = n * D.wyz - D.xzx;
  vec4 j = p - (49.0 * floor(p * ns.z * ns.z));
  vec4 x = floor(j * ns.z);
  vec4 y = floor(j - (7.0 * x));
  vec4 xGradient = (x * ns.x) + ns.yyyy;
  vec4 yGradient = (y * ns.x) + ns.yyyy;
  vec4 h = 1.0 - abs(xGradient) - abs(yGradient);
  vec4 b0 = vec4(xGradient.xy, yGradient.xy);
  vec4 b1 = vec4(xGradient.zw, yGradient.zw);
  vec4 s0 = (floor(b0) * 2.0) + 1.0;
  vec4 s1 = (floor(b1) * 2.0) + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + (s0.xzyw * sh.xxyy);
  vec4 a1 = b1.xzyw + (s1.xzyw * sh.zzww);
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(
    dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)
  ));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 attenuation = max(0.6 - vec4(
    dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)
  ), 0.0);
  attenuation *= attenuation;
  return 42.0 * dot(attenuation * attenuation, vec4(
    dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)
  ));
}

vec3 noiseVector(vec3 point) {
  return vec3(
    simplexNoise(point),
    simplexNoise(point + vec3(19.1, 7.3, 3.7)),
    simplexNoise(point + vec3(5.7, 23.4, 11.8))
  );
}

vec3 curlNoise(vec3 point) {
  const float epsilon = 0.08;
  vec3 dx = vec3(epsilon, 0.0, 0.0);
  vec3 dy = vec3(0.0, epsilon, 0.0);
  vec3 dz = vec3(0.0, 0.0, epsilon);
  vec3 px0 = noiseVector(point - dx);
  vec3 px1 = noiseVector(point + dx);
  vec3 py0 = noiseVector(point - dy);
  vec3 py1 = noiseVector(point + dy);
  vec3 pz0 = noiseVector(point - dz);
  vec3 pz1 = noiseVector(point + dz);
  float divisor = 1.0 / (2.0 * epsilon);
  return vec3(
    ((py1.z - py0.z) - (pz1.y - pz0.y)) * divisor,
    ((pz1.x - pz0.x) - (px1.z - px0.z)) * divisor,
    ((px1.y - px0.y) - (py1.x - py0.x)) * divisor
  );
}

void main() {
  vec4 origin = texture2D(uOrigin, vUv);
  vec4 state = texture2D(uState, vUv);
  float life = state.a + (uDelta / max(uLifeSeconds, 0.001));
  bool respawn = life >= 1.0 || uInitialize > 0.5;
  vec3 position = state.rgb;

  if (respawn) {
    life = fract(life);
    position = origin.rgb * uSpawnRadius;
  } else if (uDelta > 0.0) {
    vec3 samplePoint = (position * uNoiseScale)
      + vec3(0.0, uTime * 0.07 * uTimeScale, uTime * 0.035 * uTimeScale);
    vec3 curl = curlNoise(samplePoint);
    float curlLength = max(length(curl), 0.00001);
    vec3 flow = curl / curlLength;
    vec3 returnForce = -position * (0.012 + (0.018 / max(uSpawnRadius, 0.1)));
    position += ((flow * uCurlStrength) + returnForce)
      * uDelta * uTimeScale;
  }

  gl_FragColor = vec4(position, life);
}
`;

export const FLOW_DEFORMATION_CHUNK = /* glsl */`
attribute vec2 aStateUv;
attribute float aRandom;
uniform sampler2D uCurrentState;
uniform sampler2D uPreviousState;
uniform float uBaseSize;
uniform float uStretch;

void flowBasis(out mat3 basis, out vec3 center, out vec3 scale) {
  vec4 currentState = texture2D(uCurrentState, aStateUv);
  vec3 previous = texture2D(uPreviousState, aStateUv).rgb;
  vec3 velocity = currentState.rgb - previous;
  float speed = length(velocity);
  vec3 forward = speed < 0.00001 ? vec3(0.0, 1.0, 0.0) : velocity / speed;
  vec3 stableUp = abs(dot(forward, vec3(0.0, 1.0, 0.0))) > 0.96
    ? vec3(1.0, 0.0, 0.0)
    : vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(stableUp, forward));
  vec3 up = normalize(cross(forward, right));
  basis = mat3(right, forward, up);
  center = currentState.rgb;

  float birth = smoothstep(0.0, 0.08, currentState.a);
  float fade = 1.0 - smoothstep(0.82, 1.0, currentState.a);
  float lifeEase = max(0.08, birth * fade);
  float randomScale = mix(0.72, 1.28, aRandom);
  float axialStretch = 1.0 + min(speed * 48.0 * uStretch, 4.5);
  scale = vec3(
    uBaseSize * randomScale * lifeEase,
    uBaseSize * axialStretch * lifeEase,
    uBaseSize * randomScale * lifeEase
  );
}

vec3 flowDeformPosition(vec3 localPosition) {
  mat3 basis;
  vec3 center;
  vec3 scale;
  flowBasis(basis, center, scale);
  return center + (basis * (localPosition * scale));
}

vec3 flowDeformNormal(vec3 localNormal) {
  mat3 basis;
  vec3 center;
  vec3 scale;
  flowBasis(basis, center, scale);
  return normalize(basis * localNormal);
}
`;

export const FLOW_POSITION_TRANSFORM = /* glsl */`
vec3 transformed = flowDeformPosition(position);
#ifdef USE_ALPHAHASH
  vPosition = transformed;
#endif
`;

export const BLOOM_THRESHOLD_FRAGMENT_SHADER = /* glsl */`
uniform sampler2D uTexture;
uniform float uThreshold;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(uTexture, vUv).rgb;
  float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float contribution = smoothstep(uThreshold, uThreshold + 0.24, brightness);
  gl_FragColor = vec4(color * contribution, 1.0);
}
`;

export const BLOOM_COPY_FRAGMENT_SHADER = /* glsl */`
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(uTexture, vUv);
}
`;

export const BLOOM_BLUR_FRAGMENT_SHADER = /* glsl */`
uniform sampler2D uTexture;
uniform vec2 uTexelSize;
uniform vec2 uDirection;
varying vec2 vUv;

void main() {
  vec2 offset = uTexelSize * uDirection;
  vec3 color = texture2D(uTexture, vUv).rgb * 0.227027;
  color += texture2D(uTexture, vUv + (offset * 1.384615)).rgb * 0.316216;
  color += texture2D(uTexture, vUv - (offset * 1.384615)).rgb * 0.316216;
  color += texture2D(uTexture, vUv + (offset * 3.230769)).rgb * 0.070270;
  color += texture2D(uTexture, vUv - (offset * 3.230769)).rgb * 0.070270;
  gl_FragColor = vec4(color, 1.0);
}
`;

export const BLOOM_COMPOSITE_FRAGMENT_SHADER = /* glsl */`
uniform sampler2D uScene;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec3 sceneColor = texture2D(uScene, vUv).rgb;
  vec3 bloom = (texture2D(uBloom0, vUv).rgb * 0.52)
    + (texture2D(uBloom1, vUv).rgb * 0.31)
    + (texture2D(uBloom2, vUv).rgb * 0.17);
  gl_FragColor = vec4(sceneColor + (bloom * uStrength), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
