/* eslint-disable react-refresh/only-export-components */
import { type HTMLAttributes, type ReactNode } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * default   – white card, 1px outline border (standard data / content card)
 * elevated  – default + hover lift + ambient shadow (interactive / clickable cards)
 * glass     – frosted glass effect (used on overlays / auth)
 * inverse   – dark ink background (CTA banners, export modules)
 * feature   – teal primary-container background (hero CTA sections)
 */
export type CardVariant =
  | "default"
  | "elevated"
  | "glass"
  | "inverse"
  | "feature";

// ─────────────────────────────────────────────
// Root – CardRoot
// ─────────────────────────────────────────────
interface CardRootProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

function CardRoot({
  variant = "default",
  className = "",
  children,
  ...props
}: CardRootProps) {
  const base = "rounded-xl overflow-hidden";

  const variants: Record<CardVariant, string> = {
    default: "bg-surface-container-lowest border border-outline-variant",

    elevated:
      "bg-surface-container-lowest border border-outline-variant " +
      "transition-all duration-300 ease-out " +
      "hover:-translate-y-1 hover:shadow-[0px_8px_24px_rgba(13,28,45,0.08)] " +
      "cursor-pointer",

    glass: "bg-white/80 backdrop-blur-xl border border-white/60 " + "shadow-sm",

    inverse:
      "bg-inverse-surface text-inverse-on-surface relative overflow-hidden",

    feature: "bg-primary-container text-white relative overflow-hidden",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Header – contains title + optional actions row
// ─────────────────────────────────────────────
function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pt-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Title
// ─────────────────────────────────────────────
function CardTitle({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display font-semibold text-[18px] leading-[26px] tracking-tight text-on-surface ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

// ─────────────────────────────────────────────
// Description
// ─────────────────────────────────────────────
function CardDescription({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`mt-1.5 text-sm leading-relaxed text-on-surface-variant ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────
// Body – main content padding area
// ─────────────────────────────────────────────
function CardBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Footer – actions / metadata row
// ─────────────────────────────────────────────
function CardFooter({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 pb-6 pt-4 border-t border-outline-variant flex items-center gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Decorative background blob for inverse / feature
// ─────────────────────────────────────────────
interface CardDecorProps {
  /** Extra className for positioning / size overrides */
  className?: string;
}

function CardDecor({ className = "" }: CardDecorProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full opacity-10 ${className}`}
    />
  );
}

// ─────────────────────────────────────────────
// Chip / Badge helper (used inside cards)
// ─────────────────────────────────────────────
interface CardChipProps {
  children: ReactNode;
  /** Colour tone – maps to tailwind bg */
  tone?: "primary" | "secondary" | "error" | "surface";
  className?: string;
}

function CardChip({
  children,
  tone = "primary",
  className = "",
}: CardChipProps) {
  const tones: Record<string, string> = {
    primary: "bg-primary-container text-white",
    secondary: "bg-secondary-container text-on-secondary-container",
    error: "bg-error-container text-on-error-container",
    surface: "bg-surface-container-highest text-on-surface-variant",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// Compose & export
// ─────────────────────────────────────────────
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
  Decor: CardDecor,
  Chip: CardChip,
});
