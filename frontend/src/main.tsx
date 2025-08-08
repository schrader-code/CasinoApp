import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Login from './pages/login.tsx'
import Lobby from './pages/Lobby.tsx'
import Roulette from './pages/Roulette.tsx'

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/lobby', element: <Lobby /> },
  { path: '/roulette', element: <Roulette /> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
