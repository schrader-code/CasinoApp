import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.post("/", async (req, res) => {
  const { user_id, game, amount, outcome, payout, meta } = req.body;
  if(!user_id || !game || !amount || outcome===undefined || payout===undefined) {
    return res.status(400).json({ error: "missing fields" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      "INSERT INTO bets (user_id, game, amount, outcome, payout, meta_json) VALUES (?,?,?,?,?,?)",
      [user_id, game, amount, outcome, payout, meta ? JSON.stringify(meta) : null]
    );

    // actualiza balance (payout - amount)
    await conn.execute(
      "UPDATE users SET balance = balance + ? WHERE id = ?",
      [payout - amount, user_id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "server error" });
  } finally {
    conn.release();
  }
});

export default router;
