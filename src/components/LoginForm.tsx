"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, body: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (step === "email") {
          if (await call("/api/auth/request", { email })) setStep("code");
        } else {
          const r = await call("/api/auth/verify", { email, code });
          if (r) window.location.href = r.role === "admin" ? "/admin" : "/app";
        }
      }}
    >
      {step === "email" ? (
        <label className="label">
          Email
          <input
            className="input"
            type="email"
            required
            autoFocus
            placeholder="you@example.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      ) : (
        <label className="label">
          Код из письма на {email}
          <input
            className="input text-center font-display text-2xl tracking-[0.4em]"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            required
            placeholder="······"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
      )}
      {error && <div className="text-sm text-danger">{error}</div>}
      <button disabled={busy} className="btn w-full">
        {step === "email" ? "Получить код" : "Войти"}
        <ArrowRight className="h-4 w-4" />
      </button>
      {step === "code" && (
        <button type="button" className="text-sm text-muted hover:text-fg" onClick={() => setStep("email")}>
          Изменить email
        </button>
      )}
    </form>
  );
}
