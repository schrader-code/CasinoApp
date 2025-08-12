import React, { useEffect, useRef, useState } from "react";
import feltImg from "../assets/felt.png";
import wheel1 from "../assets/roulette_1.jpg";
import wheel2 from "../assets/roulette_2.png";
import wheel3 from "../assets/roulette_3.png";
import wheel4 from "../assets/roulette_4.png";
import wheel5 from "../assets/roulette_5.png";
import { useNavigate } from "react-router-dom";
import "../styles/roulette.css";

import { getUser, getToken, saveSession } from "../lib/auth";

// ⬇️ ponlo en true cuando tu backend /bets esté listo
const USE_BACKEND = true;

// Orden europeo (índice→número)
const WHEEL_NUMBERS_EU: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const SLOTS = 37;
const SLICE = 360 / SLOTS;
const ZERO_AT = -90; // 0 arriba (12 en punto)
const WHEEL_CLOCKWISE = true;

const REDS   = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACKS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);

type BetKey = "RED" | "BLACK" | "EVEN" | "ODD" | "LOW" | "HIGH";
const BETS: Record<BetKey, { label: string; payout: 1; ok: (n:number)=>boolean }> = {
  RED:   { label: "Red",   payout: 1, ok: n => REDS.has(n) },
  BLACK: { label: "Black", payout: 1, ok: n => BLACKS.has(n) },
  EVEN:  { label: "Even",  payout: 1, ok: n => n !== 0 && n % 2 === 0 },
  ODD:   { label: "Odd",   payout: 1, ok: n => n % 2 === 1 },
  LOW:   { label: "1–18",  payout: 1, ok: n => n >= 1 && n <= 18 },
  HIGH:  { label: "19–36", payout: 1, ok: n => n >= 19 && n <= 36 },
};

const clampAngle = (d:number)=> (d%360 + 360) % 360;
const rand = (a:number,b:number)=>Math.random()*(b-a)+a;

