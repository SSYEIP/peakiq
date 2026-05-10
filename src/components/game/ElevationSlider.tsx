'use client';

import React, { useCallback, useMemo } from 'react';
import styles from './ElevationSlider.module.css';

const MIN_ELEVATION = -427;
const MAX_ELEVATION = 8849;
const RANGE = MAX_ELEVATION - MIN_ELEVATION;

interface Landmark {
  elevation: number;
  label: string;
  icon: string;
}

const LANDMARKS: Landmark[] = [
  { elevation: -427, label: 'Dead Sea', icon: '💧' },
  { elevation: 0, label: 'Sea Level', icon: '🌊' },
  { elevation: 1609, label: 'Denver', icon: '🏙️' },
  { elevation: 5364, label: 'Everest BC', icon: '⛺' },
  { elevation: 8849, label: 'Everest', icon: '🏔️' },
];

function elevationToPercent(elevation: number): number {
  return ((elevation - MIN_ELEVATION) / RANGE) * 100;
}

function getGradientForPercent(pct: number): string {
  // Blue (sea/below) -> Green (mid altitude) -> Red (high altitude)
  if (pct < 5) return '#38bdf8'; // topo-blue
  if (pct < 30) {
    const t = (pct - 5) / 25;
    const r = Math.round(56 + (74 - 56) * t);
    const g = Math.round(189 + (222 - 189) * t);
    const b = Math.round(248 + (128 - 248) * t);
    return `rgb(${r},${g},${b})`;
  }
  if (pct < 70) {
    const t = (pct - 30) / 40;
    const r = Math.round(74 + (248 - 74) * t);
    const g = Math.round(222 + (113 - 222) * t);
    const b = Math.round(128 + (113 - 128) * t);
    return `rgb(${r},${g},${b})`;
  }
  return '#f87171'; // topo-red
}

interface ElevationSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ElevationSlider({ value, onChange, disabled = false }: ElevationSliderProps) {
  const percent = useMemo(() => elevationToPercent(value), [value]);
  const thumbColor = useMemo(() => getGradientForPercent(percent), [percent]);
  const trackGradient = useMemo(() => {
    return `linear-gradient(to right, 
      #38bdf8 0%, 
      #4ade80 ${elevationToPercent(1500)}%, 
      #fbbf24 ${elevationToPercent(3500)}%, 
      #f87171 100%
    )`;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value, 10));
    },
    [onChange]
  );

  const formattedValue = value >= 0 ? `+${value.toLocaleString()}m` : `${value.toLocaleString()}m`;

  return (
    <div className="space-y-4 select-none">
      {/* Current value display */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-mono uppercase tracking-wider">
          Your Guess
        </span>
        <span
          className="text-2xl font-bold font-mono transition-colors duration-200"
          style={{ color: thumbColor }}
        >
          {formattedValue}
        </span>
      </div>

      {/* Slider track */}
      <div className={styles.sliderWrapper}>
        <div
          className={styles.track}
          style={{ background: trackGradient }}
        />
        <div
          className={styles.trackFill}
          style={{
            width: `${percent}%`,
            background: `linear-gradient(to right, #38bdf8, ${thumbColor})`,
          }}
        />
        <input
          type="range"
          min={MIN_ELEVATION}
          max={MAX_ELEVATION}
          step={1}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
          aria-label="Elevation guess in metres"
          aria-valuemin={MIN_ELEVATION}
          aria-valuemax={MAX_ELEVATION}
          aria-valuenow={value}
          aria-valuetext={formattedValue}
        />
        {/* Thumb glow indicator */}
        <div
          className={styles.thumbGlow}
          style={{
            left: `${percent}%`,
            background: thumbColor,
            boxShadow: `0 0 20px ${thumbColor}80`,
          }}
        />
      </div>

      {/* Landmark ticks */}
      <div className="relative h-8">
        {LANDMARKS.map((lm) => {
          const pct = elevationToPercent(lm.elevation);
          return (
            <button
              key={lm.label}
              type="button"
              onClick={() => !disabled && onChange(lm.elevation)}
              disabled={disabled}
              className="absolute -translate-x-1/2 flex flex-col items-center gap-0.5 group cursor-pointer disabled:cursor-default"
              style={{ left: `${pct}%` }}
              title={`${lm.label}: ${lm.elevation}m`}
            >
              <div
                className="w-px h-2 bg-charcoal-700 group-hover:bg-amber-400 transition-colors"
              />
              <span className="text-[9px] font-mono text-gray-500 group-hover:text-amber-400 transition-colors whitespace-nowrap">
                {lm.icon} {lm.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
