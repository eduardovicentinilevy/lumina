const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidEmail, isValidCNPJ, isPositiveNumber } = require("../src/utils/validators");

test("isValidEmail: aceita e-mails bem formados", () => {
  assert.equal(isValidEmail("demo@lumina.com.br"), true);
  assert.equal(isValidEmail("a.b+c@sub.dominio.com"), true);
});

test("isValidEmail: rejeita strings sem formato de e-mail", () => {
  assert.equal(isValidEmail("nao-e-email"), false);
  assert.equal(isValidEmail("falta@dominio"), false);
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail(undefined), false);
});

test("isValidCNPJ: aceita CNPJ formatado com dígitos verificadores corretos", () => {
  assert.equal(isValidCNPJ("11.222.333/0001-81"), true);
});

test("isValidCNPJ: aceita apenas os 14 dígitos, sem máscara", () => {
  assert.equal(isValidCNPJ("11222333000181"), true);
});

test("isValidCNPJ: rejeita dígito verificador incorreto", () => {
  assert.equal(isValidCNPJ("11.222.333/0001-82"), false);
});

test("isValidCNPJ: rejeita sequências com todos os dígitos iguais", () => {
  assert.equal(isValidCNPJ("11111111111111"), false);
  assert.equal(isValidCNPJ("00000000000000"), false);
});

test("isValidCNPJ: rejeita tamanho incorreto", () => {
  assert.equal(isValidCNPJ("123"), false);
  assert.equal(isValidCNPJ(""), false);
});

test("isPositiveNumber: distingue números válidos de inválidos", () => {
  assert.equal(isPositiveNumber(10), true);
  assert.equal(isPositiveNumber("10"), true);
  assert.equal(isPositiveNumber(0), false);
  assert.equal(isPositiveNumber(-5), false);
  assert.equal(isPositiveNumber("abc"), false);
  assert.equal(isPositiveNumber(undefined), false);
});
