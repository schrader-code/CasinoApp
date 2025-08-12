import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getToken, clearSession, saveSession } from '../lib/auth';
import { useAuthGuard } from '../lib/useAuthGuard';
import GameCard from '../components/GameCard';
import '../styles/lobby.css';

export default function Lobby() {
  useAuthGuard();
  const nav = useNavigate();

  // Sesión y estado local
  const userRef = useRef(getUser());
  const tokenRef = useRef(getToken());

  const [username, setUsername] = useState<string>(
    userRef.current?.username ?? 'player'
  );
  const [balance, setBalance] = useState<number>(() =>
    Number(userRef.current?.balance ?? 0)
  );

  // Si el saldo cambió en otra pantalla, sincroniza al montar
  useEffect(() => {
    const u = getUser();
    if (u) {
      userRef.current = u;
      setUsername(u.username ?? 'player');
      setBalance(Number(u.balance ?? 0));
    }
  }, []);

  // Persistir saldo en la sesión + estado
  const persistBalance = (newBal: number) => {
    const user = userRef.current;
    const token = tokenRef.current;
    if (!user || !token) {
      alert('Inicia sesión primero.');
      return;
    }
    const updated = { ...user, balance: newBal };
    saveSession(token, updated);
    userRef.current = updated;
    setBalance(newBal);
  };

  // ─────────── Modal de Añadir saldo ───────────
  const [topupOpen, setTopupOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('100');

  const amountParsed = (() => {
    const n = Math.floor(Number(amountStr));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(1_000_000, n);
  })();

  const quickSet = (n: number) => setAmountStr(String(n));
  const quickAdd = (n: number) =>
    setAmountStr(String((amountParsed || 0) + n));

  const submitTopup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amountParsed <= 0) return;
    persistBalance(balance + amountParsed);
    setTopupOpen(false);
    setAmountStr('100');
  };

  // Esc cierra modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTopupOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="lobby-wrap">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
          <span className="chip">🎰</span>
          <h1>Casino App</h1>
        </div>
        <div className="actions">
          <span className="badge">👋 {username} • 🪙 ${balance.toFixed(2)}</span>
          <button className="btn" onClick={() => setTopupOpen(true)}>
            Añadir saldo
          </button>
          <button
            className="btn"
            onClick={() => {
              clearSession();
              nav('/');
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Bienvenida */}
      <section className="hero">
        <div>
          <h2>Lobby</h2>
          <p className="muted">Elige un juego para empezar.</p>
        </div>
        <div className="quick">
          <a className="btn primary" href="/roulette">
            Jugar Roulette
          </a>
        </div>
      </section>

      {/* Grid de juegos (se mantiene tu diseño e imágenes) */}
      <main className="lobby-grid">
        <GameCard
          to="/roulette"
          img="/assets/roulette/roulette_placeholder.png"
          title="Roulette"
          subtitle="Single-player"
        />
        <GameCard
          img="/assets/blackjack_placeholder.png"
          title="Blackjack"
          subtitle="(showcase only)"
          disabled
        />
      </main>

      {/* Modal Topup */}
      {topupOpen && (
        <div
          className="modal-overlay"
          onClick={() => setTopupOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Añadir saldo</div>
            <form className="topup-form" onSubmit={submitTopup}>
              <label className="topup-label">Monto</label>
              <input
                className="topup-input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountStr}
                onChange={(e) =>
                  setAmountStr(e.target.value.replace(/[^\d]/g, ''))
                }
                placeholder="100"
              />

              <div className="topup-quick">
                <button type="button" className="chip" onClick={() => quickSet(100)}>
                  +$100
                </button>
                <button type="button" className="chip" onClick={() => quickSet(500)}>
                  +$500
                </button>
                <button type="button" className="chip" onClick={() => quickSet(1000)}>
                  +$1000
                </button>
                <button type="button" className="chip" onClick={() => quickAdd(100)}>
                  +100
                </button>
                <button type="button" className="chip" onClick={() => quickAdd(500)}>
                  +500
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setTopupOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={amountParsed <= 0}
                >
                  Añadir
                </button>
              </div>

              <div className="topup-hint">
                No se requiere método de pago. Esto solo actualiza tu saldo local para pruebas.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
