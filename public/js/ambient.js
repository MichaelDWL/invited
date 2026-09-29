/**
 * Fundo líquido: luz âmbar se deslocando sob uma superfície escura.
 * Renderizado em baixa resolução (a ampliação do navegador gera o desfoque natural),
 * limitado a 30 fps e pausado quando a aba fica oculta.
 */

const RENDER_SCALE = 0.3;
const MAX_SIDE = 560;
const FRAME_INTERVAL = 1000 / 30;
const STATIC_TIME = 42;

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rotation * p;
    amplitude *= 0.5;
  }
  return value;
}

float glow(vec2 p, vec2 center, float radius) {
  vec2 d = p - center;
  return exp(-dot(d, d) / (radius * radius));
}

void main() {
  float minSide = min(uResolution.x, uResolution.y);
  vec2 aspect = uResolution / minSide;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / minSide;
  float t = uTime * 0.035;

  // Distorção de domínio: cria o aspecto de líquido.
  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p * 1.1 + 1.8 * q + vec2(1.7, 9.2) + 0.7 * t),
    fbm(p * 1.1 + 1.8 * q + vec2(8.3, 2.8) - 0.5 * t)
  );
  float surface = fbm(p * 1.2 + 2.0 * r);
  vec2 warped = p + (r - 0.5) * 0.4;

  // Fontes de luz em coordenadas relativas à tela (0..1), com leve paralaxe na rolagem.
  float drift = uScroll * 0.35;
  vec2 light1 = (vec2(0.18 + 0.06 * sin(t * 1.3), 0.86 + 0.04 * cos(t * 1.1) + drift) - 0.5) * aspect;
  vec2 light2 = (vec2(0.88 + 0.05 * cos(t * 0.9), 0.52 + 0.08 * sin(t * 0.7) + drift * 0.6) - 0.5) * aspect;
  vec2 light3 = (vec2(0.40 + 0.08 * sin(t * 0.6), 0.08 + 0.05 * cos(t * 0.8) + drift * 0.3) - 0.5) * aspect;

  float light = glow(warped, light1, 0.62) * 0.95
              + glow(warped, light2, 0.48) * 0.7
              + glow(warped, light3, 0.66) * 0.55;

  float sheen = smoothstep(0.45, 0.9, surface);
  // Cristas finas onde a superfície "dobra" — reflexos de luz no líquido.
  float ridge = pow(1.0 - clamp(abs(surface - 0.6) * 5.0, 0.0, 1.0), 4.0);

  vec3 amber = vec3(0.62, 0.38, 0.16);
  vec3 champagne = vec3(0.95, 0.80, 0.56);

  vec3 color = vec3(0.02, 0.016, 0.013);
  color = mix(color, vec3(0.056, 0.044, 0.034), smoothstep(0.25, 0.8, surface));
  color += amber * light * (0.2 + 0.85 * sheen);
  color += champagne * light * pow(sheen, 2.5) * 0.5;
  color += champagne * ridge * light * 0.22;

  float vignette = smoothstep(1.5, 0.25, length(p * vec2(0.85, 0.7)));
  color *= 0.5 + 0.5 * vignette;

  gl_FragColor = vec4(color, 1.0);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function setupGeometry(gl, program) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
}

export function initAmbient(canvas) {
  const gl = canvas?.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return;

  const program = createProgram(gl);
  if (!program) return;

  gl.useProgram(program);
  setupGeometry(gl, program);

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    time: gl.getUniformLocation(program, 'uTime'),
    scroll: gl.getUniformLocation(program, 'uScroll'),
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const startedAt = performance.now();
  let frameId = 0;
  let lastFrame = 0;
  let scroll = 0;
  let viewportWidth = 0;

  function resize() {
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, document.documentElement.clientHeight);
    viewportWidth = width;

    const scale = Math.min(RENDER_SCALE, MAX_SIDE / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
  }

  function draw(seconds) {
    gl.uniform1f(uniforms.time, seconds);
    gl.uniform1f(uniforms.scroll, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    frameId = requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_INTERVAL) return;
    lastFrame = now;
    draw(STATIC_TIME + (now - startedAt) / 1000);
  }

  function play() {
    if (frameId || reducedMotion.matches || document.hidden) return;
    frameId = requestAnimationFrame(loop);
  }

  function pause() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scroll = max > 0 ? window.scrollY / max : 0;
  }

  function handleResize() {
    // Ignora a barra de endereço do celular aparecendo/sumindo (só a altura muda).
    if (window.innerWidth === viewportWidth) return;
    resize();
    if (!frameId) draw(STATIC_TIME);
  }

  resize();
  draw(STATIC_TIME);
  canvas.classList.add('is-ready');
  play();

  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  reducedMotion.addEventListener('change', () => (reducedMotion.matches ? pause() : play()));
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    pause();
    canvas.classList.remove('is-ready');
  });
}
