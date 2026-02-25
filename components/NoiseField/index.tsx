'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette, Scanline, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import styles from './styles.module.css';

const WORDS = ['SCAN', 'CHECK', 'TRUST', 'TABULAS'];
const WORD_DURATION = 2500;

// Per-word visual styles
const WORD_STYLES = {
  SCAN: {
    colors: ['#00ff00', '#00dd00', '#00bb00', '#33ff33', '#88ff88'],
    scanlines: 2.0,
    chromatic: 0.003,
    bloom: 0.25,
    greenTint: 0.4,
  },
  CHECK: {
    colors: ['#ff3366', '#ff6699', '#ff0044', '#ff4477', '#ffaacc'],
    scanlines: 0.8,
    chromatic: 0.002,
    bloom: 0.35,
    greenTint: 0.0,
  },
  TRUST: {
    colors: ['#4ecdc4', '#45b7aa', '#26a69a', '#80deea', '#b2ebf2'],
    scanlines: 0.3,
    chromatic: 0.001,
    bloom: 0.4,
    greenTint: 0.0,
  },
  TABULAS: {
    colors: ['#d580ff', '#e0a0ff', '#c966ff', '#f0c0ff', '#ffffff'],
    scanlines: 1.2,
    chromatic: 0.002,
    bloom: 0.5,
    greenTint: 0.0,
  },
};

// Creative presets
const PRESETS = {
  'Clean': {
    particleSize: 2.0,
    focusRange: 4.0,
    noiseAmount: 0.1,
    sharpness: 0.7,
    density: 1.0,
  },
  'Tight Focus': {
    particleSize: 2.5,
    focusRange: 1.5,
    noiseAmount: 0.05,
    sharpness: 1.0,
    density: 1.0,
  },
  'Dreamy': {
    particleSize: 3.0,
    focusRange: 6.0,
    noiseAmount: 0.2,
    sharpness: 0.3,
    density: 0.8,
  },
  'Pixel': {
    particleSize: 1.5,
    focusRange: 10.0,
    noiseAmount: 0.02,
    sharpness: 1.0,
    density: 1.5,
  },
  'Scatter': {
    particleSize: 1.8,
    focusRange: 3.0,
    noiseAmount: 0.4,
    sharpness: 0.5,
    density: 0.6,
  },
  'Bold': {
    particleSize: 4.0,
    focusRange: 5.0,
    noiseAmount: 0.08,
    sharpness: 0.9,
    density: 0.7,
  },
};

type PresetKey = keyof typeof PRESETS;

interface Settings {
  particleSize: number;
  focusRange: number;
  noiseAmount: number;
  sharpness: number;
  density: number;
}

// Sample points from text
function getTextPoints(text: string, numPoints: number): THREE.Vector3[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 800;
  canvas.height = 200;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 100px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const whitePixels: { x: number; y: number }[] = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (pixels[i] > 128) whitePixels.push({ x, y });
    }
  }

  const points: THREE.Vector3[] = [];
  const scale = 0.025;
  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;

  for (let i = 0; i < numPoints; i++) {
    if (whitePixels.length > 0) {
      const pixel = whitePixels[Math.floor(Math.random() * whitePixels.length)];
      points.push(new THREE.Vector3(
        (pixel.x - offsetX) * scale,
        -(pixel.y - offsetY) * scale,
        (Math.random() - 0.5) * 0.5
      ));
    }
  }
  return points;
}

// Noise GLSL
const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const vertexShader = `
  ${noiseGLSL}
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uFocusDistance;
  uniform float uFocusRange;
  uniform float uParticleSize;
  uniform float uNoiseAmount;
  attribute vec3 aTargetPosition;
  attribute float aRandom;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vFocus;

  void main() {
    vec3 pos = mix(position, aTargetPosition, uMorphProgress);
    float noise = snoise(pos * 0.5 + uTime * 0.1) * uNoiseAmount;
    pos += vec3(noise, noise * 0.5, noise * 0.3);
    pos.y += sin(uTime * 0.4 + aRandom * 6.28) * 0.04;
    pos.x += cos(uTime * 0.25 + aRandom * 6.28) * 0.02;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float depth = -mvPosition.z;
    float focusDist = abs(depth - uFocusDistance);
    vFocus = 1.0 - smoothstep(0.0, uFocusRange, focusDist);

    float size = uParticleSize + aRandom * 1.0;
    size *= mix(0.4, 1.3, vFocus);
    gl_PointSize = size * (180.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
  }
`;

