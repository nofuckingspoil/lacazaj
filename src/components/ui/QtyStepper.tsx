'use client';

import Icon from './Icon';

interface QtyStepperProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}

export default function QtyStepper({ value, onChange, step = 3 }: QtyStepperProps) {
  return (
    <div className="stepper">
      <span className="stepper-label">par {step} · {value} nem{value > 1 ? 's' : ''}</span>
      <div className="stepper-ctrls">
        <button
          className="step-btn"
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - step))}
          aria-label="Retirer"
        >
          <Icon name="minus" size={20} />
        </button>
        <span className="step-val">{value}</span>
        <button
          className="step-btn"
          onClick={() => onChange(value + step)}
          aria-label="Ajouter"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>
    </div>
  );
}
