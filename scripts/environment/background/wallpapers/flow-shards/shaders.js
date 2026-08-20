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

vec4 mod289(vec4 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

float mod289(float value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 value) {
  return mod289(((value * 34.0) + 1.0) * value);
}

float permute(float value) {
  return mod289(((value * 34.0) + 1.0) * value);
}

vec4 taylorInvSqrt(vec4 value) {
  return 1.79284291400159 - (0.85373472095314 * value);
}

float taylorInvSqrt(float value) {
  return 1.79284291400159 - (0.85373472095314 * value);
}

vec4 grad4(float value, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 gradient;
  gradient.xyz = floor(fract(vec3(value) * ip.xyz) * 7.0) * ip.z - 1.0;
  gradient.w = 1.5 - dot(abs(gradient.xyz), ones.xyz);
  vec4 signs = vec4(lessThan(gradient, vec4(0.0)));
  gradient.xyz += (signs.xyz * 2.0 - 1.0) * signs.www;
  return gradient;
}

vec4 simplexNoiseDerivatives(vec4 value) {
  const float F4 = 0.309016994374947451;
  const vec4 C = vec4(
    0.138196601125011,
    0.276393202250021,
    0.414589803375032,
    -0.447213595499958
  );
  vec4 cell = floor(value + dot(value, vec4(F4)));
  vec4 x0 = value - cell + dot(cell, C.xxxx);

  vec4 rank;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  rank.x = isX.x + isX.y + isX.z;
  rank.yzw = 1.0 - isX;
  rank.y += isYZ.x + isYZ.y;
  rank.zw += 1.0 - isYZ.xy;
  rank.z += isYZ.z;
  rank.w += 1.0 - isYZ.z;

  vec4 i3 = clamp(rank, 0.0, 1.0);
  vec4 i2 = clamp(rank - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(rank - 2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

  cell = mod289(cell);
  float j0 = permute(permute(permute(permute(cell.w) + cell.z) + cell.y) + cell.x);
  vec4 j1 = permute(permute(permute(permute(
    cell.w + vec4(i1.w, i2.w, i3.w, 1.0)
  ) + cell.z + vec4(i1.z, i2.z, i3.z, 1.0))
    + cell.y + vec4(i1.y, i2.y, i3.y, 1.0))
    + cell.x + vec4(i1.x, i2.x, i3.x, 1.0));

  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(
    dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)
  ));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));

  vec3 values0 = vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2));
  vec2 values1 = vec2(dot(p3, x3), dot(p4, x4));
  vec3 m0 = max(0.5 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.5 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  vec3 temp0 = -6.0 * m0 * m0 * values0;
  vec2 temp1 = -6.0 * m1 * m1 * values1;
  vec3 cubic0 = m0 * m0 * m0;
  vec2 cubic1 = m1 * m1 * m1;

  float dx = temp0[0] * x0.x + temp0[1] * x1.x + temp0[2] * x2.x
    + temp1[0] * x3.x + temp1[1] * x4.x
    + cubic0[0] * p0.x + cubic0[1] * p1.x + cubic0[2] * p2.x
    + cubic1[0] * p3.x + cubic1[1] * p4.x;
  float dy = temp0[0] * x0.y + temp0[1] * x1.y + temp0[2] * x2.y
    + temp1[0] * x3.y + temp1[1] * x4.y
    + cubic0[0] * p0.y + cubic0[1] * p1.y + cubic0[2] * p2.y
    + cubic1[0] * p3.y + cubic1[1] * p4.y;
  float dz = temp0[0] * x0.z + temp0[1] * x1.z + temp0[2] * x2.z
    + temp1[0] * x3.z + temp1[1] * x4.z
    + cubic0[0] * p0.z + cubic0[1] * p1.z + cubic0[2] * p2.z
    + cubic1[0] * p3.z + cubic1[1] * p4.z;
  float dw = temp0[0] * x0.w + temp0[1] * x1.w + temp0[2] * x2.w
    + temp1[0] * x3.w + temp1[1] * x4.w
    + cubic0[0] * p0.w + cubic0[1] * p1.w + cubic0[2] * p2.w
    + cubic1[0] * p3.w + cubic1[1] * p4.w;
  return vec4(dx, dy, dz, dw) * 49.0;
}

