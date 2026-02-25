'use client';

import { useRef, useState, useEffect } from 'react';
import styles from './styles.module.css';

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = 1 - (e.clientY - rect.top) / rect.height;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className={styles.container}>
      <video
        ref={videoRef}
        className={styles.video}
        src="/4k2.mov"
        onTimeUpdate={handleTimeUpdate}
        loop
        muted
        autoPlay
        playsInline
      />

      <button
        className={styles.toggleButton}
        onClick={() => setShowControls(!showControls)}
      >
        <span className={styles.toggleIcon}>{showControls ? '−' : '+'}</span>
      </button>

      {showControls && (
        <div className={styles.controls}>
          <button className={styles.controlButton} onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className={styles.progressContainer} onClick={handleProgressClick}>
            <div className={styles.progressBar}>
              <div className={styles.progress} style={{ height: `${progress}%` }} />
            </div>
          </div>
          <button className={styles.controlButton} onClick={toggleMute}>
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      )}
    </div>
  );
}
