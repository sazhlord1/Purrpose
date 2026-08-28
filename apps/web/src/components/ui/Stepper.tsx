import { Chip } from './Chip.js';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

export function Stepper({ value, onChange, min = 1, max = 9999, ariaLabel }: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <span className="stepper" role="group" aria-label={ariaLabel ?? 'amount'}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="decrease"
      >
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="increase"
      >
        +
      </button>
    </span>
  );
}

const QUICK_CHIPS = [1, 3, 5, 10];

export function AmountPicker({
  value,
  onChange,
  max = 9999,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Stepper value={value} onChange={onChange} max={max} />
      {QUICK_CHIPS.filter(q => q <= max).map(q => (
        <Chip key={q} active={value === q} onClick={() => onChange(q)}>
          {q}
        </Chip>
      ))}
    </div>
  );
}
