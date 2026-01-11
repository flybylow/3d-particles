import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const electricScanVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const electricScanFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Noise function for electric effect
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  // Electric crackling pattern
  float electricCrackle(vec2 uv, float time) {
    float n = noise(uv * 8.0 + time * 2.0);
    float n2 = noise(uv * 16.0 - time * 3.0);
    float crackle = pow(n * n2, 2.0);
    return crackle;
  }
  
  // Lightning bolt pattern
  float lightning(vec2 uv) {
    float dist = abs(uv.x - 0.5) * 2.0; // Distance from center (horizontal)
    
    // Main lightning core - very bright and tight
    float core = 1.0 - smoothstep(0.0, 0.02, dist);
    core = pow(core, 4.0); // Sharp falloff
    
    // Electric branches - jagged pattern
    float branches = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
      float offset = (random(vec2(i)) - 0.5) * 0.15;
      float branchDist = abs(uv.x - (0.5 + offset)) * 2.0;
      float branchY = fract(uv.y * 3.0 + i * 0.7);
      float branch = step(0.95, branchY) * (1.0 - smoothstep(0.0, 0.05, branchDist));
      branches += branch * 0.3;
    }
    
    return core + branches;
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Distance from center (horizontal scan line)
    float distFromCenter = abs(uv.x - 0.5) * 2.0;
    
    // Main lightning core - bright white/cyan
    float coreMask = 1.0 - smoothstep(0.0, 0.03, distFromCenter);
    coreMask = pow(coreMask, 3.0); // Very sharp falloff
    
    // Electric crackling overlay
    float crackle = electricCrackle(uv, uTime * 5.0);
    float crackleMask = coreMask * crackle * 0.4;
    
    // Lightning pattern
    float lightningPattern = lightning(uv + vec2(0.0, uTime * 2.0));
    lightningPattern *= coreMask;
    
    // Vertical gradient (stronger at center, fades top/bottom)
    float verticalGradient = 1.0 - abs(uv.y - 0.5) * 2.0;
    verticalGradient = smoothstep(0.2, 0.8, verticalGradient);
    
    // Pulsing intensity
    float pulse = 0.9 + 0.1 * sin(uTime * 8.0);
    float pulse2 = 0.95 + 0.05 * sin(uTime * 15.0 + uv.y * 10.0);
    
    // Core color - bright white with cyan tint
    vec3 coreColor = vec3(1.0, 1.0, 1.0); // Pure white
    vec3 cyanGlow = vec3(0.3, 0.9, 1.0); // Electric cyan
    
    // Combine core and crackling
    float finalIntensity = (coreMask * 1.0 + crackleMask * 0.6 + lightningPattern * 0.3) * verticalGradient * pulse * pulse2 * uIntensity;
    
    // Color mixing - white core with cyan edges
    float cyanMix = 1.0 - coreMask;
    vec3 finalColor = mix(coreColor, cyanGlow, cyanMix * 0.5);
    finalColor += crackle * cyanGlow * 0.3;
    finalColor += lightningPattern * vec3(0.5, 0.9, 1.0) * 0.2;
    
    // Alpha - sharp cutoff
    float alpha = finalIntensity;
    if (distFromCenter > 0.25) {
      discard; // Hard cutoff
    }
    
    // Boost brightness
    finalColor *= 1.5;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// Shader material class for electric scan effect
export class ElectricScanMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uResolution: { value: new THREE.Vector2(1, 1) }
      },
      vertexShader: electricScanVertexShader,
      fragmentShader: electricScanFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }
}
