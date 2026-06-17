import { type ButtonHTMLAttributes, type ReactNode } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to "primary". */
  variant?: ButtonVariant;
  /** Height / padding preset. Defaults to "md". */
  size?: ButtonSize;
  /** Icon rendered before label. */
  leftIcon?: ReactNode;
  /** Icon rendered after label. */
  rightIcon?: ReactNode;
  /** Shows a spinner and disables the button. */
  isLoading?: boolean;
  /** Stretches button to fill its container. */
  fullWidth?: boolean;
}

// ─────────────────────────────────────────────
// Spinner (inline, no external dep)
// ─────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  // ── Base ────────────────────────────────────
  // Design spec: active:scale-[0.98], no outline on click, disabled mutes opacity
  const base = [
    "inline-flex items-center justify-center gap-2",
    "font-display font-semibold tracking-tight",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-fixed",
    "active:scale-[0.97]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "select-none cursor-pointer",
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ── Sizes ───────────────────────────────────
  // Design uses rounded-2xl for md/lg, rounded-xl for sm
  const sizes: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-xs leading-4 rounded-xl",
    md: "px-6 py-3 text-[14px] leading-5 rounded-2xl",
    lg: "px-8 py-4 text-[14px] leading-5 rounded-2xl",
  };

  // ── Variants ────────────────────────────────
  // Design doc: "Primary Buttons: Solid Vibrant Teal Green (#0F766E) = primary-container"
  const variants: Record<ButtonVariant, string> = {
    // Solid Vibrant Teal Green -> Dark Green on hover
    primary:
      "bg-primary-container text-white " +
      "shadow-sm shadow-primary/10 " +
      "hover:bg-primary hover:shadow-md hover:shadow-primary/25",

    secondary:
      "bg-transparent border border-primary text-primary " +
      "hover:bg-primary hover:text-white active:scale-[0.97] transition-all",

    danger:
      "bg-error text-on-error " +
      "shadow-sm shadow-error/20 " +
      "hover:opacity-90",

    ghost: "bg-transparent text-on-surface " + "hover:bg-surface-container",

    inverse: "bg-inverse-surface text-inverse-on-surface " + "hover:opacity-90",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner />
          <span>Loading…</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="shrink-0 leading-none">{leftIcon}</span>
          )}
          {children}
          {rightIcon && (
            <span className="shrink-0 leading-none">{rightIcon}</span>
          )}
        </>
      )}
    </button>
  );
}
