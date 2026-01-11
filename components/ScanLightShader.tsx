/**
 * Elegant Scan Light Shader
 * Creates a smooth, glowing scan line with gradient falloff
 * Inspired by high-end sci-fi UI and barcode scanner aesthetics
 */

export const scanLightVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const scanLightFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorCore;    // Bright white core
  uniform vec3 uColorEdge;    // Blue-cyan edges
  uniform float uWidth;        // Width of the scan beam
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    // Distance from center of scan line (horizontal)
    float distFromCenter = abs(vUv.x - 0.5) * 2.0;
    
    // Create smooth gradient falloff from center to edges
    // Core is bright white, edges fade to blue
    float coreMask = 1.0 - smoothstep(0.0, 0.15, distFromCenter);
    float edgeMask = 1.0 - smoothstep(0.15, 1.0, distFromCenter);
    
    // Vertical gradient (stronger at center, fades top/bottom)
    float verticalGradient = 1.0 - abs(vUv.y - 0.5) * 2.0;
    verticalGradient = smoothstep(0.0, 0.5, verticalGradient);
    
    // Combine gradients
    float intensity = (coreMask + edgeMask * 0.6) * verticalGradient * uIntensity;
    
    // Pulse effect
    float pulse = 0.8 + 0.2 * sin(uTime * 3.0);
    intensity *= pulse;
    
    // Color mixing: white core, blue edges
    vec3 color = mix(uColorEdge, uColorCore, coreMask);
    
    // Add subtle scan lines (like a real scanner)
    float scanLines = sin(vUv.y * 100.0 + uTime * 10.0) * 0.5 + 0.5;
    scanLines = mix(1.0, scanLines, 0.15); // Subtle effect
    
    // Final color with alpha
    vec3 finalColor = color * intensity * scanLines;
    float alpha = intensity;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export const particleHighlightVertexShader = `
  uniform float uScanPosition; // X position of scan line (-2 to 2)
  uniform float uScanWidth;    // Width of scan effect influence
  
  attribute vec3 position;
  attribute vec3 color;
  
  varying vec3 vColor;
  varying float vHighlight;
  
  void main() {
    vColor = color;
    
    // Calculate distance from scan line
    float distFromScan = abs(position.x - uScanPosition);
    
    // Highlight particles near the scan line
    vHighlight = 1.0 - smoothstep(0.0, uScanWidth, distFromScan);
    vHighlight = pow(vHighlight, 2.0); // Sharper falloff
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 2.0 + vHighlight * 3.0; // Particles grow when scanned
  }
`

export const particleHighlightFragmentShader = `
  uniform vec3 uScanColor;
  uniform vec3 uBaseColor;
  
  varying vec3 vColor;
  varying float vHighlight;
  
  void main() {
    // Circular point shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Mix base color with scan color based on highlight
    vec3 color = mix(uBaseColor, uScanColor, vHighlight * 0.7);
    
    // Add glow when highlighted
    float glow = vHighlight * (1.0 - dist);
    color += uScanColor * glow * 0.5;
    
    gl_FragColor = vec4(color, alpha * 0.92);
  }
`
