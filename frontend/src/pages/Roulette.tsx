import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/roulette.css'

type SpinResult = { number: number; color: 'red' | 'black' | 'green' }

const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11,
  30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
  29, 7, 28, 12, 35, 3, 26
] as const

const RED = new Set([32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3])
const slice = 360 / WHEEL_NUMBERS.length

function colorOf(n: number): 'red'|'black'|'green' {
  if (n === 0) return 'green'
  return RED.has(n) ? 'red' : 'black'
}

function buildWheelGradient() {
  let a = 0
  const parts: string[] = []
  for (const n of WHEEL_NUMBERS) {
    const next = a + slice
    const c = n === 0 ? '#1aaa55' : RED.has(n) ? '#d33' : '#111'
    parts.push(`${c} ${a}deg ${next}deg`)
    a = next
  }
  return `conic-gradient(${parts.join(',')})`
}

export default function Roulette() {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [bet, setBet] = useState<'red'|'black'|'even'|'odd'|'low'|'high'|null>(null)

  const wheelRef = useRef<HTMLDivElement>(null)
  const ballRef  = useRef<HTMLDivElement>(null)
  const grad     = useMemo(buildWheelGradient, [])
  const labels   = useMemo(
    () => WHEEL_NUMBERS.map((n, i) => ({ n, angle: i * slice + slice/2 })),
    []
  )

  useEffect(() => {
    wheelRef.current && (wheelRef.current.style.transform = 'rotate(0deg)')
    if (ballRef.current) {
      ballRef.current.classList.remove('rl-ball-spin','rl-ball-stop')
      ballRef.current.style.setProperty('--ball-r','148px')
      ballRef.current.style.transform = 'rotate(0deg) translateX(148px) rotate(0deg)'
    }
  }, [])

  function spin() {
    if (spinning) return
    setSpinning(true)
    setResult(null)

    const idx = Math.floor(Math.random() * WHEEL_NUMBERS.length)
    const num = WHEEL_NUMBERS[idx]
    const col = colorOf(num)

    const target = 360*5 + (360 - idx * slice) // 5 vueltas + alineación
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 4.8s cubic-bezier(.2,.9,.1,1)'
      wheelRef.current.style.transform = `rotate(${target}deg)`
    }
    if (ballRef.current) {
      ballRef.current.classList.remove('rl-ball-stop')
      ballRef.current.classList.add('rl-ball-spin')
      ballRef.current.style.setProperty('--ball-r','148px')
    }

    window.setTimeout(() => {
      setResult({ number: num, color: col })
      setSpinning(false)

      if (ballRef.current) {
        ballRef.current.classList.remove('rl-ball-spin')
        ballRef.current.classList.add('rl-ball-stop')
        ballRef.current.style.setProperty('--ball-r','130px')
        const finalAngle = idx * slice + slice/2
        ballRef.current.style.transform = `rotate(${finalAngle}deg) translateX(130px) rotate(0)`
      }
      if (wheelRef.current) {
        const current = target % 360
        wheelRef.current.style.transition = 'none'
        wheelRef.current.style.transform = `rotate(${current}deg)`
      }
    }, 4800)
  }

  const won = useMemo(() => {
    if (!result || !bet) return null
    const n = result.number
    if (bet === 'red')  return result.color === 'red'
    if (bet === 'black')return result.color === 'black'
    if (bet === 'even') return n !== 0 && n % 2 === 0
    if (bet === 'odd')  return n % 2 === 1
    if (bet === 'low')  return n >= 1 && n <= 18
    if (bet === 'high') return n >= 19 && n <= 36
    return null
  }, [result, bet])

  return (
    <div className="roulette-wrap">
      <div className="rl-topbar">
        <h2>Roulette</h2>
        <div className="rl-bet-group">
          <button className={`rl-chip ${bet==='red'?'active':''}`}   onClick={()=>setBet('red')}  disabled={spinning}>🔴 Red</button>
          <button className={`rl-chip ${bet==='black'?'active':''}`} onClick={()=>setBet('black')}disabled={spinning}>⚫ Black</button>
          <button className={`rl-chip ${bet==='even'?'active':''}`}  onClick={()=>setBet('even')} disabled={spinning}>Even</button>
          <button className={`rl-chip ${bet==='odd'?'active':''}`}   onClick={()=>setBet('odd')}  disabled={spinning}>Odd</button>
          <button className={`rl-chip ${bet==='low'?'active':''}`}   onClick={()=>setBet('low')}  disabled={spinning}>1–18</button>
          <button className={`rl-chip ${bet==='high'?'active':''}`}  onClick={()=>setBet('high')} disabled={spinning}>19–36</button>
        </div>
        <button className="rl-btn rl-primary" onClick={spin} disabled={spinning || !bet}>
          {spinning ? 'Spinning…' : 'Spin'}
        </button>
      </div>

      <div className="rl-stage">
        <div className="rl-wheel-wrap">
          <div className="rl-pin" />
          <div className="rl-wheel" ref={wheelRef} style={{ backgroundImage: grad }}>
            <div className="rl-labels">
              {labels.map(({ n, angle }) => (
                <span
                  key={n + '-' + angle}
                  className={`rl-label ${n===0 ? 'green' : RED.has(n) ? 'red' : 'black'}`}
                  style={{ transform: `rotate(${angle}deg) translateX(138px) rotate(-${angle}deg)` }}
                >
                  {n}
                </span>
              ))}
            </div>
            <div className="rl-ball-orbit">
              <div className="rl-ball" ref={ballRef} />
            </div>
          </div>
        </div>

        <div className="rl-board">
          <img src="/assets/roulette/Board.png" alt="Board" />
        </div>
      </div>

      <div className="rl-result">
        {result ? (
          <div className={`rl-badge ${result.color}`}>
            Result: {result.number} ({result.color})
            {won !== null && <strong style={{ marginLeft: 8 }}>{won ? '— WIN' : '— LOSE'}</strong>}
          </div>
        ) : (
          <div className="rl-muted">Elige una apuesta y presiona Spin</div>
        )}
      </div>
    </div>
  )
}
