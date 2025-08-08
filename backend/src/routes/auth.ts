import { Router } from "express";
import { pool } from "../db";
import bcrypt from "bcryptjs"; // o 'bcrypt' si así lo tienes
import jwt from "jsonwebtoken";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "missing fields" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.execute(
      "INSERT INTO users (username, password_hash, balance) VALUES (?, ?, 1000.00)",
      [username, hash]
    );

    return res.json({ ok: true });
  } catch (e: any) {
    console.error("REGISTER ERROR:", e?.code, e?.message);
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "user exists" });
    }
    return res.status(500).json({
      error: "server error",
      code: e?.code || null,
      message: e?.message || null,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "missing fields" });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username]);
    const user = Array.isArray(rows) && (rows as any[])[0];
    if (!user) return res.status(401).json({ error: "invalid creds" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid creds" });

    // 🔹 Normaliza balance a número (mysql2 devuelve DECIMAL como string)
    const balance = Number(user.balance);

    const token = jwt.sign(
      { id: user.id, u: username },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, username, balance },
    });
  } catch (e: any) {
    console.error("LOGIN ERROR:", e?.code, e?.message);
    return res.status(500).json({
      error: "server error",
      code: e?.code || null,
      message: e?.message || null,
    });
  }
});

export default router;
