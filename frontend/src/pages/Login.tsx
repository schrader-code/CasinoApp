import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../lib/api'
import { saveSession } from '../lib/auth'
import '../styles/auth.css'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('Llena usuario y contraseña')
      return
    }
    try {
      setLoading(true)
      if (mode === 'register') {
        await register(username, password)
      }
      const { data } = await login(username, password)
      saveSession(data.token, data.user)
      nav('/lobby')
    } catch (err: any) {
      const msg = err?.response?.data?.error || (mode === 'register' ? 'Registro fallido' : 'Login fallido')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Casino App</h1>

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {/* Inputs */}
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          className="input"
          placeholder="Tu usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label className="label" htmlFor="password">Password</label>
        <div className="pass-row">
          <input
            id="password"
            className="input"
            placeholder="••••••••"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setShowPass(s => !s)}
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPass ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {error && <div className="alert">{error}</div>}

        <button className="btn primary wide" type="submit" disabled={loading}>
          {loading ? (mode === 'register' ? 'Creando…' : 'Entrando…') : (mode === 'register' ? 'Crear cuenta' : 'Login')}
        </button>

        <p className="hint">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </form>
    </div>
  )
}
