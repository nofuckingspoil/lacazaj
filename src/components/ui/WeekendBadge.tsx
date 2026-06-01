'use client';

import { Weekend } from '@/lib/data';

interface WeekendBadgeProps {
  wk: Weekend;
}

export default function WeekendBadge({ wk }: WeekendBadgeProps) {
  if (wk.status === 'full') {
    return <span className="badge badge-full">Complet</span>;
  }
  if (wk.stockLeft <= 40) {
    return <span className="badge badge-low"><span className="dot" />Il reste {wk.stockLeft} nems</span>;
  }
  return <span className="badge badge-stock"><span className="dot" />Il reste {wk.stockLeft} nems</span>;
}
