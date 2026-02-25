import * as THREE from 'three';

// Setup
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Current section text
let currentText = 'SCAN';
let targetText = 'SCAN';

// Create text texture - optimized size
function createTextTexture(text) {
  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d');

  // Reduced from 2048x1024 to 1024x512 for better performance
  cvs.width = 1024;
  cvs.height = 512;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  ctx.fillStyle = '#444444';
  ctx.font = 'bold 200px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cvs.width / 2, cvs.height / 2);

  const texture = new THREE.CanvasTexture(cvs);
  texture.needsUpdate = true;
  return texture;
}

let textTexture = createTextTexture(currentText);

// Shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTextTexture: { value: textTexture },
    uTextOpacity: { value: 1.0 },
    uScrollY: { value: 0 },
    uBrightness: { value: 0.0 },
    uScanLine: { value: -0.2 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uCurrentSection: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform sampler2D uTextTexture;
    uniform float uTextOpacity;
    uniform float uScrollY;
    uniform float uBrightness;
    uniform float uScanLine;
    uniform vec2 uMouse;
    uniform float uCurrentSection;

    varying vec2 vUv;

    // Draw a sparkle (4-point star)
    float drawSparkle(vec2 uv, vec2 center, float size, float time, float rand) {
      vec2 p = uv - center;
      float d = length(p);

      // Occasional brief sparkle - mostly dim
      float wave = sin(time);
      float pulse = smoothstep(0.7, 1.0, wave) * (0.3 + rand * 0.4);

      float cross = max(
        smoothstep(size * 0.3, 0.0, abs(p.x)) * smoothstep(size, 0.0, abs(p.y)),
        smoothstep(size * 0.3, 0.0, abs(p.y)) * smoothstep(size, 0.0, abs(p.x))
      );

      // Center glow
      float glow = smoothstep(size * 0.5, 0.0, d);

      return (cross + glow * 0.5) * pulse;
    }

    // Simple hash for randomness
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Draw an arrow pointing toward target
    float drawArrow(vec2 uv, vec2 arrowCenter, vec2 target, float size) {
      vec2 dir = normalize(target - arrowCenter);
      vec2 perp = vec2(-dir.y, dir.x);

      // Transform uv to arrow local space
      vec2 local = uv - arrowCenter;
      float along = dot(local, dir);
      float across = dot(local, perp);

      // Arrow line
      float lineWidth = size * 0.08;
      float lineLength = size * 0.5;
      float line = step(abs(across), lineWidth) * step(abs(along), lineLength);

      // Arrow head
      float headSize = size * 0.3;
      float headStart = lineLength - headSize;
      float inHead = step(headStart, along) * step(along, lineLength + size * 0.1);
      float headWidth = (along - headStart) * 0.8;
      float head = inHead * step(abs(across), headWidth);

      return max(line, head);
    }

    void main() {
      vec2 uv = vUv;
      vec2 pixelCoord = uv * uResolution;

      // Dot grid
      float dotSpacing = 20.0;
      float dotSize = 1.5;

      vec2 gridPos = mod(pixelCoord, dotSpacing);
      float dist = length(gridPos - dotSpacing * 0.5);

      // Base dot color
      float dot = smoothstep(dotSize + 0.5, dotSize, dist);
      vec3 dotColor = vec3(0.25) * dot;

      // Sample text texture
      vec2 textUv = uv;
      vec4 textSample = texture2D(uTextTexture, textUv);
      float textValue = textSample.r;

      // Text affects dot brightness
      float textInfluence = textValue * uTextOpacity * 1.2;
      dotColor += vec3(textInfluence) * dot;

      // Background - text creates visible shape like in reference
      vec3 bgColor = vec3(0.04);

      // Section-specific background tint
      vec3 sectionColor = vec3(0.0);
      if (uCurrentSection < 0.5) {
        // SCAN - Green
        sectionColor = vec3(0.1, 0.4, 0.3);
      } else if (uCurrentSection < 1.5) {
        // TRACE - Purple
        sectionColor = vec3(0.3, 0.2, 0.45);
      } else if (uCurrentSection < 2.5) {
        // VERIFY - Red/Coral
        sectionColor = vec3(0.45, 0.15, 0.15);
      } else {
        // TRUST - Copper/Warm
        sectionColor = vec3(0.4, 0.25, 0.12);
      }

      // Add radial gradient of section color with subtle animation
      float centerDist = length(uv - vec2(0.5, 0.6));
      float pulse = 0.18 + sin(uTime * 0.5) * 0.04;
      float sectionGlow = smoothstep(0.6, 0.0, centerDist) * pulse;
      bgColor += sectionColor * sectionGlow;

      bgColor += vec3(textValue * uTextOpacity * 0.5);

      // Scan line effect
      float scanDist = abs(uv.x - uScanLine);
      float scanIntensity = smoothstep(0.15, 0.0, scanDist) * uBrightness;
      float scanTrail = smoothstep(0.4, 0.0, uv.x - uScanLine) * step(uv.x, uScanLine) * uBrightness * 0.5;

      // Final color with scan effect
      vec3 color = bgColor + dotColor;

      // Bright scan line
      color += vec3(0.2, 1.0, 0.7) * scanIntensity * dot * 2.0;
      color += vec3(0.1, 0.5, 0.4) * scanIntensity * 0.3;

      // Trail glow behind scan line
      color += vec3(0.0, 0.3, 0.2) * scanTrail * dot;

      // Arrows grid for VERIFY section (section 2, 0-indexed)
      if (uCurrentSection > 1.5 && uCurrentSection < 2.5) {
        // Use same grid as dots (20px spacing)
        vec2 arrowGridPos = mod(pixelCoord, dotSpacing);
        vec2 arrowCenter = (pixelCoord - arrowGridPos + dotSpacing * 0.5) / uResolution;

        float arrowSize = 0.012;
        float arrow = drawArrow(uv, arrowCenter, uMouse, arrowSize);

        // Red/coral arrows for verify section
        vec3 arrowColor = vec3(1.0, 0.4, 0.35) * arrow * 0.4;
        color += arrowColor;
      }

      // Sparkles for TRUST section (section 3, 0-indexed)
      if (uCurrentSection > 2.5 && uCurrentSection < 3.5) {
        vec2 sparkleGridPos = mod(pixelCoord, dotSpacing);
        vec2 sparkleCenter = (pixelCoord - sparkleGridPos + dotSpacing * 0.5) / uResolution;
        vec2 gridIndex = floor(pixelCoord / dotSpacing);

        float rand = hash(gridIndex);
        float rand2 = hash(gridIndex + vec2(100.0, 200.0));

        // ~12% of dots can sparkle
        if (rand > 0.88) {
          // Each sparkle has very different timing
          float phase = rand * 20.0 + rand2 * 10.0;
          float sparkleTime = uTime * 1.5 + phase;

          float sparkleSize = 0.006;
          float sparkle = drawSparkle(uv, sparkleCenter, sparkleSize, sparkleTime, rand2);

          // Copper/warm color - subtle
          vec3 sparkleColor = vec3(0.8, 0.55, 0.32) * sparkle * 0.5;
          color += sparkleColor;
        }
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
});

// Full screen quad
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Track sections
const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');

// Scan button elements
const scanButton = document.getElementById('scanButton');
const productPassport = document.getElementById('productPassport');
let isScanning = false;
let scanStartTime = 0;
const scanDuration = 1500;

// Trace button elements
const traceButton = document.getElementById('traceButton');
const traceLine = document.getElementById('traceLine');
const traceHead = document.getElementById('traceHead');
const journeySteps = document.querySelectorAll('.journey-step');
let isTracing = false;
let traceStartTime = 0;
const traceDuration = 2000;

// Nav click handlers
navItems.forEach((item) => {
  const link = item.querySelector('a');
  if (link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.getAttribute('href').substring(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});

function updateCurrentSection() {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const sectionMiddle = rect.top + rect.height / 2;

    if (sectionMiddle > 0 && sectionMiddle < windowHeight) {
      targetText = section.dataset.text;
      material.uniforms.uCurrentSection.value = index;

      // Update active nav item
      navItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });

  // Update text if changed
  if (targetText !== currentText) {
    currentText = targetText;
    textTexture.dispose();
    textTexture = createTextTexture(currentText);
    material.uniforms.uTextTexture.value = textTexture;
  }

  material.uniforms.uScrollY.value = scrollY;
}

// Unified animation loop
function animate() {
  const now = performance.now();
  material.uniforms.uTime.value = now * 0.001;

  // Scan animation
  if (isScanning) {
    const elapsed = now - scanStartTime;
    const progress = elapsed / scanDuration;

    material.uniforms.uScanLine.value = -0.2 + progress * 1.4;

    if (progress >= 1) {
      isScanning = false;
      scanButton.classList.remove('scanning');
      productPassport.classList.add('visible');
      material.uniforms.uBrightness.value = 0.0;
      material.uniforms.uScanLine.value = -0.2;
    }
  }

  // Trace animation
  if (isTracing) {
    const elapsed = now - traceStartTime;
    const progress = Math.min(elapsed / traceDuration, 1.0);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    traceLine.style.width = (easedProgress * 100) + '%';
    traceHead.style.left = (easedProgress * 100) + '%';

    journeySteps.forEach((step, index) => {
      const stepThreshold = index / (journeySteps.length - 1);
      if (easedProgress >= stepThreshold) {
        step.classList.add('reached');
      }
    });

    if (progress >= 1) {
      isTracing = false;
      traceButton.classList.remove('tracing');
      setTimeout(() => {
        traceHead.classList.remove('active');
      }, 500);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Throttle helper
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = performance.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// Event listeners with throttling
window.addEventListener('scroll', throttle(updateCurrentSection, 16), { passive: true });

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

// Mouse tracking - throttled
window.addEventListener('mousemove', throttle((e) => {
  material.uniforms.uMouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
}, 16), { passive: true });

// Scan button click handler
scanButton.addEventListener('click', () => {
  if (isScanning) return;

  isScanning = true;
  scanStartTime = performance.now();
  scanButton.classList.add('scanning');
  material.uniforms.uBrightness.value = 1.0;
  material.uniforms.uScanLine.value = -0.2;
});

// Trace button click handler
traceButton.addEventListener('click', () => {
  if (isTracing) return;

  isTracing = true;
  traceStartTime = performance.now();
  traceButton.classList.add('tracing');
  traceHead.classList.add('active');

  // Reset steps
  journeySteps.forEach(step => step.classList.remove('reached'));
});

// Init
updateCurrentSection();
animate();
