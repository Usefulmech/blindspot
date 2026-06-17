// ── Session ID (anonymous, persisted) ────────────────────────────────────
export function getSessionId(): string {
  let id = localStorage.getItem("blindspot_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("blindspot_session", id);
  }
  return id;
}

// ── User display name ─────────────────────────────────────────────────────
export function getUserName(): string {
  return localStorage.getItem("blindspot_user_name") ?? "";
}
export function setUserName(name: string): void {
  localStorage.setItem("blindspot_user_name", name.trim());
}

// ── Last-used persona ─────────────────────────────────────────────────────
export type Persona = "student" | "professional" | "freelancer";

export function getUserPersona(): Persona {
  const stored = localStorage.getItem("blindspot_persona");
  if (stored === "student" || stored === "freelancer") return stored;
  return "professional"; // default
}
export function setUserPersona(p: Persona): void {
  localStorage.setItem("blindspot_persona", p);
}
