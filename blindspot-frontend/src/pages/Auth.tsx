import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/Button";

export function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! Signing you in…");
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError) navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 100 100" fill="white">
                <path d="M10 50 C25 20, 75 20, 90 50 C75 80, 25 80, 10 50 Z" />
                <circle cx="50" cy="50" r="13" fill="#9cf2e8" />
                <circle cx="55" cy="44" r="4" fill="white" opacity="0.65" />
              </svg>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-on-surface">BlindSpot</span>
          </div>
          <p className="text-sm text-on-surface-variant">
            AI decision intelligence for your career moves
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-surface-container rounded-xl p-1 border border-border-mock">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); setMessage(null); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "signin" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === "signup" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border-mock rounded-2xl p-6 space-y-4 shadow-sm">
          {error && (
            <div className="bg-risk-bg border border-red-200 rounded-xl p-3 text-sm text-red-900 font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-900 font-medium">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest
                         px-4 py-3 text-sm text-on-surface placeholder:text-outline/60
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                         transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest
                         px-4 py-3 text-sm text-on-surface placeholder:text-outline/60
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                         transition-colors"
            />
            {mode === "signup" && (
              <p className="text-xs text-on-surface-variant">Minimum 6 characters</p>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-on-surface-variant">
          Your decisions are private and tied to your account.
        </p>
      </div>
    </div>
  );
}
