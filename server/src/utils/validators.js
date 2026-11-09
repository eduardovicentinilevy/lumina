const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Valida um CNPJ pelo algoritmo oficial dos dois dígitos verificadores
 * (módulo 11 com pesos decrescentes). Aceita o valor formatado
 * ("12.345.678/0001-95") ou apenas os 14 dígitos.
 */
function isValidCNPJ(rawCnpj) {
  const cnpj = onlyDigits(rawCnpj);
  if (cnpj.length !== 14) return false;
  // Rejeita sequências com todos os dígitos iguais (ex.: 00000000000000)
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split("").map(Number);

  function checkDigit(length) {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstCheck = checkDigit(12);
  if (firstCheck !== digits[12]) return false;

  const secondCheck = checkDigit(13);
  if (secondCheck !== digits[13]) return false;

  return true;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function isPositiveNumber(value) {
  return isFiniteNumber(value) && Number(value) > 0;
}

module.exports = { isValidEmail, isValidCNPJ, onlyDigits, isFiniteNumber, isPositiveNumber };
