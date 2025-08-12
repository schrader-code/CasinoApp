import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveSession } from "../lib/auth";
import { api } from "../lib/api";
import "../styles/login.css";

function LogoFlash() {
  return (
    <div className="logo-wrap" aria-hidden>
      <svg className="logo-svg" viewBox="0 0 700 180" role="img">
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffd166" />
            <stop offset="50%" stopColor="#ff7a3c" />
            <stop offset="100%" stopColor="#ff3b3b" />
          </linearGradient>
          <linearGradient id="grad-stroke" x1="0" x2="1">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#glow)">
          <text x="50%" y="55%" textAnchor="middle" className="logo-fill">CASINO</text>
          <text x="50%" y="55%" textAnchor="middle" className="logo-stroke">CASINO</text>
        </g>
        <text x="50%" y="90%" textAnchor="middle" className="logo-sub">Arcade Edition</text>
      </svg>
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();

  // tabs: "login" | "register"
  const [mode, setMode] = useState<"login" | "register">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = username.trim().length >= 3 && password.length >= 3 && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setErr(null);

    try {
      if (mode === "login") {
        // LOGIN
        const { data } = await api.post("/auth/login", { username, password });
        const token: string = data?.token;
        const user = data?.user;
        if (!token || !user) throw new Error("Respuesta inválida del servidor");
        saveSession(token, user);
        nav("/lobby");
        return;
      } else {
        // REGISTER → si ok, auto-login
        const reg = await api.post("/auth/register", { username, password });
        if (!reg?.data?.ok) throw new Error("No se pudo registrar");

        const { data } = await api.post("/auth/login", { username, password });
        const token: string = data?.token;
        const user = data?.user;
        if (!token || !user) throw new Error("Registro ok, pero no se pudo iniciar sesión");
        saveSession(token, user);
        nav("/lobby");
        return;
      }
    } catch (error: any) {
      // mensajes más claros
      const msg =
        error?.response?.data?.error === "user exists"
          ? "Ese usuario ya existe"
          : error?.response?.data?.error ||
            error?.message ||
            "Ocurrió un error";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <LogoFlash />

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${mode === "login" ? "tab--active" : ""}`}
            onClick={() => setMode("login")}
            disabled={loading}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`tab ${mode === "register" ? "tab--active" : ""}`}
            onClick={() => setMode("register")}
            disabled={loading}
          >
            Crear cuenta
          </button>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="user">Usuario</label>
            <input
              id="user"
              autoComplete="username"
              placeholder="Tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pass">Contraseña</label>
            <div className="pass-wrap">
              <input
                id="pass"
                type={showPass ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {mode === "register" && (
              <div className="hint" style={{ marginTop: 6 }}>
                Mínimo 3 caracteres (demo). Se creará con saldo inicial de $1000.
              </div>
            )}
          </div>

          {err && <div className="error">{err}</div>}

          <div className="actions">
            <button className="btn primary" type="submit" disabled={!canSubmit}>
              {loading ? (mode === "login" ? "Entrando…" : "Creando…") : (mode === "login" ? "Iniciar sesión" : "Crear cuenta")}
            </button>
          </div>
        </form>

        <div className="login-footer">
          <span className="hint">
            {mode === "login"
              ? "¿No tienes cuenta? Cambia a 'Crear cuenta'."
              : "¿Ya tienes cuenta? Cambia a 'Iniciar sesión'."}
          </span>
        </div>
      </div>
    </div>
  );
}