void main() {
  vec4 origin = texture2D(uOrigin, vUv);
  vec4 state = texture2D(uState, vUv);
  if (uInitialize > 0.5) {
    gl_FragColor = vec4(origin.rgb * uSpawnRadius, origin.a);
    return;
  }

  float frameScale = uDelta * 60.0;
  if (frameScale <= 0.0) {
    gl_FragColor = state;
    return;
  }

  vec3 position = state.rgb;
  float life = state.a - (uDelta / max(uLifeSeconds, 0.001));
  if (life < 0.0) {
    position = origin.rgb * uSpawnRadius;
    life += 1.0;
  }

  float flowTime = -uTime * 0.192 * uTimeScale;
  vec3 samplePosition = position * uNoiseScale;
  vec4 xDerivatives = simplexNoiseDerivatives(vec4(samplePosition, flowTime * 2.0));
  vec4 yDerivatives = simplexNoiseDerivatives(vec4(
    samplePosition + vec3(123.4, 129845.6, -1239.1),
    flowTime * 2.0
  ));
  vec4 zDerivatives = simplexNoiseDerivatives(vec4(
    samplePosition + vec3(-9519.0, 9051.0, -123.0),
    flowTime * 2.0
  ));
  vec3 curl = vec3(
    zDerivatives.y - yDerivatives.z,
    xDerivatives.z - zDerivatives.x,
    yDerivatives.x - xDerivatives.y
  );
  float expansion = pow(1.001, frameScale * uTimeScale);
  float curlStep = (0.0013 + abs(sin(flowTime * 2.0)) * 0.003)
    * frameScale * uTimeScale * uCurlStrength;
  position = (position * expansion) + (curl * curlStep);

  gl_FragColor = vec4(position, life);
}
`;

export const FLOW_DEFORMATION_CHUNK = /* glsl */`
attribute vec2 aStateUv;
attribute float aRandom;
attribute vec3 aDecals;
attribute float aOcclusion;
attribute float aOcclusionColor;
uniform sampler2D uCurrentState;
uniform sampler2D uPreviousState;
uniform float uBaseSize;
uniform float uStretch;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
varying vec3 vFlowColor;
varying float vFlowOcclusion;
varying float vFlowOcclusionColor;

vec3 flowHueShift(vec3 color, float amount) {
  const vec3 rgbToY = vec3(0.299, 0.587, 0.114);
  const vec3 rgbToI = vec3(0.596, -0.275, -0.321);
  const vec3 rgbToQ = vec3(0.212, -0.523, 0.311);
  const vec3 yiqToR = vec3(1.0, 0.956, 0.621);
  const vec3 yiqToG = vec3(1.0, -0.272, -0.647);
  const vec3 yiqToB = vec3(1.0, -1.107, 1.704);
  float y = dot(color, rgbToY);
  float i = dot(color, rgbToI);
  float q = dot(color, rgbToQ);
  float hue = atan(q, i) + amount;
  float chroma = sqrt((i * i) + (q * q));
  vec3 yiq = vec3(y, chroma * cos(hue), chroma * sin(hue));
  return vec3(dot(yiq, yiqToR), dot(yiq, yiqToG), dot(yiq, yiqToB));
}

void flowBasis(out mat3 basis, out vec3 center, out vec3 scale) {
  vec4 currentState = texture2D(uCurrentState, aStateUv);
  vec3 previous = texture2D(uPreviousState, aStateUv).rgb;
  vec3 velocity = currentState.rgb - previous;
  float speed = length(velocity);
  vec3 forward = speed < 0.00001 ? vec3(0.0, 0.0, 1.0) : -velocity / speed;
  vec3 stableUp = abs(dot(forward, vec3(0.0, 1.0, 0.0))) > 0.96
    ? vec3(1.0, 0.0, 0.0)
    : vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(stableUp, forward));
  vec3 up = normalize(cross(forward, right));
  basis = mat3(right, up, forward);
  center = previous * 100.0;

  float scaleX = 1.0 - abs(aDecals.z * 3.0);
  float scaleY = 0.5 - abs(aDecals.y * 2.0);
  float scaleZ = 2.0 + (300.0 * min(speed, 0.03) * uStretch);
  float lifeScale = max(0.0, sin(currentState.a / 0.32));
  float decalScale = abs(aDecals.z) * 35.0;
  scale = vec3(scaleX, scaleY, scaleZ)
    * uBaseSize * decalScale * lifeScale;

  vec3 lifeColor = mix(uPrimaryColor, uSecondaryColor, currentState.a + 0.2);
  lifeColor += vec3(aDecals.x);
  vFlowColor = flowHueShift(lifeColor, aDecals.x * 10.0);
  vFlowOcclusion = aOcclusion;
  vFlowOcclusionColor = aOcclusionColor;
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
  float brightness = dot(color, vec3(0.299, 0.587, 0.114));
  float threshold = uThreshold * 0.6;
  float contribution = smoothstep(threshold, threshold + 0.01, brightness);
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
uniform sampler2D uBloom3;
uniform sampler2D uBloom4;
uniform float uStrength;
uniform float uDevicePixelRatio;
varying vec2 vUv;

void main() {
  vec3 sceneColor = texture2D(uScene, vUv).rgb;
  vec3 bloom = (texture2D(uBloom0, vUv).rgb * 0.2)
    + (texture2D(uBloom1, vUv).rgb * 0.4)
    + (texture2D(uBloom2, vUv).rgb * 0.6)
    + (texture2D(uBloom3, vUv).rgb * 0.8)
    + texture2D(uBloom4, vUv).rgb;
  vec3 combined = min(sceneColor + (bloom * uStrength), vec3(1.0));
  float grainSeed = mod(dot(vUv, vec2(12.9898, 78.233)), 3.14);
  float grain = fract(sin(grainSeed) * 43758.5453) * 0.04 * uDevicePixelRatio;
  gl_FragColor = vec4(combined, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb = min(gl_FragColor.rgb + grain, vec3(1.0));
}
`;
