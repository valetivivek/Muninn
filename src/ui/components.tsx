// Shared, accessible UI primitives for Muninn. Small and dependency-light;
// every interactive element is keyboard-reachable and labelled.

import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'mn-btn-primary',
  ghost: 'mn-btn-ghost',
  subtle: 'mn-btn-subtle',
  danger: 'mn-btn-danger',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'subtle', className = '', ...props }, ref) => (
    <button ref={ref} className={`mn-btn ${VARIANTS[variant]} ${className}`} {...props} />
  ),
);
Button.displayName = 'Button';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export function IconButton({ label, active, className = '', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text active:scale-90 ${active ? 'text-accent' : ''} ${className}`}
      {...props}
    />
  );
}

export function TextInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`mn-input ${className}`} {...props} />;
}

export function TextArea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`mn-input resize-y leading-relaxed ${className}`} {...props} />;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Accessible segmented control (radio-group semantics). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-0.5 rounded-xl border border-border bg-surface-2 p-1"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-[color,background-color,transform] duration-150 active:scale-95 ${
              selected
                ? 'bg-accent text-accent-ink shadow-panel-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${
        checked ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'left-[1.125rem]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-accent/15 px-1.5 py-0.5 text-2xs font-medium text-accent">
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint: string;
}

/** Friendly empty state — never a blank panel. */
export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <div className="text-accent/80">{icon}</div>}
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="max-w-[16rem] text-xs text-muted">{hint}</p>
    </div>
  );
}

/** Shimmering placeholder rows that match the card layout during load. */
export function CardSkeleton() {
  return (
    <div className="mn-panel rounded-xl p-3" aria-hidden="true">
      <div className="mn-skeleton h-4 w-2/3 rounded" />
      <div className="mt-2 flex gap-1.5">
        <div className="mn-skeleton h-3 w-10 rounded" />
        <div className="mn-skeleton h-3 w-12 rounded" />
      </div>
    </div>
  );
}

/** Renders raw markdown for card previews. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="mn-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
