'use client';

import React from 'react';

interface PhotoProps {
  label: string;
  className?: string;
  style?: React.CSSProperties;
  tint?: string;
}

export default function Photo({ label, className = '', style = {}, tint }: PhotoProps) {
  return (
    <div className={`ph ${className}`} style={style}>
      {tint && <div style={{ position: 'absolute', inset: 0, background: tint, opacity: 0.14 }} />}
      <span className="ph-label">{label}</span>
    </div>
  );
}
