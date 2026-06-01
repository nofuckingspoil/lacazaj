'use client';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}

export default function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8, fill = 'none' }: IconProps) {
  const p = { fill, stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  const paths: Record<string, React.ReactNode> = {
    insta: <><rect x="3" y="3" width="18" height="18" rx="5" {...p} /><circle cx="12" cy="12" r="4" {...p} /><circle cx="17.3" cy="6.7" r="0.6" fill={color} stroke="none" /></>,
    clock: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 7.5V12l3 2" {...p} /></>,
    pin: <><path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11Z" {...p} /><circle cx="12" cy="10" r="2.6" {...p} /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...p} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    minus: <path d="M5 12h14" {...p} />,
    chevR: <path d="M9 5l7 7-7 7" {...p} />,
    chevL: <path d="M15 5l-7 7 7 7" {...p} />,
    chevD: <path d="M5 9l7 7 7-7" {...p} />,
    mint: <><path d="M12 21c0-6 3-10 8-11-1 7-4 10-8 11Z" {...p} /><path d="M12 21c0-6-3-10-8-11 1 7 4 10 8 11Z" {...p} /><path d="M12 21v-7" {...p} /></>,
    flame: <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.6.7-2.8 1.4-3.6.2 1 .8 1.8 1.6 2.1 0-2.3.9-5.3 2-7.5Z" {...p} />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...p} />,
    lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" {...p} /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...p} /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...p} /><path d="M4 7l8 6 8-6" {...p} /></>,
    phone: <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L19 16l4 1.5V20a2 2 0 0 1-2 2A16 16 0 0 1 5 6a2 2 0 0 1 0-2Z" transform="translate(-1 -1)" {...p} />,
    info: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 11v5M12 8h.01" {...p} /></>,
    star: <path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.9 6.9 19.2 8 13.5l-4.3-4 5.8-.7L12 3.5Z" {...p} />,
    user: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...p} /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" {...p} /><path d="M10 19a2 2 0 0 0 4 0" {...p} /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...p} /><path d="M3 9.5h18" {...p} /></>,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2.5" {...p} /><path d="M4 9.5h16M8 3v4M16 3v4" {...p} /></>,
    sparkle: <path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4L12 4Z" {...p} />,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
}
