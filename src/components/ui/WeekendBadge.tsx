'use client';

import { Weekend } from '@/lib/data';

interface WeekendBadgeProps {
  wk: Weekend;
  tooLate?: boolean;
}

export default function WeekendBadge({ wk, tooLate }: WeekendBadgeProps) {
  if (wk.status === 'full' || wk.stockLeft <= 0) {
    return <span className="badge badge-full">Épuisé</span>;
  }
  if (tooLate) {
    return <span className="badge badge-late">Trop tard</span>;
  }
  if (wk.stockLeft <= 40) {
    return <span className="badge badge-low"><span className="dot" />Il reste {wk.stockLeft} nems</span>;
  }
  return <span className="badge badge-stock"><span className="dot" />Il reste {wk.stockLeft} nems</span>;
}
