import React, { useEffect, useRef, useState } from "react";
import feltImg from "../assets/felt.png";
import wheel1 from "../assets/roulette_1.jpg";
import wheel2 from "../assets/roulette_2.png";
import wheel3 from "../assets/roulette_3.png";
import wheel4 from "../assets/roulette_4.png";
import wheel5 from "../assets/roulette_5.png";
import "../styles/roulette.css";

// Orden europeo (37 casillas). Índice 0 corresponde al 0.
const WHEEL_NUMBERS_EU: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const SLOTS = 37;
const SLICE = 360 / SLOTS;

// Calibración del centro del "0" cuando wheelAngle=0 (si está arriba, -90)
const ZERO_AT = -90;
// Sentido del orden en la textura (true = horario)
const WHEEL_CLOCKWISE = true;

// Colores estándar
const REDS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
const BLACKS = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]);

type BetKey = "RED" | "BLACK" | "EVEN" | "ODD" | "LOW" | "HIGH";

const BET_DEFS: Record<
  BetKey,
  { label: string; payout: number; predicate: (n: number) => boolean }
> = {
  RED:   { label: "Red",   payout: 1, predicate: (n) => REDS.has(n) },
  BLACK: { label: "Black", payout: 1, predicate: (n) => BLACKS.has(n) },
  EVEN:  { label: "Even",  payout: 1, predicate: (n) => n !== 0 && n % 2 === 0 },
  ODD:   { label: "Odd",   payout: 1, predicate: (n) => n % 2 === 1 },
  LOW:   { label: "1–18",  payout: 1, predicate: (n) => n >= 1 && n <= 18 },
  HIGH:  { label: "19–36", payout: 1, predicate: (n) => n >= 19 && n <= 36 },
};

