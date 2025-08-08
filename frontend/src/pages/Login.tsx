import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../lib/api'
import { saveSession } from '../lib/auth'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('Fill username and password')
      return
    }
    try {
      setLoading(true)
      if (mode === 'register') {
        await register(username, password) // crea el usuario
      }
      const { data } = await login(username, password) // { token, user }
      saveSession(data.token, data.user)
      nav('/lobby')
    } catch (err: any) {
      setError(err?.response?.data?.error || (mode === 'register' ? 'Register failed' : 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:420, margin:'48px auto', padding:24, border:'1px solid #ddd', borderRadius:12}}>
      <h2>Casino App</h2>

      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button
          type="button"
          onClick={() => setMode('login')}
          style={{padding:'8px 12px', borderRadius:8, border:'1px solid #ccc', background: mode==='login' ? '#eee' : '#fff'}}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          style={{padding:'8px 12px', borderRadius:8, border:'1px solid #ccc', background: mode==='register' ? '#eee' : '#fff'}}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{display:'grid', gap:12}}>
        <input
          placeholder="Username"
          value={username}
          onChange={e=>setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        {error && <div style={{color:'crimson'}}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? (mode==='register' ? 'Creating…' : 'Signing in…') : (mode==='register' ? 'Create account & Login' : 'Login')}
        </button>
      </form>
    </div>
  )
}
