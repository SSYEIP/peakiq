import React from 'react';
import styles from './TopoBackground.module.css';

export function TopoBackground() {
  return (
    <div className={styles.container} aria-hidden="true">
      <svg
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>{`
            .topo-line { fill: none; stroke-width: 1; opacity: 0.15; }
          `}</style>
        </defs>
        {/* Animated contour rings */}
        {[...Array(12)].map((_, i) => (
          <ellipse
            key={i}
            className="topo-line"
            cx="400"
            cy="300"
            rx={60 + i * 55}
            ry={40 + i * 37}
            stroke={i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#38bdf8' : '#4ade80'}
          />
        ))}
        {/* Secondary set offset */}
        {[...Array(8)].map((_, i) => (
          <ellipse
            key={`b${i}`}
            className="topo-line"
            cx="650"
            cy="150"
            rx={30 + i * 40}
            ry={20 + i * 28}
            stroke={i % 2 === 0 ? '#fbbf24' : '#38bdf8'}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <ellipse
            key={`c${i}`}
            className="topo-line"
            cx="150"
            cy="480"
            rx={20 + i * 35}
            ry={15 + i * 25}
            stroke={i % 2 === 0 ? '#4ade80' : '#fbbf24'}
          />
        ))}
      </svg>
    </div>
  );
}
