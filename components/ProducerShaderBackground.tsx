'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ProducerShaderBackgroundProps {
  currentSection: number
  mousePosition: { x: number; y: number }
}

export function ProducerShaderBackground({
  currentSection,
  mousePosition
}: ProducerShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const textTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const frameRef = useRef<number>(0)

  const sectionTexts = ['PRODUCE', 'COMPLY', 'LEAD']

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
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 180px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, cvs.width / 2, cvs.height / 2)

      const texture = new THREE.CanvasTexture(cvs)
      texture.needsUpdate = true
      return texture
    }

    const textTexture = createTextTexture('PRODUCE')
    textTextureRef.current = textTexture

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uTextTexture: { value: textTexture },
        uTextOpacity: { value: 1.0 },
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
        uniform vec2 uMouse;
        uniform float uCurrentSection;

        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          vec2 pixelCoord = uv * uResolution;

          // Subtle grid - more corporate/minimal
          float dotSpacing = 24.0;
          float dotSize = 1.0;

          vec2 gridPos = mod(pixelCoord, dotSpacing);
          float dist = length(gridPos - dotSpacing * 0.5);

          float dot = smoothstep(dotSize + 0.5, dotSize, dist);
          vec3 dotColor = vec3(0.18) * dot;

          // Text influence
          vec2 textUv = uv;
          vec4 textSample = texture2D(uTextTexture, textUv);
          float textValue = textSample.r;

          float textInfluence = textValue * uTextOpacity * 0.8;
          dotColor += vec3(textInfluence) * dot;

          // Dark background
          vec3 bgColor = vec3(0.035);

          // Muted corporate color palette
          vec3 sectionColor = vec3(0.0);
          if (uCurrentSection < 0.5) {
            // Hero - sage/olive green
            sectionColor = vec3(0.25, 0.28, 0.22);
          } else if (uCurrentSection < 1.5) {
            // Proof - steel blue/grey
            sectionColor = vec3(0.22, 0.26, 0.30);
          } else {
            // Closer - warm taupe/bronze
            sectionColor = vec3(0.32, 0.26, 0.20);
          }

          // Subtle center glow
          float centerDist = length(uv - vec2(0.5, 0.55));
          float pulse = 0.12 + sin(uTime * 0.3) * 0.02;
          float sectionGlow = smoothstep(0.7, 0.0, centerDist) * pulse;
          bgColor += sectionColor * sectionGlow;

          // Subtle text background influence
          bgColor += vec3(textValue * uTextOpacity * 0.3);

          vec3 color = bgColor + dotColor;

          // Subtle moving highlights based on mouse
          float mouseDist = length(uv - uMouse);
          float mouseGlow = smoothstep(0.4, 0.0, mouseDist) * 0.03;
          color += sectionColor * mouseGlow;

          // Very subtle grid line effect for corporate feel
          float lineX = smoothstep(0.5, 0.0, abs(mod(pixelCoord.x, dotSpacing * 4.0) - dotSpacing * 2.0));
          float lineY = smoothstep(0.5, 0.0, abs(mod(pixelCoord.y, dotSpacing * 4.0) - dotSpacing * 2.0));
          color += vec3(0.02) * (lineX + lineY) * 0.3;

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
      // Map 7 sections to 3 background states: 0-1 PRODUCE, 2-3 COMPLY, 4-6 LEAD
      const bgSection = currentSection <= 1 ? 0 : currentSection <= 3 ? 1 : 2
      materialRef.current.uniforms.uCurrentSection.value = bgSection

      // Update text texture
      const text = sectionTexts[bgSection] || 'PRODUCE'
      if (textTextureRef.current) {
        textTextureRef.current.dispose()
      }

      const cvs = document.createElement('canvas')
      const ctx = cvs.getContext('2d')!
      cvs.width = 1024
      cvs.height = 512
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cvs.width, cvs.height)
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 180px Arial'
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
