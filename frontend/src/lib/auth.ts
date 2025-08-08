export type User = { id: number; username: string; balance: number }

export function saveSession(token: string, user: User) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function getUser(): User | null {
  const raw = localStorage.getItem('user')
  try {
    if (!raw) return null
    const u = JSON.parse(raw)
    return { id: u.id, username: u.username, balance: Number(u.balance) } as User
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

