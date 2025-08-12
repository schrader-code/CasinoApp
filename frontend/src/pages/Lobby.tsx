import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getToken, clearSession, saveSession } from '../lib/auth';
import { useAuthGuard } from '../lib/useAuthGuard';
import GameCard from '../components/GameCard';
import { topup } from '../lib/api'; // ⬅️ usa el endpoint del backend
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

  // ─────────── Modal de Añadir saldo ───────────
  const [topupOpen, setTopupOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('100');
  const [loadingTopup, setLoadingTopup] = useState(false);

  const amountParsed = (() => {
    const n = Math.floor(Number(amountStr));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(1_000_000, n);
  })();

  const quickSet = (n: number) => setAmountStr(String(n));
  const quickAdd = (n: number) => setAmountStr(String((amountParsed || 0) + n));

  // Llama al backend para sumar saldo y sincroniza la sesión
  const doTopup = async (delta: number) => {
    const user = userRef.current;
    const token = tokenRef.current;
    if (!user || !token) {
      alert('Inicia sesión primero.');
      return;
    }
    try {
      setLoadingTopup(true);
      const { data } = await topup(user.id, delta); // POST /wallet/topup
      const newBal = Number(data?.balance ?? 0);

      setBalance(newBal);
      const updated = { ...user, balance: newBal };
      saveSession(token, updated); // mantiene la sesión coherente con la BD
      userRef.current = updated;
    } catch (e) {
      console.error('TOPUP ERROR', e);
      alert('No se pudo actualizar el saldo en el servidor.');
    } finally {
      setLoadingTopup(false);
    }
  };

  const submitTopup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amountParsed <= 0 || loadingTopup) return;
    await doTopup(amountParsed);      // ⬅️ enviamos el delta al backend
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
        <div className="modal-overlay" onClick={() => setTopupOpen(false)}>
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
                  disabled={loadingTopup}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={amountParsed <= 0 || loadingTopup}
                >
                  {loadingTopup ? 'Añadiendo…' : 'Añadir'}
                </button>
              </div>

              <div className="topup-hint">
                Este monto se agrega a tu saldo en el servidor.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
