import { describe, expect, it, vi } from "vitest";
import { ebayFileObservations } from "../data/market";
import { runPipeline } from "../pipeline/run";
import { buildSearchUrl, getToken, searchItems, toRaw } from "./client";
import type { EbayItem } from "./client";
import { productClassifier, queryFor } from "./queries";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("cliente eBay", () => {
  it("pede o token com Basic auth e o scope certo", async () => {
    const f = vi.fn(async () => json({ access_token: "tok", expires_in: 7200 })) as unknown as typeof fetch;
    const r = await getToken({ clientId: "id", clientSecret: "sec" }, f);
    expect(r.token).toBe("tok");
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.ebay.com/identity/v1/oauth2/token");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("id:sec").toString("base64")}`);
    expect(init.body).toContain("grant_type=client_credentials");
    expect(init.body).toContain(encodeURIComponent("https://api.ebay.com/oauth/api_scope"));
  });

  it("falha com erro claro se o token for recusado", async () => {
    const f = vi.fn(async () => json({ error: "invalid_client" }, 401)) as unknown as typeof fetch;
    await expect(getToken({ clientId: "a", clientSecret: "b" }, f)).rejects.toThrow("eBay token 401");
  });

  it("a pesquisa filtra usados a preço fixo, envia o mercado e o token", async () => {
    const f = vi.fn(async () => json({ itemSummaries: [{ itemId: "1", title: "PS4 Slim", price: { value: "120.00", currency: "EUR" } }] })) as unknown as typeof fetch;
    const items = await searchItems("tok", "EBAY_ES", "PlayStation 4 Slim 500GB", 50, f);
    expect(items).toHaveLength(1);
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(decodeURIComponent(url)).toContain("buyingOptions:{FIXED_PRICE},conditions:{USED}");
    expect(url).toContain("limit=50");
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer tok");
    expect(h["X-EBAY-C-MARKETPLACE-ID"]).toBe("EBAY_ES");
  });

  it("sem resultados devolve lista vazia; erro HTTP lança", async () => {
    expect(await searchItems("t", "EBAY_ES", "x", 10, vi.fn(async () => json({})) as unknown as typeof fetch)).toEqual([]);
    await expect(searchItems("t", "EBAY_ES", "x", 10, vi.fn(async () => json({}, 500)) as unknown as typeof fetch)).rejects.toThrow("eBay search 500");
  });

  it("limita o limite pedido", () => {
    expect(buildSearchUrl("x", 9999)).toContain("limit=200");
  });
});

const item = (id: string, title: string, value: string): EbayItem => ({ itemId: id, title, price: { value, currency: "EUR" } });

describe("filtros por produto", () => {
  it("PS4 Slim 500: aceita o certo e rejeita Pro, 1TB, PS5 e lotes", async () => {
    const items = [
      item("1", "Sony PlayStation 4 Slim 500GB negra", "120.00"),
      item("2", "Sony PlayStation 4 Slim 500 GB con mando", "125.00"),
      item("3", "PlayStation 4 Slim 1TB", "150.00"),
      item("4", "PlayStation 4 Pro 1TB", "190.00"),
      item("5", "PS4 Slim 500GB + 3 juegos", "170.00"),
      item("6", "Funda para PS4 Slim 500GB", "9.00"),
      item("7", "PlayStation 5 825GB", "400.00"),
    ];
    const q = queryFor("ps4-slim-500")!;
    const r = await runPipeline("PS4 Slim", toRaw(items), productClassifier(q));
    const ok = items.filter((i) => !r.rejected.some((x) => x.id === i.itemId)).map((i) => i.itemId);
    expect(ok).toEqual(["1", "2"]);
    expect(r.prices).toEqual([120, 125]);
  });

  it("Switch V2 não aceita OLED nem Lite; DualSense não aceita Edge", async () => {
    const sw = await runPipeline("sw", toRaw([item("a", "Nintendo Switch 32GB HAC-001-01", "150"), item("b", "Nintendo Switch OLED", "220"), item("c", "Nintendo Switch Lite", "110")]), productClassifier(queryFor("switch-v2")!));
    expect(sw.rejected.map((x) => x.id).sort()).toEqual(["b", "c"]);
    const ds = await runPipeline("ds", toRaw([item("a", "Mando DualSense PS5 blanco", "45"), item("b", "DualSense Edge PS5", "130")]), productClassifier(queryFor("dualsense")!));
    expect(ds.rejected.map((x) => x.id)).toEqual(["b"]);
  });

  it("jogos têm consulta e exigem PS4 no título", () => {
    const q = queryFor("game-god-of-war")!;
    expect(q.q).toContain("PS4");
    expect(q.must.every((r) => r.test("God of War PS4 Sony"))).toBe(true);
    expect(q.must.every((r) => r.test("God of War PS5"))).toBe(false);
    expect(queryFor("não-existe")).toBeUndefined();
  });
});

describe("ficheiro de preços do eBay", () => {
  it("converte para observações 'ask' com o estado assumido por categoria", () => {
    const obs = ebayFileObservations({
      updated: "2026-10-18",
      products: { "ps4-slim-500": { EBAY_ES: { prices: [100, 110] } }, "ds4-v2": { EBAY_DE: { prices: [25] } } },
    });
    expect(obs).toHaveLength(3);
    expect(obs[0]).toMatchObject({ productId: "ps4-slim-500", condition: "B", kind: "ask", value: 100, source: "eBay.es (anúncios)", date: "2026-10-18" });
    expect(obs[2]).toMatchObject({ productId: "ds4-v2", condition: "sem-drift", source: "eBay.de (anúncios)" });
  });

  it("ficheiro vazio não gera observações", () => {
    expect(ebayFileObservations({ updated: null, products: {} })).toEqual([]);
  });
});
