import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="field">
      <span>
        {label}
        {hint && <em className="muted"> · {hint}</em>}
      </span>
      {children}
      {error && (
        <div role="alert" style={{ color: 'var(--stamp-red)', fontSize: 13, marginTop: 4 }}>
          {error}
        </div>
      )}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}
