// src/lib/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3000', // change if your backend uses another port
  timeout: 10000,
})

// ---- Optional helpers we'll use later ----
export const register = (username: string, password: string) =>
  api.post('/auth/register', { username, password })

export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password })

export type BetPayload = {
  user_id: number
  game: 'roulette'
  amount: number
  outcome: string   // e.g. "win" | "lose" | "red" | "black" | "0"
  payout: number
  meta?: any
}

export const postBet = (payload: BetPayload) => api.post('/bets', payload)

export const topup = (user_id: number, amount: number) =>
  api.post('/wallet/topup', { user_id, amount });