const Roulette: React.FC = () => {
  const [size] = useState(500);
  const navigate = useNavigate();

  // sesión
  const userRef  = useRef(getUser());
  const tokenRef = useRef(getToken());

  // animación
  const [wheelAngle, setWheelAngle] = useState(0);
  const [ballAngle,  setBallAngle]  = useState(0);
  const [spinning,   setSpinning]   = useState(false);
  const [resultNum,  setResultNum]  = useState<number | null>(null);

  // banca + apuestas simples
  const [balance, setBalance] = useState<number>(() => {
    const u = userRef.current; return u ? Number(u.balance) : 1000;
  });
  const chips = [1,5,10,25,50,100] as const;
  const [chip, setChip] = useState<number>(10);
  const [bets, setBets] = useState<Record<BetKey, number>>({
    RED:0, BLACK:0, EVEN:0, ODD:0, LOW:0, HIGH:0
  });
  const totalBet = Object.values(bets).reduce((a,b)=>a+b,0);

  const incBet = (k:BetKey) => {
    if (spinning) return;
    if (totalBet + chip > balance) return;
    setBets(p=>({...p,[k]:p[k]+chip}));
  };
  const decBet = (k:BetKey) => !spinning && setBets(p=>({...p,[k]:Math.max(0,p[k]-chip)}));
  const clearBets = () => !spinning && setBets({ RED:0, BLACK:0, EVEN:0, ODD:0, LOW:0, HIGH:0 });

  // overlay ganador + confetti
  const [showOverlay, setShowOverlay] = useState(false);
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const startConfetti = () => {
    const canvas = confettiRef.current, parent = canvas?.parentElement as HTMLElement | null;
    if (!canvas || !parent) return;
    const { width, height } = parent.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    type P = { x:number;y:number;vx:number;vy:number;r:number;vr:number;w:number;h:number;color:string; };
    const C=["#ff3b3b","#1a1a1a","#2ecc71","#ffd166","#ffffff"];
    const parts:P[] = Array.from({length:90},()=>({
      x: width/2 + rand(-40,40), y: height/2 + rand(-10,10),
      vx: rand(-200,200), vy: rand(-350,-200),
      r: rand(0,Math.PI*2), vr: rand(-6,6),
      w: rand(6,10), h: rand(10,16),
      color: C[(Math.random()*C.length)|0],
    }));
    const g=900, drag=0.995, t0=performance.now();
    const step=(t:number)=>{
      const dt=Math.min(0.033,(t-t0)/1000);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      parts.forEach(p=>{
        p.vx*=drag; p.vy=p.vy*drag+g*dt;
        p.x+=p.vx*dt; p.y+=p.vy*dt; p.r+=p.vr*dt;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
        ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      });
      if (t-t0<2000) confettiAnimRef.current=requestAnimationFrame(step);
      else { if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
             confettiAnimRef.current=null; ctx.clearRect(0,0,canvas.width,canvas.height); }
    };
    confettiAnimRef.current=requestAnimationFrame(step);
  };
  useEffect(()=>()=>{ if(confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current); },[]);

  // atajo: Esc para volver al lobby (opcional)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") navigate("/lobby"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // física
  const wheelAngleRef = useRef(0);
  const ballAngleRef  = useRef(0);
  const wheelW = useRef(0); const ballW = useRef(0);
  const aWheel = useRef(0); const aBall = useRef(0);
  const frame = useRef<number | null>(null);
  const lastT = useRef<number | null>(null);

  const spin = () => {
    if (spinning || totalBet===0 || totalBet>balance) return;

    // descuenta stake al iniciar
    setBalance(b=>b-totalBet);
    setResultNum(null);
    setShowOverlay(false);

    wheelW.current = rand(500, 850);
    ballW.current  = -rand(900, 1500);
    aWheel.current = rand(120, 180);
    aBall.current  = rand(240, 380);

    setSpinning(true);
    lastT.current = null;

    const tick = (t:number) => {
      if (lastT.current==null) lastT.current = t;
      const dt = (t - (lastT.current ?? t)) / 1000;
      lastT.current = t;

      const nextW = clampAngle(wheelAngleRef.current + wheelW.current * dt);
      const nextB = clampAngle(ballAngleRef.current  + ballW.current  * dt);
      wheelAngleRef.current = nextW; setWheelAngle(nextW);
      ballAngleRef.current  = nextB; setBallAngle(nextB);

      const sW = Math.sign(wheelW.current)||1, sB = Math.sign(ballW.current)||-1;
      wheelW.current = Math.max(0, Math.abs(wheelW.current)-aWheel.current*dt)*sW;
      ballW.current  = Math.max(0, Math.abs(ballW.current)-aBall.current *dt)*sB;

      if (Math.abs(wheelW.current)<5 && Math.abs(ballW.current)<5) {
        setSpinning(false); frame.current=null;

        // resultado
        const rel = clampAngle(ballAngleRef.current - wheelAngleRef.current - ZERO_AT);
        let idx = Math.round(rel/SLICE) % SLOTS;
        if (!WHEEL_CLOCKWISE) idx = (SLOTS-idx)%SLOTS;
        const num = WHEEL_NUMBERS_EU[idx];
        setResultNum(num);

        // payout local: outside 1:1 => 2x (stake+ganancia) por cada acierto
        let credit = 0;
        (Object.keys(BETS) as BetKey[]).forEach(k=>{
          const amt = bets[k]; if (!amt) return;
          if (BETS[k].ok(num)) credit += amt * 2;
        });

        const user = userRef.current, token = tokenRef.current;
        const applyLocal = () => {
          // Ya restamos totalBet al iniciar el spin; aquí SOLO sumamos el crédito.
          setBalance(b => b + credit);

          if (user && token) {
            // Saldo final = saldo guardado - totalBet + credit
            const newBal = (user.balance ?? 0) - totalBet + credit;
            const updated = { ...user, balance: newBal };
            saveSession(token, updated);
            userRef.current = updated;
          }
        };

        (async ()=>{
          try {
            if (!USE_BACKEND || !user) {
              applyLocal();
            } else {
              // import dinámico solo si se usa backend
              const { postBet } = await import("../lib/api");
              const payload = {
                user_id: user.id,
                game: "roulette" as const,
                amount: totalBet,
                outcome: credit>0 ? "win" : (num===0 ? "zero":"lose"),
                payout: credit,
                meta: { resultNum: num, bets }
              };
              const { data } = await postBet(payload);
              if (data && typeof data.balance !== "undefined") {
                const newBal = Number(data.balance);
                setBalance(newBal);
                const updated = { ...user, balance: newBal };
                if (token) saveSession(token, updated);
                userRef.current = updated;
              } else {
                applyLocal();
              }
            }
          } catch (e) {
            console.error("postBet failed", e);
            applyLocal();
          } finally {
            setBets({ RED:0, BLACK:0, EVEN:0, ODD:0, LOW:0, HIGH:0 });
            setShowOverlay(true);
            startConfetti();
          }
        })();

        return;
      }
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
  };

  useEffect(()=>()=>{ if(frame.current) cancelAnimationFrame(frame.current); },[]);

  // geometría
  const wheelSize = size;
  const trackRadius = wheelSize*0.36;
  const ballSize   = Math.max(8, wheelSize*0.032);

  // overlay text
  const colorClass = resultNum===0 ? "green" : REDS.has(resultNum ?? -1) ? "red" : "black";
  const parity     = resultNum==null||resultNum===0 ? "—" : (resultNum%2===0?"Even":"Odd");
  const range      = resultNum==null||resultNum===0 ? "—" : (resultNum<=18?"Low (1–18)":"High (19–36)");

  return (
    <div className="roulette-root">
      <div className="roulette-card">
        {/* Top bar */}
        <div className="topbar">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="btn btn-secondary" onClick={()=>navigate("/lobby")}>← Lobby</button>
            <div className="balance">Saldo: <b>${balance}</b></div>
          </div>

          <div className="chipbar">
            <span className="chipbar__label">Ficha:</span>
            {[1,5,10,25,50,100].map(v=>(
              <button key={v} className={`chip ${chip===v ? "chip--active" : ""}`} onClick={()=>setChip(v)}>
                ${v}
              </button>
            ))}
            <span className="pending">Apuestas: <b>${totalBet}</b></span>
            <button className="btn btn-secondary" onClick={clearBets} disabled={spinning || totalBet===0}>
              Limpiar
            </button>
          </div>
        </div>

        {/* Bet tiles */}
        <div className="bet-grid">
          {(Object.keys(BETS) as BetKey[]).map((k)=>(
            <div key={k} className={`bet-tile bet-${k.toLowerCase()}`}>
              <button
                className="bet-main"
                onClick={()=>incBet(k)}
                disabled={spinning || totalBet+chip>balance}
                title={`Apostar ${BETS[k].label} (+$${chip})`}
              >
                <span className="bet-label">{BETS[k].label}</span>
                <span className="bet-amt">${bets[k]}</span>
              </button>
              <button
                className="bet-minus"
                onClick={()=>decBet(k)}
                disabled={spinning || bets[k]===0}
                title={`Quitar ${BETS[k].label} (-$${chip})`}
              >
                –
              </button>
            </div>
          ))}
        </div>

        {/* Rueda */}
        <div className="roulette-stage" style={{ width: wheelSize, height: wheelSize, backgroundImage: `url(${feltImg})` }}>
          <div className="wheel" style={{ transform: `rotate(${wheelAngle}deg)` }}>
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel1})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel2})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel3})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel4})` }} />
            <div className="wheel-layer" style={{ backgroundImage: `url(${wheel5})` }} />
          </div>
          <div className="track" />
          <div className="ball" style={{
            width: ballSize, height: ballSize,
            transform: `translate(-50%, -50%) rotate(${ballAngle}deg) translateX(${trackRadius}px)`
          }}/>
          <div className="hub" />
        </div>

        {/* Controls */}
        <div className="controls">
          <button
            className="btn"
            onClick={spin}
            disabled={spinning || totalBet===0 || totalBet>balance}
            title={totalBet>balance ? "Saldo insuficiente" : ""}
          >
            {spinning ? "Girando..." : "Spin"}
          </button>
        </div>

        {/* Overlay ganador */}
        <div className={`winner-overlay ${showOverlay ? "winner-overlay--show" : ""}`}>
          <canvas ref={confettiRef} className="confetti-canvas" />
          <div className="winner-card">
            <div className={`winner-number winner-number--${colorClass}`}>
              {resultNum ?? "–"}
            </div>
            <div className="winner-sub">
              {resultNum===0 ? "Zero" : (REDS.has(resultNum ?? -1) ? "Red" : "Black")} · {parity} · {range}
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