const createFragmentShader = (greenTint: number, sharpness: number) => `
  varying vec3 vColor;
  varying float vFocus;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    float sharp = ${sharpness.toFixed(2)};
    float softEdge = exp(-dist * dist * 6.0);
    float hardEdge = 1.0 - smoothstep(0.15, 0.2 + (1.0 - sharp) * 0.3, dist);
    float alpha = mix(softEdge * 0.4, hardEdge, vFocus * sharp);
    alpha *= mix(0.3, 1.0, vFocus);

    vec3 color = vColor * mix(0.5, 1.0, vFocus);

    float greenMix = ${greenTint.toFixed(2)};
    if (greenMix > 0.0) {
      float lum = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(color, vec3(0.0, lum * 1.3, 0.0), greenMix);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

function TextParticles({ wordIndex, morphProgress, settings }: {
  wordIndex: number;
  morphProgress: number;
  settings: Settings;
}) {
  const meshRef = useRef<THREE.Points>(null);
  const [wordPositions, setWordPositions] = useState<THREE.Vector3[][]>([]);
  const baseParticleCount = 2500;
  const particleCount = Math.floor(baseParticleCount * settings.density);

  const currentWord = WORDS[wordIndex] as keyof typeof WORD_STYLES;
  const wordStyle = WORD_STYLES[currentWord];

  useEffect(() => {
    const positions = WORDS.map(word => getTextPoints(word, particleCount));
    setWordPositions(positions);
  }, [particleCount]);

  const { geometry, material } = useMemo(() => {
    if (wordPositions.length === 0) return { geometry: null, material: null };

    const currentPositions = wordPositions[wordIndex] || wordPositions[0];
    const nextIndex = (wordIndex + 1) % WORDS.length;
    const targetPositions = wordPositions[nextIndex] || wordPositions[0];

    const positions = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount);

    const palette = wordStyle.colors.map(c => new THREE.Color(c));

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      if (currentPositions[i]) {
        positions[i3] = currentPositions[i].x;
        positions[i3 + 1] = currentPositions[i].y;
        positions[i3 + 2] = currentPositions[i].z;
      }
      if (targetPositions[i]) {
        targets[i3] = targetPositions[i].x;
        targets[i3 + 1] = targetPositions[i].y;
        targets[i3 + 2] = targetPositions[i].z;
      }
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      randoms[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targets, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: createFragmentShader(wordStyle.greenTint, settings.sharpness),
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uFocusDistance: { value: 8.0 },
        uFocusRange: { value: settings.focusRange },
        uParticleSize: { value: settings.particleSize },
        uNoiseAmount: { value: settings.noiseAmount },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    return { geometry: geo, material: mat };
  }, [wordPositions, wordIndex, wordStyle, settings, particleCount]);

  useFrame((state) => {
    if (!meshRef.current?.material) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = morphProgress;
    mat.uniforms.uFocusDistance.value = 8.0 + Math.sin(state.clock.elapsedTime * 0.25) * 1.5;
  });

  if (!geometry || !material) return null;
  return <points ref={meshRef} geometry={geometry} material={material} />;
}

function Scene({ wordIndex, morphProgress, settings }: {
  wordIndex: number;
  morphProgress: number;
  settings: Settings;
}) {
  const currentWord = WORDS[wordIndex] as keyof typeof WORD_STYLES;
  const wordStyle = WORD_STYLES[currentWord];

  return (
    <>
      <color attach="background" args={['#050508']} />
      <TextParticles wordIndex={wordIndex} morphProgress={morphProgress} settings={settings} />
      <EffectComposer>
        <Bloom intensity={wordStyle.bloom} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
        {wordStyle.chromatic > 0 && (
          <ChromaticAberration offset={new THREE.Vector2(wordStyle.chromatic, wordStyle.chromatic)} radialModulation={false} modulationOffset={0} />
        )}
        {wordStyle.scanlines > 0 && (
          <Scanline blendFunction={BlendFunction.OVERLAY} density={wordStyle.scanlines} />
        )}
        <Noise opacity={0.04} />
        <Vignette darkness={0.45} offset={0.4} />
      </EffectComposer>
    </>
  );
}

function ControlPanel({ settings, onChange, activePreset, onPresetChange, currentWord }: {
  settings: Settings;
  onChange: (key: keyof Settings, value: number) => void;
  activePreset: PresetKey | null;
  onPresetChange: (preset: PresetKey) => void;
  currentWord: string;
}) {
  return (
    <div className={styles.controlPanel}>
      <div className={styles.topRow}>
        <div className={styles.currentWord}>{currentWord}</div>
        <div className={styles.presets}>
          {(Object.keys(PRESETS) as PresetKey[]).map((preset) => (
            <button
              key={preset}
              className={`${styles.presetButton} ${activePreset === preset ? styles.active : ''}`}
              onClick={() => onPresetChange(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.sliders}>
        <div className={styles.sliderGroup}>
          <label>Size</label>
          <input type="range" min="0.5" max="5" step="0.1" value={settings.particleSize}
            onChange={(e) => onChange('particleSize', parseFloat(e.target.value))} />
          <span className={styles.value}>{settings.particleSize.toFixed(1)}</span>
        </div>
        <div className={styles.sliderGroup}>
          <label>Focus</label>
          <input type="range" min="0.5" max="8" step="0.1" value={settings.focusRange}
            onChange={(e) => onChange('focusRange', parseFloat(e.target.value))} />
          <span className={styles.value}>{settings.focusRange.toFixed(1)}</span>
        </div>
        <div className={styles.sliderGroup}>
          <label>Noise</label>
          <input type="range" min="0" max="0.5" step="0.01" value={settings.noiseAmount}
            onChange={(e) => onChange('noiseAmount', parseFloat(e.target.value))} />
          <span className={styles.value}>{settings.noiseAmount.toFixed(2)}</span>
        </div>
        <div className={styles.sliderGroup}>
          <label>Sharp</label>
          <input type="range" min="0" max="1" step="0.05" value={settings.sharpness}
            onChange={(e) => onChange('sharpness', parseFloat(e.target.value))} />
          <span className={styles.value}>{settings.sharpness.toFixed(2)}</span>
        </div>
        <div className={styles.sliderGroup}>
          <label>Density</label>
          <input type="range" min="0.3" max="2" step="0.1" value={settings.density}
            onChange={(e) => onChange('density', parseFloat(e.target.value))} />
          <span className={styles.value}>{settings.density.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export default function NoiseField() {
  const [settings, setSettings] = useState<Settings>(PRESETS['Clean']);
  const [activePreset, setActivePreset] = useState<PresetKey | null>('Clean');
  const [wordIndex, setWordIndex] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const cycleProgress = (elapsed % WORD_DURATION) / WORD_DURATION;
      const morphStart = 0.75;
      setMorphProgress(cycleProgress >= morphStart ? (cycleProgress - morphStart) / (1 - morphStart) : 0);
      setWordIndex(Math.floor(elapsed / WORD_DURATION) % WORDS.length);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const handleChange = (key: keyof Settings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  };

  const handlePresetChange = (preset: PresetKey) => {
    setSettings(PRESETS[preset]);
    setActivePreset(preset);
  };

  return (
    <div className={styles.container}>
      <ControlPanel
        settings={settings}
        onChange={handleChange}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        currentWord={WORDS[wordIndex]}
      />
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: true, alpha: false }}>
        <Scene wordIndex={wordIndex} morphProgress={morphProgress} settings={settings} />
      </Canvas>
    </div>
  );
}
