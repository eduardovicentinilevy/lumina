const express = require("express");
const { simulateSplitPayment, REGIME_LABELS } = require("../services/tax.service");

const router = express.Router();

// GET /api/tax/simulate?amount=50000&regime=LUCRO_PRESUMIDO
// Endpoint público (sem autenticação) usado pelo simulador da landing page
// e pelo simulador do módulo de Fluxo de Caixa dentro do dashboard.
router.get("/simulate", (req, res) => {
  const amount = Number(req.query.amount);
  const regime = req.query.regime;

  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: "Parâmetro 'amount' inválido." });
  }
  if (!REGIME_LABELS[regime]) {
    return res.status(400).json({ error: "Parâmetro 'regime' inválido." });
  }

  res.json(simulateSplitPayment(Math.round(amount * 100), regime));
});

router.get("/regimes", (_req, res) => {
  res.json(REGIME_LABELS);
});

module.exports = router;
