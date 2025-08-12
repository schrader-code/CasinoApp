import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import betsRouter from "./routes/bets";
import walletRouter from "./routes/wallet"; // ← nuevo import
import { pool } from "./db";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("Casino backend OK 🎰"));

// 👇 endpoint de prueba de conexión a la base
app.get("/ping-db", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json(rows);
  } catch (e: any) {
    console.error("PING ERROR:", e?.code, e?.message);
    res.status(500).json({ error: "db fail", code: e?.code, message: e?.message });
  }
});

app.use("/auth", authRouter);
app.use("/bets", betsRouter);

app.use("/auth", authRouter);
app.use("/bets", betsRouter);
app.use("/wallet", walletRouter); // ← nuevo mount


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running at http://localhost:${port}`));
