import { useNavigate } from 'react-router-dom'
import { getUser, clearSession } from '../lib/auth'
import { useAuthGuard } from '../lib/useAuthGuard'
import GameCard from '../components/GameCard'
import '../styles/lobby.css'

export default function Lobby() {
  useAuthGuard()
  const nav = useNavigate()
  const user = getUser()
  const balance = user ? Number(user.balance) : 0

  return (
    <div className="lobby-wrap">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
          <span className="chip">🎰</span>
          <h1>Casino App</h1>
        </div>
        <div className="actions">
          {user && <span className="badge">👋 {user.username} • 🪙 ${balance.toFixed(2)}</span>}
          <button className="btn" onClick={() => { clearSession(); nav('/') }}>Logout</button>
        </div>
      </header>

      {/* Bienvenida */}
      <section className="hero">
        <div>
          <h2>Lobby</h2>
          <p className="muted">Elige un juego para empezar. Hoy hay 2 disponibles.</p>
        </div>
        <div className="quick">
          <a className="btn primary" href="/roulette">Jugar Roulette</a>
        </div>
      </section>

      {/* Grid de juegos */}
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
    </div>
  )
}
