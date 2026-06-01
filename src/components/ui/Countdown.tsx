'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';

interface CountdownProps {
  deadline: number;
  compact?: boolean;
}

function useNow(active = true) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return Date.now();
}

export default function Countdown({ deadline, compact = false }: CountdownProps) {
  const now = useNow();
  let diff = Math.max(0, deadline - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (deadline - now <= 0) {
    return <span className="badge badge-late">Trop tard</span>;
  }

  if (compact) {
    const txt = d > 0 ? `Plus que ${d}j ${pad(h)}h` : `Plus que ${pad(h)}h${pad(m)}`;
    return <span className="badge badge-low"><Icon name="clock" size={13} /> {txt}</span>;
  }

  const unit = (val: number, lbl: string) => (
    <div className="cd-stack">
      <span className="cd-box">{pad(val)}</span>
      <span className="cd-unit">{lbl}</span>
    </div>
  );

  return (
    <div className="cd">
      {d > 0 && <>{unit(d, 'jours')}<span className="cd-sep">:</span></>}
      {unit(h, 'h')}<span className="cd-sep">:</span>
      {unit(m, 'min')}<span className="cd-sep">:</span>
      {unit(s, 'sec')}
    </div>
  );
}
