import React from "react";
import { NavLink, Outlet, useMatch } from "react-router-dom";
import { getUserName } from "../utils/session";

// ── Brand icons ────────────────────────────────────────────────────────────

const EyeIcon = () => (
  // eye-blink / pupil-look are defined in index.css
  <svg
    width="18"
    height="18"
    viewBox="0 0 100 100"
    fill="white"
    aria-hidden="true"
    className="eye-blink"
    style={{ transformOrigin: "center" }}
  >
    <path d="M10 50 C25 20, 75 20, 90 50 C75 80, 25 80, 10 50 Z" />
    <circle cx="50" cy="50" r="13" fill="#9cf2e8" className="pupil-look" />
    <circle cx="55" cy="44" r="4" fill="white" opacity="0.65" />
  </svg>
);

// ── Nav icons — stroke="currentColor" so they inherit text colour ──────────

const IconHome = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <polyline points="9 21 9 12 15 12 15 21" />
  </svg>
);

const IconAnalyze = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconDecisions = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconAdvisor = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ── Nav item definitions ───────────────────────────────────────────────────

const navItems = [
  { to: "/", label: "Home", Icon: IconHome, end: true },
  { to: "/analyze", label: "Analyze", Icon: IconAnalyze, end: false },
  { to: "/decisions", label: "My Decisions", Icon: IconDecisions, end: false },
  { to: "/advisor", label: "Advisor Hub", Icon: IconAdvisor, end: false },
] as const;

// ── Bottom nav item — uses useMatch so icons inherit colour correctly ───────

function BottomNavItem({
  to,
  label,
  Icon,
  end,
}: {
  to: string;
  label: string;
  Icon: React.FC;
  end: boolean;
}) {
  const match = useMatch({ path: to, end });
  const active = !!match;

  return (
    <NavLink
      to={to}
      end={end}
      className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl
         transition-colors min-w-0
         ${active ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-primary hover:bg-primary/10"}`}
    >
      <Icon />
      <span className="text-[10px] font-semibold leading-none tracking-wide">
        {label}
      </span>
    </NavLink>
  );
}

// ── Avatar badge — derives initials from stored name ────────────────────────

function AvatarBadge() {
  const name = getUserName();
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BS";
  return (
    <div
      className="w-9 h-9 rounded-full bg-secondary-container
                 flex items-center justify-center shrink-0
                 text-xs font-bold text-on-secondary-container select-none"
      title={name || "BlindSpot"}
    >
      {initials}
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* ── Top App Bar ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 h-16
                         flex items-center justify-between
                         px-6 border-b border-outline-variant
                         bg-surface-container-lowest/90 backdrop-blur-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center
                          shadow-sm shadow-primary/20"
          >
            <EyeIcon />
          </div>
          <span className="font-display font-bold text-[17px] tracking-tight text-on-surface">
            BlindSpot
          </span>
        </div>

        {/* Desktop nav — absolutely centred so it sits in the true middle of the screen */}
        <nav
          className="hidden md:flex items-center gap-0.5
                     absolute left-1/2 -translate-x-1/2"
          aria-label="Main navigation"
        >
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-on-surface-variant hover:text-primary hover:bg-primary/10"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Avatar — shows user's initials if name is stored, otherwise initials placeholder */}
        <AvatarBadge />
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      {/* pb-24 leaves room above the mobile bottom nav */}
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* ── Bottom Nav — visible only on mobile ──────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-50
                   flex items-center justify-around
                   h-16 px-2
                   bg-surface-container-lowest border-t border-outline-variant
                   md:hidden"
      >
        {navItems.map(({ to, label, Icon, end }) => (
          <BottomNavItem key={to} to={to} label={label} Icon={Icon} end={end} />
        ))}
      </nav>
    </div>
  );
}