const clampAngle = (deg: number) => {
  deg = deg % 360;
  return deg < 0 ? deg + 360 : deg;
};
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const Roulette: React.FC = () => {
  const [size] = useState<number>(500);

  // UI
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [ballAngle, setBallAngle] = useState<number>(0);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [resultNum, setResultNum] = useState<number | null>(null);

  // Banca y apuestas
  const [balance, setBalance] = useState<number>(1000);
  const [chip, setChip] = useState<number>(10);
  const [bets, setBets] = useState<Record<BetKey, number>>({
    RED: 0, BLACK: 0, EVEN: 0, ODD: 0, LOW: 0, HIGH: 0,
  });

  // Snapshot de apuestas bloqueadas al iniciar el spin
  const betSnapshotRef = useRef<Record<BetKey, number> | null>(null);

  // Overlay ganador
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimRef = useRef<number | null>(null);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const placeBet = (key: BetKey) => {
    if (spinning) return;
    setBets((prev) => ({ ...prev, [key]: prev[key] + chip }));
  };

  const removeBet = (key: BetKey) => {
    if (spinning) return;
    setBets((prev) => {
      const remove = Math.min(chip, prev[key]);
      if (remove <= 0) return prev;
      return { ...prev, [key]: prev[key] - remove };
    });
  };

  const clearBets = () => {
    if (spinning) return;
    setBets({ RED: 0, BLACK: 0, EVEN: 0, ODD: 0, LOW: 0, HIGH: 0 });
  };

  // Animación
  const wheelAngleRef = useRef<number>(0);
  const ballAngleRef = useRef<number>(0);
  const wheelW = useRef<number>(0);
  const ballW = useRef<number>(0);
  const aWheel = useRef<number>(0);
  const aBall = useRef<number>(0);
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);

  const spin = () => {
    if (spinning) return;
    if (totalBet === 0) return;
    if (totalBet > balance) return;

    betSnapshotRef.current = { ...bets };
    setBalance((b) => b - totalBet); // descuenta stake al iniciar
    setResultNum(null);
    setShowOverlay(false);

    wheelW.current = rand(500, 850);
    ballW.current = -rand(900, 1500);
    aWheel.current = rand(120, 180);
    aBall.current = rand(240, 380);

    setSpinning(true);
    lastTime.current = null;

    const tick = (t: number) => {
      if (lastTime.current == null) lastTime.current = t;
      const dt = (t - (lastTime.current ?? t)) / 1000;
      lastTime.current = t;

      const nextWheel = clampAngle(wheelAngleRef.current + wheelW.current * dt);
      const nextBall  = clampAngle(ballAngleRef.current  + ballW.current  * dt);
      wheelAngleRef.current = nextWheel;
      ballAngleRef.current  = nextBall;
      setWheelAngle(nextWheel);
      setBallAngle(nextBall);

      const sgnW = Math.sign(wheelW.current) || 1;
      const sgnB = Math.sign(ballW.current) || -1;
      const newWheelW = Math.max(0, Math.abs(wheelW.current) - aWheel.current * dt) * sgnW;
      const newBallW  = Math.max(0, Math.abs(ballW.current)  - aBall.current  * dt) * sgnB;
      wheelW.current = newWheelW;
      ballW.current = newBallW;

      if (Math.abs(newWheelW) < 5 && Math.abs(newBallW) < 5) {
        setSpinning(false);
        frame.current = null;

        // Resultado
        const rel = clampAngle(ballAngleRef.current - wheelAngleRef.current - ZERO_AT);
        let idx = Math.round(rel / SLICE) % SLOTS;
        if (!WHEEL_CLOCKWISE) idx = (SLOTS - idx) % SLOTS;
        const num = WHEEL_NUMBERS_EU[idx];
        setResultNum(num);

        // Liquidación (1:1) + retorno de stake por apuesta ganadora
        const snap = betSnapshotRef.current ?? { RED:0,BLACK:0,EVEN:0,ODD:0,LOW:0,HIGH:0 };
        let credit = 0;
        (Object.keys(BET_DEFS) as BetKey[]).forEach((k) => {
          const amt = snap[k] || 0;
          if (!amt) return;
          if (BET_DEFS[k].predicate(num)) {
            credit += amt * (1 + BET_DEFS[k].payout); // 2x en 1:1
          }
        });
        if (credit > 0) setBalance((b) => b + credit);

        // Reset apuestas para el siguiente spin
        setBets({ RED: 0, BLACK: 0, EVEN: 0, ODD: 0, LOW: 0, HIGH: 0 });
        betSnapshotRef.current = null;

        // Mostrar overlay + confetti
        setShowOverlay(true);
        startConfetti();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
  };

  // Confetti minimalista
  const startConfetti = () => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement as HTMLElement | null;
    if (!parent) return;

    // Ajusta tamaño
    const { width, height } = parent.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type P = { x:number; y:number; vx:number; vy:number; r:number; vr:number; w:number; h:number; color:string; life:number; };
    const colors = ["#ff3b3b","#1a1a1a","#2ecc71","#ffd166","#ffffff"];
    const parts: P[] = [];
    const N = 90;
    for (let i=0;i<N;i++){
      parts.push({
        x: width/2 + rand(-40, 40),
        y: height/2 + rand(-10, 10),
        vx: rand(-200, 200),
        vy: rand(-350, -200),
        r: rand(0, Math.PI*2),
        vr: rand(-6, 6),
        w: rand(6, 10),
        h: rand(10, 16),
        color: colors[(Math.random()*colors.length)|0],
        life: 0
      });
    }

    const g = 900; // px/s^2
    const drag = 0.995;
    const t0 = performance.now();

    const step = (t: number) => {
      const dt = Math.min(0.033, (t - (confettiAnimRef.current ? t - (t - (t0)) : t0)) / 1000); // clamp
      // Limpia
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      parts.forEach(p => {
        p.vx *= drag;
        p.vy = p.vy * drag + g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        p.life += dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });

      // Terminar ~2s
      if (t - t0 < 2000) {
        confettiAnimRef.current = requestAnimationFrame(step);
      } else {
        if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
        confettiAnimRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    confettiAnimRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    };
  }, []);

  // Geometría
  const wheelSize = size;
  const trackRadius = wheelSize * 0.36;
  const ballSize = Math.max(8, wheelSize * 0.032);

  // Datos del overlay
  const colorClass =
    resultNum === 0 ? "green" : REDS.has(resultNum ?? -1) ? "red" : "black";
  const parity =
    resultNum === null || resultNum === 0 ? "—" : resultNum % 2 === 0 ? "Even" : "Odd";
  const range =
    resultNum === null || resultNum === 0 ? "—" : resultNum <= 18 ? "Low (1–18)" : "High (19–36)";

  return (
    <div className="roulette-root">
      <div className="roulette-card">
        {/* Barra superior */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
          <div>Saldo: <b>${balance}</b></div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <span>Ficha:</span>
            {[1,5,10,25,50,100].map(v=>(
              <button key={v} className="btn" onClick={()=>setChip(v)} disabled={chip===v}>
                ${v}
              </button>
            ))}
            <span style={{opacity:.85}}>Apuestas: <b>${totalBet}</b></span>
            <button className="btn btn-secondary" onClick={clearBets} disabled={spinning || totalBet===0}>
              Limpiar
            </button>
          </div>
        </div>

        {/* Botonera de apuestas simples */}
        <div
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(3, minmax(0,1fr))",
            gap:8,
            marginBottom:12
          }}
        >
          {(Object.keys(BET_DEFS) as BetKey[]).map((k)=>(
            <div key={k} style={{display:"flex", gap:8}}>
              <button
                className="btn"
                style={{flex:1}}
                onClick={()=>placeBet(k)}
                disabled={spinning}
                title={`Apostar ${BET_DEFS[k].label} (+$${chip})`}
              >
                {BET_DEFS[k].label} — ${bets[k]}
              </button>
              <button
                className="btn btn-secondary"
                onClick={()=>removeBet(k)}
                disabled={spinning || bets[k]===0}
                title={`Quitar ${BET_DEFS[k].label} (-$${chip})`}
              >
                –
              </button>
            </div>
          ))}
        </div>

        {/* Mesa / rueda */}
        <div
          className="roulette-stage"
          style={{
            width: wheelSize,
            height: wheelSize,
            backgroundImage: `url(${feltImg})`,
          }}
        >
          <div className="wheel" style={{ transform: `rotate(${wheelAngle}deg)` }}>
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel1})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel2})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel3})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel4})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel5})` }} />
          </div>

          <div className="track" />
          <div
            className="ball"
            style={{
              width: ballSize,
              height: ballSize,
              transform: `translate(-50%, -50%) rotate(${ballAngle}deg) translateX(${trackRadius}px)`,
            }}
          />
          <div className="hub" />
        </div>

        {/* Controles */}
        <div className="controls">
          <button
            className="btn"
            onClick={spin}
            disabled={spinning || totalBet===0 || totalBet > balance}
            title={totalBet > balance ? "Saldo insuficiente" : ""}
          >
            {spinning ? "Girando..." : "Spin"}
          </button>
        </div>

        {/* OVERLAY GANADOR */}
        <div className={`winner-overlay ${showOverlay ? "winner-overlay--show" : ""}`}>
          <canvas ref={confettiRef} className="confetti-canvas" />
          <div className="winner-card">
            <div className={`winner-number winner-number--${colorClass}`}>
              {resultNum ?? "–"}
            </div>
            <div className="winner-sub">
              {resultNum === 0 ? "Zero" : (REDS.has(resultNum ?? -1) ? "Red" : "Black")} · {parity} · {range}
            </div>
            <div className="winner-actions">
              <button className="btn" onClick={()=>setShowOverlay(false)}>Continuar</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Roulette;
