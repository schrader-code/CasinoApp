import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * POST /wallet/topup
 * body: { user_id: number, amount: number }
 * Suma 'amount' al balance del usuario y devuelve el balance actualizado.
 */
router.post("/topup", async (req, res) => {
  const { user_id, amount } = req.body || {};
  const n = Number(amount);
  if (!user_id || !Number.isFinite(n) || n <= 0) {
    return res.status(400).json({ error: "invalid fields" });
  }

  try {
    await pool.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [n, user_id]);
    const [rows] = await pool.execute("SELECT balance FROM users WHERE id = ?", [user_id]);
    const row: any = Array.isArray(rows) && rows[0] ? rows[0] : null;
    const balance = Number(row?.balance ?? 0);
    return res.json({ ok: true, balance });
  } catch (e: any) {
    console.error("TOPUP ERROR:", e?.code, e?.message);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;
