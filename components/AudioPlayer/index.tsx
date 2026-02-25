'use client';

import { useState } from 'react';
import { Song, Track, Instrument, StepType } from 'reactronica';
import styles from './styles.module.css';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const [useSynth, setUseSynth] = useState(false);

  // Steps for sampler - each step triggers a sample mapped to a note
  const steps: StepType[] = [
    [{ name: 'C3', duration: 1 }],  // SCAN
    null,
    [{ name: 'D3', duration: 1 }],  // CHECK
    null,
    [{ name: 'E3', duration: 1 }],  // TRUST
    null,
    [{ name: 'F3', duration: 1 }],  // TABULAS
    null,
  ];

  const stepLabels = ['SCAN', '', 'CHECK', '', 'TRUST', '', 'TABULAS', ''];

  // Map notes to sample files - put your .wav or .mp3 files in /public/samples/
  const samples = {
    C3: '/samples/scan.wav',
    D3: '/samples/check.wav',
    E3: '/samples/trust.wav',
    F3: '/samples/tabulas.wav',
  };

  const handlePlay = () => {
    if (!useSynth && !samplesLoaded) {
      alert('Samples not loaded yet. Switch to Synth mode or add sample files.');
      return;
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles.container}>
      <Song isPlaying={isPlaying} bpm={60}>
        <Track
          steps={steps}
          onStepPlay={(_, index) => {
            setCurrentStep(index);
          }}
        >
          {useSynth ? (
            <Instrument type="synth" />
          ) : (
            <Instrument
              type="sampler"
              samples={samples}
              onLoad={() => setSamplesLoaded(true)}
            />
          )}
        </Track>
      </Song>

      <div className={styles.controls}>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${useSynth ? '' : styles.activeMode}`}
            onClick={() => { setUseSynth(false); setIsPlaying(false); }}
          >
            SAMPLER
          </button>
          <button
            className={`${styles.modeButton} ${useSynth ? styles.activeMode : ''}`}
            onClick={() => { setUseSynth(true); setIsPlaying(false); }}
          >
            SYNTH
          </button>
        </div>

        <div className={styles.status}>
          {useSynth ? 'SYNTH MODE' : (samplesLoaded ? 'SAMPLES LOADED' : 'WAITING FOR SAMPLES...')}
        </div>

        <button
          className={styles.playButton}
          onClick={handlePlay}
        >
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>

        <div className={styles.steps}>
          {stepLabels.map((label, i) => (
            <div
              key={i}
              className={`${styles.step} ${currentStep === i ? styles.active : ''} ${!label ? styles.empty : ''}`}
            >
              {label}
            </div>
          ))}
        </div>

        {!useSynth && (
          <div className={styles.info}>
            Add samples to /public/samples/<br/>
            scan.wav, check.wav, trust.wav, tabulas.wav
          </div>
        )}
      </div>
    </div>
  );
}
