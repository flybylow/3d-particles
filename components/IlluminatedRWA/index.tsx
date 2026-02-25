'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './styles.module.css';

interface LightSource {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
}

const CONCEPTS = [
  { id: 'verification', color: '#1B7340' },
  { id: 'chain', color: '#E63329' },
  { id: 'circular', color: '#88927D' },
  { id: 'tokenization', color: '#D4A84B' },
  { id: 'nfc', color: '#9B6B9E' },
  { id: 'bridge', color: '#FF6B2C' },
];

export default function IlluminatedRWA() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const timeRef = useRef(0);

  const drawIllustration = useCallback((
    ctx: CanvasRenderingContext2D,
    conceptId: string,
    color: string,
    cx: number,
    cy: number,
    scale: number,
    light: LightSource
  ) => {
    const baseRadius = 60 * scale;

    // Calculate distance from light for shadow intensity
    const dx = cx - light.x;
    const dy = cy - light.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const shadowIntensity = Math.max(0, 1 - dist / (light.radius * 1.5));

    // Shadow settings based on light position
    const shadowAngle = Math.atan2(dy, dx);
    const shadowDist = 15 * (1 - shadowIntensity) + 5;
    ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * shadowIntensity})`;
    ctx.shadowBlur = 20 * shadowIntensity + 5;
    ctx.shadowOffsetX = Math.cos(shadowAngle) * shadowDist;
    ctx.shadowOffsetY = Math.sin(shadowAngle) * shadowDist;

    // Glow intensity based on proximity to light
    const glowIntensity = Math.max(0.3, shadowIntensity);

    ctx.save();

    switch (conceptId) {
      case 'verification':
        drawVerification(ctx, color, cx, cy, baseRadius, glowIntensity);
        break;
      case 'chain':
        drawChain(ctx, color, cx, cy, baseRadius, glowIntensity);
        break;
      case 'circular':
        drawCircular(ctx, color, cx, cy, baseRadius, glowIntensity);
        break;
      case 'tokenization':
        drawTokenization(ctx, color, cx, cy, baseRadius, glowIntensity);
        break;
      case 'nfc':
        drawNFC(ctx, color, cx, cy, baseRadius, glowIntensity);
        break;
      case 'bridge':
        drawBridge(ctx, color, cx, cy, baseRadius, glowIntensity);
        break;
    }

    ctx.restore();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const time = timeRef.current;

    // Clear with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Calculate light position
    let lightX: number, lightY: number;

    if (mouseRef.current.active) {
      lightX = mouseRef.current.x;
      lightY = mouseRef.current.y;
    } else {
      // Orbital light movement
      const orbitRadius = Math.min(width, height) * 0.3;
      lightX = width / 2 + Math.sin(time * 0.0005) * orbitRadius;
      lightY = height / 2 + Math.cos(time * 0.0003) * orbitRadius * 0.6;
    }

    const light: LightSource = {
      x: lightX,
      y: lightY,
      radius: Math.min(width, height) * 0.6,
      intensity: 1,
      color: '#ffffff',
    };

    // Draw ambient light glow
    const gradient = ctx.createRadialGradient(
      light.x, light.y, 0,
      light.x, light.y, light.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.03)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw illustrations in a scattered layout
    const positions = [
      { x: width * 0.2, y: height * 0.25 },
      { x: width * 0.5, y: height * 0.15 },
      { x: width * 0.8, y: height * 0.3 },
      { x: width * 0.15, y: height * 0.7 },
      { x: width * 0.5, y: height * 0.75 },
      { x: width * 0.85, y: height * 0.65 },
    ];

    // Add subtle drift to positions
    positions.forEach((pos, i) => {
      const drift = 20;
      pos.x += Math.sin(time * 0.0003 + i * 1.5) * drift;
      pos.y += Math.cos(time * 0.0004 + i * 1.2) * drift;
    });

    CONCEPTS.forEach((concept, i) => {
      const pos = positions[i];
      const scale = 0.8 + Math.sin(time * 0.001 + i) * 0.1; // Breathing effect
      drawIllustration(ctx, concept.id, concept.color, pos.x, pos.y, scale, light);
    });

    // Draw light source indicator (subtle)
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const indicatorGradient = ctx.createRadialGradient(
      light.x, light.y, 0,
      light.x, light.y, 30
    );
    indicatorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    indicatorGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = indicatorGradient;
    ctx.beginPath();
    ctx.arc(light.x, light.y, 30, 0, Math.PI * 2);
    ctx.fill();

    timeRef.current += 16;
    animationRef.current = requestAnimationFrame(animate);
  }, [drawIllustration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

// Drawing functions for each concept
function drawVerification(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number, glow: number) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6 + glow * 0.4;

  // Center core
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Concentric arcs
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.4 + glow * 0.4;

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, -Math.PI * 0.3, Math.PI * 0.9);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.2, Math.PI * 1.6);
  ctx.stroke();
}

function drawChain(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number, glow: number) {
  const linkWidth = r * 0.5;
  const linkHeight = r * 0.3;

  ctx.globalAlpha = 0.5 + glow * 0.5;

  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * linkWidth * 1.2;
    const filled = i % 2 === 0;

    if (filled) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, cy, linkWidth, linkHeight, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, cy, linkWidth, linkHeight, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawCircular(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number, glow: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.5 + glow * 0.5;

  // Almost complete circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 1.85);
  ctx.stroke();

  // Small dot at gap
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + r * Math.sin(Math.PI * 0.15), cy - r * Math.cos(Math.PI * 0.15), r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawTokenization(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number, glow: number) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5 + glow * 0.5;

  // Main arc
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy, r * 0.8, -Math.PI * 0.5, Math.PI);
  ctx.closePath();
  ctx.fill();

  // Fragments
  const fragments = [
    { x: r * 0.4, y: -r * 0.2, size: r * 0.3 },
    { x: r * 0.7, y: r * 0.1, size: r * 0.2 },
    { x: r * 0.9, y: -r * 0.1, size: r * 0.15 },
  ];

  fragments.forEach(f => {
    ctx.beginPath();
    ctx.arc(cx + f.x, cy + f.y, f.size, -0.3, Math.PI * 0.7);
    ctx.closePath();
    ctx.fill();
  });
}

function drawNFC(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number, glow: number) {
  ctx.globalAlpha = 0.6 + glow * 0.4;

  // Center chip
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Signal waves
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.4 + glow * 0.4;

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
}

function drawBridge(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number, glow: number) {
  ctx.globalAlpha = 0.5 + glow * 0.5;

  // Left solid semicircle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - r * 0.8, cy, r * 0.4, Math.PI * 0.5, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();

  // Right outlined semicircle
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx + r * 0.8, cy, r * 0.4, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  // Bridge arc
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.2, r * 0.9, Math.PI, 0);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
}
