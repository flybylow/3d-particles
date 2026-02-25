'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import styles from './styles.module.css';

interface SequenceItem {
  word: string | null;
  color: string;
  duration: number;
  scale: boolean;
}

const SEQUENCE: SequenceItem[] = [
  { word: null, color: '#FFFFFF', duration: 600, scale: false },
  { word: 'SCAN', color: '#FFFFFF', duration: 1000, scale: true },
  { word: null, color: '#FFFFFF', duration: 80, scale: false },
  { word: 'CHECK', color: '#FFFFFF', duration: 1000, scale: true },
  { word: null, color: '#FFFFFF', duration: 80, scale: false },
  { word: 'TRUST', color: '#88927D', duration: 1000, scale: true },
  { word: null, color: '#FFFFFF', duration: 80, scale: false },
  { word: 'TABULAS', color: '#FFFFFF', duration: 1500, scale: false },
];

export default function ScanCheckTrust() {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playKey, setPlayKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const isPlaying = currentIndex >= 0;
  const current = isPlaying ? SEQUENCE[currentIndex] : null;

  useEffect(() => {
    if (currentIndex < 0) return;
    if (currentIndex >= SEQUENCE.length) return;

    const timer = setTimeout(() => {
      if (currentIndex < SEQUENCE.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, SEQUENCE[currentIndex].duration);

    return () => clearTimeout(timer);
  }, [currentIndex, playKey]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 30;
    const y = (e.clientY - rect.top - rect.height / 2) / 30;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleStart = useCallback(() => {
    setPlayKey(k => k + 1);
    setCurrentIndex(0);
  }, []);

  if (!isPlaying) {
    return (
      <div className={styles.container} onClick={handleStart} ref={containerRef}>
        <motion.span
          className={styles.startPrompt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Click to start
        </motion.span>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      onClick={handleStart}
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      <AnimatePresence mode="wait">
        {current?.word && (
          <motion.span
            key={`${playKey}-${currentIndex}`}
            className={styles.word}
            style={{
              color: current.color,
              x: springX,
              y: springY,
            }}
            initial={
              current.scale
                ? { scale: 1.15, opacity: 0, filter: 'blur(8px)' }
                : { opacity: 0, filter: 'blur(4px)' }
            }
            animate={
              current.scale
                ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
                : { opacity: 1, filter: 'blur(0px)' }
            }
            exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.95 }}
            transition={{
              duration: 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {current.word}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
