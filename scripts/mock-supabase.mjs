// Supabase de mentira, só para ver o fluxo de login sem ter o projeto configurado. Nada aqui guarda dados.
//   node scripts/mock-supabase.mjs        (porta 54321)
// O "link enviado por e-mail" é o endereço http://localhost:54321/demo-login: abre-o e a sessão entra no app.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 54321);
const APP = process.env.MOCK_APP ?? "http://localhost:5175";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = () => Math.floor(Date.now() / 1000);

const user = (email) => ({
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email,
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
});

let lastEmail = "demo@flipwise.test";
const token = (email) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user(email).id, email, role: "authenticated", aud: "authenticated", exp: now() + 3600 })}.demo`;
const session = (email) => ({ access_token: token(email), token_type: "bearer", expires_in: 3600, expires_at: now() + 3600, refresh_token: "demo-refresh", user: user(email) });

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
};
const json = (res, code, body) => {
  res.writeHead(code, { ...cors, "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") return json(res, 204, {});
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (url.pathname === "/auth/v1/otp") {
      try {
        lastEmail = JSON.parse(body).email || lastEmail;
      } catch {}
      console.log(`Link pedido para ${lastEmail}. Abre: http://localhost:${PORT}/demo-login`);
      return json(res, 200, {});
    }
    if (url.pathname === "/demo-login") {
      const s = session(lastEmail);
      res.writeHead(302, { location: `${APP}/#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer&type=magiclink` });
      return res.end();
    }
    if (url.pathname === "/auth/v1/user") return json(res, 200, user(lastEmail));
    if (url.pathname === "/auth/v1/token") return json(res, 200, session(lastEmail));
    if (url.pathname === "/auth/v1/logout") return json(res, 204, {});
    json(res, 404, { error: "mock: não existe" });
  });
}).listen(PORT, "127.0.0.1", () => console.log(`Supabase de mentira em http://localhost:${PORT}`));
