import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.post("/", async (req, res) => {
  const { user_id, game, amount, outcome, payout, meta } = req.body;

  if (!user_id || !game || amount === undefined || outcome === undefined || payout === undefined) {
    return res.status(400).json({ error: "missing fields" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      "INSERT INTO bets (user_id, game, amount, outcome, payout, meta_json) VALUES (?,?,?,?,?,?)",
      [user_id, game, amount, outcome, payout, meta ? JSON.stringify(meta) : null]
    );

    // Actualiza balance con el neto (payout - amount)
    await conn.execute(
      "UPDATE users SET balance = balance + ? WHERE id = ?",
      [payout - amount, user_id]
    );

    // ⬇️ Recupera el balance actualizado y lo devuelve
    const [rows] = await conn.execute("SELECT balance FROM users WHERE id = ?", [user_id]);
    const row: any = Array.isArray(rows) && rows[0] ? rows[0] : null;
    const balance = Number(row?.balance ?? 0);

    await conn.commit();
    return res.json({ ok: true, balance });
  } catch (e) {
    await conn.rollback();
    return res.status(500).json({ error: "server error" });
  } finally {
    conn.release();
  }
});

export default router;
