"use client";

import { FormEvent, useState } from "react";

export function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setBusy(false);
    if (!response.ok) {
      setError("Password invalido.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="login-wrap">
      <form className="panel login" onSubmit={submit}>
        <div className="sigil" aria-hidden="true">
          <span />
        </div>
        <h1>Video Web</h1>
        <p>The Secret Books creator</p>
        <div className="field">
          <label htmlFor="password">Password de acceso</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <div className="error">{error}</div> : null}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
