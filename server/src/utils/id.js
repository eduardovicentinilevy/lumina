const crypto = require("node:crypto");

/** Gera um id curto e único (prefixo + 20 caracteres hexadecimais). */
function generateId(prefix) {
  const random = crypto.randomBytes(10).toString("hex");
  return prefix ? `${prefix}_${random}` : random;
}

module.exports = { generateId };
