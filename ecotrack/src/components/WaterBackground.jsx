import { useEffect, useRef } from 'react'
import { scrollState } from '../lib/scrollState'

/*
 * Scroll-scrubbed water, rendered live on the GPU.
 *
 * Three currents flow in different directions and fold into each other. Their
 * offset is bound to scroll position, so scrolling down pushes the water
 * forward and scrolling up rewinds it — like scrubbing a video, but perfectly
 * smooth in both directions and with nothing to download.
 *
 * Extras: fast scrolling churns the surface, and the pointer leaves ripples.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2  uRes;
uniform float uTime;
uniform float uFlow;
uniform float uChurn;
uniform vec3  uAccent;
uniform float uDark;
uniform vec2  uMouse;
uniform float uMouseStr;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash2(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * gnoise(p); p = rot * p * 2.03; a *= 0.5; }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.6;

  // pointer ripples: concentric rings that fade with distance
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * 2.6;
  vec2 dm = p - m;
  float dist = length(dm);
  float ripple = sin(dist * 14.0 - uTime * 4.0) * exp(-dist * 2.2) * uMouseStr;
  p += normalize(dm + 1e-4) * ripple * 0.12;

  float t = uTime * 0.05;
  float f = uFlow;

  // three currents crossing each other
  vec2 dirA = normalize(vec2(0.55, -1.0));
  vec2 dirB = normalize(vec2(-1.0, 0.35));
  vec2 dirC = normalize(vec2(0.8, 0.7));

  vec2 pa = p        + dirA * ( f * 1.00 + t);
  vec2 pb = p * 1.30 + dirB * ( f * 1.35 - t * 0.8);
  vec2 pc = p * 0.70 + dirC * (-f * 0.60 + t * 0.4);

  float strength = 1.0 + uChurn * 1.4;
  vec2 q = vec2(fbm(pa), fbm(pa + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(pb + q * strength), fbm(pb + q * strength + vec2(1.7, 9.2)));
  float h = fbm(pc + r * 1.6);

  // caustics: thin bright lines where the warped currents fold over
  float c1 = 1.0 - abs(fbm(pa * 1.8 + r * 2.0));
  float c2 = 1.0 - abs(fbm(pb * 1.6 - q * 2.0));
  float caustic = pow(c1 * c2, 7.0);

  // mild nature greens; the accent only tints lightly so the water always reads as green
  vec3 lightDeep    = mix(vec3(0.67, 0.81, 0.62), uAccent, 0.15);
  vec3 lightShallow = vec3(0.93, 0.96, 0.89);
  vec3 darkDeep     = vec3(0.03, 0.08, 0.04);
  vec3 darkShallow  = mix(vec3(0.11, 0.25, 0.13), uAccent, 0.2);

  vec3 deep    = mix(lightDeep, darkDeep, uDark);
  vec3 shallow = mix(lightShallow, darkShallow, uDark);

  float depth = smoothstep(-0.45, 0.55, h + r.x * 0.35);
  vec3 col = mix(deep, shallow, depth);

  vec3 glint = mix(vec3(0.97, 1.0, 0.93), vec3(0.55, 0.78, 0.5), uDark);
  col += glint * caustic * mix(0.55, 0.9, uDark) * (0.85 + uChurn * 0.6);
  col += glint * exp(-dist * 3.0) * 0.07 * uMouseStr;

  float vig = smoothstep(1.25, 0.25, length((vUv - 0.5) * vec2(aspect * 0.8, 1.0)));
  col *= mix(0.86, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}`

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[water] shader error:', gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

/** Water is soft, so rendering at half resolution is invisible to the eye and 4x cheaper. */
const RENDER_SCALE = 0.5

export default function WaterBackground({ accent, dark }) {
  const canvasRef = useRef(null)
  const theme = useRef({ accent: hexToRgb(accent), dark: dark ? 1 : 0 })

  // hand fresh theme values to the running loop without rebuilding the GL context
  useEffect(() => {
    theme.current.accent = hexToRgb(accent)
  }, [accent])
  useEffect(() => {
    theme.current.dark = dark ? 1 : 0
  }, [dark])

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return // CSS gradient underneath stays visible as the fallback

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    // one oversized triangle covers the screen with fewer vertices than a quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const U = Object.fromEntries(
      ['uRes', 'uTime', 'uFlow', 'uChurn', 'uAccent', 'uDark', 'uMouse', 'uMouseStr'].map((n) => [n, gl.getUniformLocation(prog, n)]),
    )

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      canvas.width = Math.max(1, Math.floor(window.innerWidth * RENDER_SCALE))
      canvas.height = Math.max(1, Math.floor(window.innerHeight * RENDER_SCALE))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, str: 0, target: 0 }
    const onMove = (e) => {
      mouse.tx = e.clientX / window.innerWidth
      mouse.ty = 1 - e.clientY / window.innerHeight
      mouse.target = 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    let last = performance.now()
    let time = 0
    let flow = scrollState.y * 0.0011
    let darkMix = theme.current.dark
    const accentNow = [...theme.current.accent]

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!reduced) time += dt

      // ease toward the scroll target so direction reversals feel fluid, not like a jump cut
      const targetFlow = scrollState.y * 0.0011 * (reduced ? 0.3 : 1)
      flow += (targetFlow - flow) * 0.12

      const targetChurn = Math.min(Math.abs(scrollState.velocity) / 45, 1)
      scrollState.churn += (targetChurn - scrollState.churn) * 0.06

      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08
      mouse.str += ((reduced ? 0 : mouse.target) - mouse.str) * 0.05
      mouse.target *= 0.97 // ripples settle when the pointer rests

      // cross-fade theme switches inside the water too
      const th = theme.current
      darkMix += (th.dark - darkMix) * 0.06
      for (let i = 0; i < 3; i++) accentNow[i] += (th.accent[i] - accentNow[i]) * 0.06

      gl.uniform2f(U.uRes, canvas.width, canvas.height)
      gl.uniform1f(U.uTime, time)
      gl.uniform1f(U.uFlow, flow)
      gl.uniform1f(U.uChurn, scrollState.churn)
      gl.uniform3f(U.uAccent, accentNow[0], accentNow[1], accentNow[2])
      gl.uniform1f(U.uDark, darkMix)
      gl.uniform2f(U.uMouse, mouse.x, mouse.y)
      gl.uniform1f(U.uMouseStr, mouse.str)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // stop burning GPU in background tabs
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      // no loseContext() here: StrictMode remounts reuse this canvas, and a lost context can't be revived
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-leaf/40 via-cream to-moss/20" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* soft green wash keeps text legible over the brightest caustics */}
      <div className="absolute inset-0 bg-leaf/10 transition-colors duration-700" />
    </div>
  )
}
