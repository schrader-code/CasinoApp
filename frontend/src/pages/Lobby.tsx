import { Link, useNavigate } from 'react-router-dom'
import { getUser, clearSession } from '../lib/auth'
import { useAuthGuard } from '../lib/useAuthGuard'

export default function Lobby() {
  useAuthGuard()
  const nav = useNavigate()
  const user = getUser()

  return (
    <div style={{ padding: 24 }}>
      {/* Encabezado */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h2 style={{ margin: 0 }}>Lobby</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user && (
            <span>
              👋 {user.username} — 💰 ${Number(user.balance).toFixed(2)}
            </span>
          )}
          <button
            onClick={() => {
              clearSession()
              nav('/')
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Grid de juegos */}
      <div style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
      }}>
        {/* Roulette */}
        <Link
          to="/roulette"
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid #ddd',
            borderRadius: 12,
            overflow: 'hidden'
          }}
        >
          <img
            src="/assets/roulette/roulette_placeholder.png"
            alt="Roulette"
            style={{
              width: '100%',
              aspectRatio: '16/9',
              objectFit: 'cover'
            }}
          />
          <div style={{ padding: 12 }}>
            <h3 style={{ margin: '0 0 6px' }}>Roulette</h3>
            <p style={{ margin: 0, opacity: .8 }}>Single-player</p>
          </div>
        </Link>

        {/* Blackjack */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          overflow: 'hidden',
          opacity: .6
        }}>
          <img
            src="/assets/blackjack_placeholder.png"
            alt="Blackjack"
            style={{
              width: '100%',
              aspectRatio: '16/9',
              objectFit: 'cover'
            }}
          />
          <div style={{ padding: 12 }}>
            <h3 style={{ margin: '0 0 6px' }}>Blackjack</h3>
            <p style={{ margin: 0, opacity: .8 }}>(showcase only)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
