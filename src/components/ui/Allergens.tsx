'use client';

interface AllergensProps {
  list: string[];
}

export default function Allergens({ list }: AllergensProps) {
  return (
    <div className="prod-allerg" aria-label="Allergènes">
      {list.map((a) => (
        <span key={a} className="allergen">{a}</span>
      ))}
    </div>
  );
}
