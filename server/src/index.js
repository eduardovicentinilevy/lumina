require("dotenv/config");
const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/auth.routes");
const accountsRoutes = require("./routes/accounts.routes");
const invoicesRoutes = require("./routes/invoices.routes");
const creditRoutes = require("./routes/credit.routes");
const taxRoutes = require("./routes/tax.routes");
const plansRoutes = require("./routes/plans.routes");

// Garante que o esquema SQL exista antes de aceitar pedidos.
db.exec(fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8"));

const app = express();

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
}

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/credit", creditRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/plans", plansRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Em produção, o Express serve o build estático do cliente React (Vite)
// e devolve index.html para qualquer rota que não seja /api/*, permitindo
// que o react-router-dom controle a navegação no browser.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Lumina API a correr em http://localhost:${PORT}`);
});
