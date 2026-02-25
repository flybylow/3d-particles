'use client';

import { useMemo } from 'react';
import styles from './styles.module.css';

interface TileConfig {
  id: number;
  x: number;
  y: number;
  color: string;
  colorLight: string;
  colorDark: string;
  delay: number;
  rotation: number;
}

const COLORS = [
  { base: '#88927D', light: '#a8b09a', dark: '#5c6354' }, // sage
  { base: '#B87333', light: '#d4956a', dark: '#8a5526' }, // copper
  { base: '#4A5F7A', light: '#7089a8', dark: '#344557' }, // steel blue
  { base: '#9B7A7A', light: '#c4a8a8', dark: '#6b5252' }, // dusty rose
  { base: '#C4A35A', light: '#dcc48a', dark: '#967a3a' }, // ochre
];

const GRID_COLS = 4;
const GRID_ROWS = 3;
const TILE_SIZE = 120;
const GAP = 30;

function generateTiles(): TileConfig[] {
  const tiles: TileConfig[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const colorSet = COLORS[(row * GRID_COLS + col) % COLORS.length];
      tiles.push({
        id: row * GRID_COLS + col,
        x: col * (TILE_SIZE + GAP),
        y: row * (TILE_SIZE + GAP),
        color: colorSet.base,
        colorLight: colorSet.light,
        colorDark: colorSet.dark,
        delay: (row + col) * 0.2,
        rotation: Math.random() * 20 - 10,
      });
    }
  }
  return tiles;
}

function generateLines(tiles: TileConfig[]) {
  const lines: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
  const center = (tile: TileConfig) => ({
    x: tile.x + TILE_SIZE / 2,
    y: tile.y + TILE_SIZE / 2,
  });

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS - 1; col++) {
      const from = tiles[row * GRID_COLS + col];
      const to = tiles[row * GRID_COLS + col + 1];
      lines.push({ ...center(from), x2: center(to).x, y2: center(to).y, delay: (row + col) * 0.1 });
    }
  }

  for (let row = 0; row < GRID_ROWS - 1; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const from = tiles[row * GRID_COLS + col];
      const to = tiles[(row + 1) * GRID_COLS + col];
      lines.push({ x1: center(from).x, y1: center(from).y, x2: center(to).x, y2: center(to).y, delay: (row + col) * 0.1 + 0.05 });
    }
  }

  [[0, 5], [2, 7], [4, 9], [6, 11]].forEach(([f, t], i) => {
    if (f < tiles.length && t < tiles.length) {
      lines.push({ x1: center(tiles[f]).x, y1: center(tiles[f]).y, x2: center(tiles[t]).x, y2: center(tiles[t]).y, delay: 0.4 + i * 0.1 });
    }
  });

  return lines;
}

export default function WatercolorGrid() {
  const tiles = useMemo(generateTiles, []);
  const lines = useMemo(() => generateLines(tiles), [tiles]);

  const gridWidth = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * GAP;
  const gridHeight = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * GAP;

  return (
    <div className={styles.container}>
      {/* SVG Filter for watercolor texture */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="watercolor-turbulence" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
      </svg>

      <div className={styles.grid} style={{ width: gridWidth, height: gridHeight }}>
        {/* SVG Lines */}
        <svg
          className={styles.linesSvg}
          width={gridWidth}
          height={gridHeight}
          viewBox={`0 0 ${gridWidth} ${gridHeight}`}
        >
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={styles.gridLine}
              style={{ animationDelay: `${line.delay}s` }}
            />
          ))}
          {tiles.map((tile) => (
            <circle
              key={`dot-${tile.id}`}
              cx={tile.x + TILE_SIZE / 2}
              cy={tile.y + TILE_SIZE / 2}
              r={4}
              className={styles.nodeDot}
              style={{ animationDelay: `${tile.delay}s` }}
            />
          ))}
        </svg>

        {/* Watercolor Tiles - multiple blobs per tile */}
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={styles.tile}
            style={{
              left: tile.x,
              top: tile.y,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          >
            <div
              className={`${styles.watercolorLayer} ${styles.layer1}`}
              style={{
                '--color': tile.color,
                animationDelay: `${tile.delay + 1.5}s`,
                transform: `rotate(${tile.rotation}deg)`,
              } as React.CSSProperties}
            />
            <div
              className={`${styles.watercolorLayer} ${styles.layer2}`}
              style={{
                '--color-light': tile.colorLight,
                animationDelay: `${tile.delay + 1.8}s`,
                transform: `rotate(${-tile.rotation * 0.7}deg)`,
              } as React.CSSProperties}
            />
            <div
              className={`${styles.watercolorLayer} ${styles.layer3}`}
              style={{
                '--color-dark': tile.colorDark,
                animationDelay: `${tile.delay + 1.6}s`,
                transform: `rotate(${tile.rotation * 0.5}deg)`,
              } as React.CSSProperties}
            />
            <div
              className={`${styles.watercolorLayer} ${styles.layer4}`}
              style={{
                '--color': tile.color,
                animationDelay: `${tile.delay + 2}s`,
                transform: `rotate(${tile.rotation * 1.2}deg)`,
              } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
