"use client";

import { useState } from "react";

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

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500";
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
        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      ) : (
        <label className="grid gap-1.5 text-sm font-medium">
          Код из письма на {email}
          <input
            className={input + " tracking-widest"}
            inputMode="numeric"
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button disabled={busy} className="rounded-lg bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-50">
        {step === "email" ? "Получить код" : "Войти"}
      </button>
      {step === "code" && (
        <button type="button" className="text-sm text-slate-500" onClick={() => setStep("email")}>
          Изменить email
        </button>
      )}
    </form>
  );
}
