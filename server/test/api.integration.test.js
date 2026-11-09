// Teste de integração: sobe a app Express num servidor HTTP real (porta
// aleatória), exercitando o fluxo completo — registo, autenticação,
// validação de entrada, CRUD de cobranças/contas e proteção de rotas —
// através de pedidos fetch reais, tal como um cliente faria.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TEST_DB_PATH = path.join(__dirname, "..", "data", "test-integration.db");
fs.rmSync(TEST_DB_PATH, { force: true });
fs.rmSync(`${TEST_DB_PATH}-wal`, { force: true });
fs.rmSync(`${TEST_DB_PATH}-shm`, { force: true });

process.env.DATABASE_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = "segredo-de-teste-nao-usar-em-producao";
process.env.NODE_ENV = "test";

const app = require("../src/app");

let server;
let baseUrl;
let sessionCookie = "";

function withCookie(options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (sessionCookie) headers.Cookie = sessionCookie;
  return { ...options, headers };
}

function rememberCookie(response) {
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) sessionCookie = setCookie.split(";")[0];
}

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(TEST_DB_PATH, { force: true });
  fs.rmSync(`${TEST_DB_PATH}-wal`, { force: true });
  fs.rmSync(`${TEST_DB_PATH}-shm`, { force: true });
});

test("GET /api/health responde ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("GET /api/rota-inexistente devolve 404 em JSON", async () => {
  const res = await fetch(`${baseUrl}/api/rota-inexistente`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.ok(body.error);
});

test("GET /api/accounts sem sessão devolve 401", async () => {
  const res = await fetch(`${baseUrl}/api/accounts`);
  assert.equal(res.status, 401);
});

test("POST /api/auth/register rejeita CNPJ com dígito verificador inválido", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Empresa Teste",
      cnpj: "11.222.333/0001-99", // dígitos verificadores errados
      taxRegime: "SIMPLES_NACIONAL",
      sector: "Varejo",
      name: "Fulano",
      email: "fulano@teste.com",
      password: "senha1234",
    }),
  });
  assert.equal(res.status, 400);
});

test("POST /api/auth/register rejeita senha curta", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Empresa Teste",
      cnpj: "11.222.333/0001-81",
      taxRegime: "SIMPLES_NACIONAL",
      sector: "Varejo",
      name: "Fulano",
      email: "fulano@teste.com",
      password: "123",
    }),
  });
  assert.equal(res.status, 400);
});

test("POST /api/auth/register cria empresa e autentica a sessão", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Empresa Teste Ltda",
      cnpj: "11.222.333/0001-81",
      taxRegime: "SIMPLES_NACIONAL",
      sector: "Varejo",
      name: "Fulano de Tal",
      email: "fulano@teste.com",
      password: "senha1234",
    }),
  });
  assert.equal(res.status, 201);
  rememberCookie(res);
  assert.ok(sessionCookie, "deveria ter recebido um cookie de sessão");
});

test("POST /api/auth/register com CNPJ duplicado devolve 409", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Outra Empresa",
      cnpj: "11.222.333/0001-81",
      taxRegime: "SIMPLES_NACIONAL",
      sector: "Varejo",
      name: "Ciclano",
      email: "outro@teste.com",
      password: "senha1234",
    }),
  });
  assert.equal(res.status, 409);
});

test("GET /api/auth/me com sessão devolve os dados da empresa", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, withCookie());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.company.name, "Empresa Teste Ltda");
  assert.equal(body.company.plan, "STARTER");
});

test("POST /api/invoices rejeita valor bruto não numérico", async () => {
  const res = await fetch(
    `${baseUrl}/api/invoices`,
    withCookie({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: "Cliente X", grossAmount: "abc" }),
    })
  );
  assert.equal(res.status, 400);
});

let createdInvoiceId;

test("POST /api/invoices cria uma cobrança com Split Payment calculado", async () => {
  const res = await fetch(
    `${baseUrl}/api/invoices`,
    withCookie({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: "Cliente Y", grossAmount: 1000, dueInDays: 15 }),
    })
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  createdInvoiceId = body.id;

  const listRes = await fetch(`${baseUrl}/api/invoices`, withCookie());
  const invoices = await listRes.json();
  const created = invoices.find((i) => i.id === createdInvoiceId);
  assert.ok(created);
  assert.equal(created.grossAmountCents, 100_000);
  assert.ok(created.netAmountCents < created.grossAmountCents, "o líquido deve ser menor que o bruto após o Split Payment");
  assert.equal(created.ibsAmountCents + created.cbsAmountCents + created.netAmountCents, created.grossAmountCents);
});

test("PATCH /api/invoices/:id marca a cobrança como paga", async () => {
  const res = await fetch(
    `${baseUrl}/api/invoices/${createdInvoiceId}`,
    withCookie({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAsPaid" }),
    })
  );
  assert.equal(res.status, 200);
});

test("DELETE /api/invoices/:id recusa excluir cobrança já paga (409)", async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}`, withCookie({ method: "DELETE" }));
  assert.equal(res.status, 409);
});

test("DELETE /api/invoices/:id remove uma cobrança pendente", async () => {
  const createRes = await fetch(
    `${baseUrl}/api/invoices`,
    withCookie({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: "Cliente Z", grossAmount: 300 }),
    })
  );
  const { id } = await createRes.json();

  const deleteRes = await fetch(`${baseUrl}/api/invoices/${id}`, withCookie({ method: "DELETE" }));
  assert.equal(deleteRes.status, 200);

  const deleteAgainRes = await fetch(`${baseUrl}/api/invoices/${id}`, withCookie({ method: "DELETE" }));
  assert.equal(deleteAgainRes.status, 404);
});

test("POST /api/accounts conecta uma conta e DELETE /api/accounts/:id remove", async () => {
  const connectRes = await fetch(`${baseUrl}/api/accounts`, withCookie({ method: "POST" }));
  assert.equal(connectRes.status, 201);
  const { accountId } = await connectRes.json();

  const listRes = await fetch(`${baseUrl}/api/accounts`, withCookie());
  const accounts = await listRes.json();
  assert.ok(accounts.some((a) => a.id === accountId));

  const deleteRes = await fetch(`${baseUrl}/api/accounts/${accountId}`, withCookie({ method: "DELETE" }));
  assert.equal(deleteRes.status, 200);

  const listAfter = await fetch(`${baseUrl}/api/accounts`, withCookie());
  const accountsAfter = await listAfter.json();
  assert.ok(!accountsAfter.some((a) => a.id === accountId), "a conta excluída não deveria mais aparecer");
});

test("GET /api/credit/score calcula um score em tempo real", async () => {
  const res = await fetch(`${baseUrl}/api/credit/score`, withCookie());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.score >= 0 && body.score <= 1000);
  assert.ok(["A", "B", "C", "D"].includes(body.tier));
});

test("POST /api/auth/login com senha errada devolve 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "fulano@teste.com", password: "senha-errada" }),
  });
  assert.equal(res.status, 401);
});

test("POST /api/auth/logout encerra a sessão", async () => {
  const res = await fetch(`${baseUrl}/api/auth/logout`, withCookie({ method: "POST" }));
  assert.equal(res.status, 200);
  rememberCookie(res);

  const meRes = await fetch(`${baseUrl}/api/auth/me`, withCookie());
  assert.equal(meRes.status, 401);
});
