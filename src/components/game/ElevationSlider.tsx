'use client';

import React, { useCallback, useMemo } from 'react';
import styles from './ElevationSlider.module.css';
import { MIN_ELEVATION, MAX_ELEVATION } from '@/lib/constants';
import type { Unit } from './GameOrchestrator';

const RANGE = MAX_ELEVATION - MIN_ELEVATION;

function toFt(m: number) { return Math.round(m * 3.28084); }
function formatElev(m: number, unit: Unit): string {
  if (unit === 'ft') {
    const ft = toFt(m);
    return ft >= 0 ? `+${ft.toLocaleString()}ft` : `${ft.toLocaleString()}ft`;
  }
  return m >= 0 ? `+${m.toLocaleString()}m` : `${m.toLocaleString()}m`;
}

interface Landmark {
  elevation: number;
  label: string;
  icon: string;
}

const LANDMARKS: Landmark[] = [
  { elevation: 0,    label: 'Sea Level',  icon: '〰' },
  { elevation: 1609, label: 'Mile High',  icon: '◆' },
  { elevation: 5364, label: 'Base Camp',  icon: '▲' },
  { elevation: 8849, label: 'Summit',     icon: '⬛' },
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
  unit?: Unit;
}

export function ElevationSlider({ value, onChange, disabled = false, unit = 'm' }: ElevationSliderProps) {
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
          {formatElev(value, unit)}
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
          aria-valuetext={formatElev(value, unit)}
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

      {/* Landmark ticks — alternating above/below to prevent crowding */}
      <div className="relative h-10 mt-1">
        {LANDMARKS.map((lm, i) => {
          const pct = elevationToPercent(lm.elevation);
          const above = i % 2 === 0;
          return (
            <button
              key={lm.label}
              type="button"
              onClick={() => !disabled && onChange(lm.elevation)}
              disabled={disabled}
              className="absolute -translate-x-1/2 flex flex-col items-center gap-0 group cursor-pointer disabled:cursor-default"
              style={{ left: `${pct}%`, top: above ? 0 : '50%' }}
              title={`${lm.label}: ${lm.elevation >= 0 ? '+' : ''}${lm.elevation}m`}
            >
              <div className="w-px h-2 bg-charcoal-600 group-hover:bg-amber-400 transition-colors" />
              <span className="text-[10px] font-mono text-gray-500 group-hover:text-amber-400 transition-colors whitespace-nowrap leading-tight">
                {lm.label}
              </span>
              <span className="text-[9px] font-mono text-gray-600 group-hover:text-amber-500 transition-colors whitespace-nowrap leading-tight">
                {formatElev(lm.elevation, unit)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
