import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken } from './auth'

export function useAuthGuard() {
  const nav = useNavigate()
  useEffect(() => {
    if (!getToken()) nav('/')
  }, [nav])
}
