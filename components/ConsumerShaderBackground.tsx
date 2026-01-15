'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ConsumerShaderBackgroundProps {
  currentSection: number
  mousePosition: { x: number; y: number }
  scanLine: number
  brightness: number
}

export function ConsumerShaderBackground({
  currentSection,
  mousePosition,
  scanLine,
  brightness
}: ConsumerShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const textTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const frameRef = useRef<number>(0)

  const sectionTexts = ['SCAN', 'TRACE', 'VERIFY', 'TRUST']

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Create text texture
    function createTextTexture(text: string) {
      const cvs = document.createElement('canvas')
      const ctx = cvs.getContext('2d')!
      cvs.width = 1024
      cvs.height = 512

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cvs.width, cvs.height)
      ctx.fillStyle = '#444444'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, cvs.width / 2, cvs.height / 2)

      const texture = new THREE.CanvasTexture(cvs)
      texture.needsUpdate = true
      return texture
    }

    const textTexture = createTextTexture('SCAN')
    textTextureRef.current = textTexture

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

        float drawSparkle(vec2 uv, vec2 center, float size, float time, float rand) {
          vec2 p = uv - center;
          float d = length(p);
          float wave = sin(time);
          float pulse = smoothstep(0.7, 1.0, wave) * (0.3 + rand * 0.4);
          float cross = max(
            smoothstep(size * 0.3, 0.0, abs(p.x)) * smoothstep(size, 0.0, abs(p.y)),
            smoothstep(size * 0.3, 0.0, abs(p.y)) * smoothstep(size, 0.0, abs(p.x))
          );
          float glow = smoothstep(size * 0.5, 0.0, d);
          return (cross + glow * 0.5) * pulse;
        }

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float drawArrow(vec2 uv, vec2 arrowCenter, vec2 target, float size) {
          vec2 dir = normalize(target - arrowCenter);
          vec2 perp = vec2(-dir.y, dir.x);
          vec2 local = uv - arrowCenter;
          float along = dot(local, dir);
          float across = dot(local, perp);
          float lineWidth = size * 0.08;
          float lineLength = size * 0.5;
          float line = step(abs(across), lineWidth) * step(abs(along), lineLength);
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

          float dotSpacing = 20.0;
          float dotSize = 1.5;

          vec2 gridPos = mod(pixelCoord, dotSpacing);
          float dist = length(gridPos - dotSpacing * 0.5);

          float dot = smoothstep(dotSize + 0.5, dotSize, dist);
          vec3 dotColor = vec3(0.25) * dot;

          vec2 textUv = uv;
          vec4 textSample = texture2D(uTextTexture, textUv);
          float textValue = textSample.r;

          float textInfluence = textValue * uTextOpacity * 1.2;
          dotColor += vec3(textInfluence) * dot;

          vec3 bgColor = vec3(0.04);

          vec3 sectionColor = vec3(0.0);
          if (uCurrentSection < 0.5) {
            sectionColor = vec3(0.1, 0.4, 0.3);
          } else if (uCurrentSection < 1.5) {
            sectionColor = vec3(0.3, 0.2, 0.45);
          } else if (uCurrentSection < 2.5) {
            sectionColor = vec3(0.45, 0.15, 0.15);
          } else {
            sectionColor = vec3(0.4, 0.25, 0.12);
          }

          float centerDist = length(uv - vec2(0.5, 0.6));
          float pulse = 0.18 + sin(uTime * 0.5) * 0.04;
          float sectionGlow = smoothstep(0.6, 0.0, centerDist) * pulse;
          bgColor += sectionColor * sectionGlow;

          bgColor += vec3(textValue * uTextOpacity * 0.5);

          float scanDist = abs(uv.x - uScanLine);
          float scanIntensity = smoothstep(0.15, 0.0, scanDist) * uBrightness;
          float scanTrail = smoothstep(0.4, 0.0, uv.x - uScanLine) * step(uv.x, uScanLine) * uBrightness * 0.5;

          vec3 color = bgColor + dotColor;

          color += vec3(0.2, 1.0, 0.7) * scanIntensity * dot * 2.0;
          color += vec3(0.1, 0.5, 0.4) * scanIntensity * 0.3;
          color += vec3(0.0, 0.3, 0.2) * scanTrail * dot;

          if (uCurrentSection > 1.5 && uCurrentSection < 2.5) {
            vec2 arrowGridPos = mod(pixelCoord, dotSpacing);
            vec2 arrowCenter = (pixelCoord - arrowGridPos + dotSpacing * 0.5) / uResolution;
            float arrowSize = 0.012;
            float arrow = drawArrow(uv, arrowCenter, uMouse, arrowSize);
            vec3 arrowColor = vec3(1.0, 0.4, 0.35) * arrow * 0.4;
            color += arrowColor;
          }

          if (uCurrentSection > 2.5 && uCurrentSection < 3.5) {
            vec2 sparkleGridPos = mod(pixelCoord, dotSpacing);
            vec2 sparkleCenter = (pixelCoord - sparkleGridPos + dotSpacing * 0.5) / uResolution;
            vec2 gridIndex = floor(pixelCoord / dotSpacing);
            float rand = hash(gridIndex);
            float rand2 = hash(gridIndex + vec2(100.0, 200.0));
            if (rand > 0.88) {
              float phase = rand * 20.0 + rand2 * 10.0;
              float sparkleTime = uTime * 1.5 + phase;
              float sparkleSize = 0.006;
              float sparkle = drawSparkle(uv, sparkleCenter, sparkleSize, sparkleTime, rand2);
              vec3 sparkleColor = vec3(0.8, 0.55, 0.32) * sparkle * 0.5;
              color += sparkleColor;
            }
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
    materialRef.current = material

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      material.uniforms.uTime.value = performance.now() * 0.001
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      textTexture.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uCurrentSection.value = currentSection

      // Update text texture
      const text = sectionTexts[currentSection] || 'SCAN'
      if (textTextureRef.current) {
        textTextureRef.current.dispose()
      }

      const cvs = document.createElement('canvas')
      const ctx = cvs.getContext('2d')!
      cvs.width = 1024
      cvs.height = 512
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cvs.width, cvs.height)
      ctx.fillStyle = '#444444'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, cvs.width / 2, cvs.height / 2)

      const newTexture = new THREE.CanvasTexture(cvs)
      textTextureRef.current = newTexture
      materialRef.current.uniforms.uTextTexture.value = newTexture
    }
  }, [currentSection])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uMouse.value.set(mousePosition.x, mousePosition.y)
    }
  }, [mousePosition])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uScanLine.value = scanLine
      materialRef.current.uniforms.uBrightness.value = brightness
    }
  }, [scanLine, brightness])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  )
}
