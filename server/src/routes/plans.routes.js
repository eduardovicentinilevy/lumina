const express = require("express");
const { PLAN_DETAILS, PLAN_ORDER } = require("../services/plans");

const router = express.Router();

// GET /api/plans — planos e preços exibidos na landing page (público)
router.get("/", (_req, res) => {
  res.json(PLAN_ORDER.map((id) => PLAN_DETAILS[id]));
});

module.exports = router;
