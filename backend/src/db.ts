import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

console.log("DB env ->", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  hasPass: !!process.env.DB_PASSWORD,   // no imprime la pass, solo si existe
  db: process.env.DB_NAME,
  port: process.env.DB_PORT,
});



export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,   // <-- AQUÍ
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

