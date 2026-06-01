'use client';

import { Slot } from '@/lib/data';

interface SlotPickerProps {
  slots: Slot[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function SlotPicker({ slots, selected, onSelect }: SlotPickerProps) {
  return (
    <div className="slots">
      {slots.map((s) => {
        const full = s.count >= s.max;
        const sel = selected === s.id;
        return (
          <button
            key={s.id}
            className={`slot ${full ? 'full' : ''} ${sel ? 'sel' : ''}`}
            disabled={full}
            onClick={() => !full && onSelect(s.id)}
          >
            {s.label}
            <small>{full ? 'complet' : `${s.max - s.count} place${s.max - s.count > 1 ? 's' : ''}`}</small>
          </button>
        );
      })}
    </div>
  );
}
