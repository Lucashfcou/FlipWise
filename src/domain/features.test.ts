import { describe, expect, it } from "vitest";
import { allocateCost, evaluateBundle } from "./bundle";
import { parkedCapital, staleAdvice } from "./stale";
import { salesCsv, taxSummary } from "./tax";
import type { Condition, PriceEstimate, StockItem } from "./types";

const settings = { targetMargin: 0.25, shipping: 4, promo: 0, staleDays: 14 };

function est(typical: number, extra: Partial<PriceEstimate> = {}): PriceEstimate {
  return {
    low: typical * 0.9, typical, high: typical * 1.1, maxBuy: typical - 4 - typical * 0.25,
    firm: true, confidence: "media", count: 6, derived: false, ...extra,
  };
}

const table: Record<string, PriceEstimate> = {
  "ps4-slim-500:B": est(100, { safeBuy: 66 }),
  "ds4-v2:sem-drift": est(30, { safeBuy: 27 }),
};
const priceFor = (id: string, c: Condition) => table[`${id}:${c}`] ?? est(0, { count: 0, maxBuy: 0 });

describe("evaluateBundle", () => {
  const lines = [
    { productId: "ps4-slim-500", condition: "B" as Condition, qty: 1 },
    { productId: "ds4-v2", condition: "sem-drift" as Condition, qty: 2 },
  ];

  it("soma as peças e compara vender separado com vender junto", () => {
    const r = evaluateBundle(lines, priceFor, settings, 120);
    expect(r.totalUnits).toBe(3);
    expect(r.pricedUnits).toBe(3);
    expect(r.sumTypical).toBe(160);
    expect(r.separate.net).toBe(160 - 3 * 4);
    expect(r.together.net).toBeCloseTo(160 * 0.9 - 4, 2);
    expect(r.separate.maxBuy).toBeCloseTo(148 - 40, 2);
    expect(["separado", "junto"]).toContain(r.best);
    expect(r.maxBuy).toBe(Math.max(r.separate.maxBuy, r.together.maxBuy));
  });

  it("decide pelo preço pedido do lote", () => {
    expect(evaluateBundle(lines, priceFor, settings, 80).decision?.light).toBe("go");
    expect(evaluateBundle(lines, priceFor, settings, 130).decision?.light).toBe("maybe");
    expect(evaluateBundle(lines, priceFor, settings, 200).decision?.light).toBe("stop");
  });

  it("peças sem preço ficam de fora e são contadas", () => {
    const r = evaluateBundle([...lines, { productId: "joycon-pair", condition: "sem-drift", qty: 1 }], priceFor, settings, 100);
    expect(r.missingUnits).toBe(1);
    expect(r.pricedUnits).toBe(3);
  });

  it("reparte o custo do lote pelo valor de cada peça e a soma fecha", () => {
    const r = evaluateBundle(lines, priceFor, settings, 120);
    const parts = allocateCost(lines, r.items, 120);
    expect(parts).toHaveLength(3);
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(120, 1);
    expect(parts[0]).toBeGreaterThan(parts[1]);
  });
});

const item = (over: Partial<StockItem> = {}): StockItem => ({
  id: "1", productId: "ps4-slim-500", condition: "B", cost: 70, extraCosts: 0, boughtAt: "feira", boughtDate: "2026-09-01", ...over,
});

describe("staleAdvice", () => {
  const today = new Date("2026-10-16");

  it("não marca como parado antes do limite", () => {
    const a = staleAdvice(item({ boughtDate: "2026-10-10" }), est(100), settings, today);
    expect(a.stale).toBe(false);
    expect(a.suggested).toBe(100);
  });

  it("baixa 5% por semana depois do limite", () => {
    const a = staleAdvice(item({ boughtDate: "2026-09-25" }), est(100), settings, today); // 21 dias
    expect(a.stale).toBe(true);
    expect(a.suggested).toBe(90); // 2 passos: dias 14..20 = 1, 21 = 2
  });

  it("nunca sugere abaixo do custo mais envio", () => {
    const a = staleAdvice(item({ boughtDate: "2026-06-01", cost: 95 }), est(100), settings, today);
    expect(a.suggested).toBe(99);
    expect(a.atBreakEven).toBe(true);
    expect(a.profit).toBe(0);
  });

  it("soma o capital parado só dos itens por vender", () => {
    const sold = item({ id: "2", sale: { price: 100, platform: "Vinted", shipping: 4, date: "2026-10-01" } });
    expect(parkedCapital([item(), item({ id: "3", cost: 30, extraCosts: 5 }), sold])).toEqual({ capital: 105, count: 2 });
  });
});

describe("taxSummary e salesCsv", () => {
  const sold = (id: string, price: number, platform: string, date: string): StockItem =>
    item({ id, cost: 50, sale: { price, platform, shipping: 4, date } });

  it("agrega por plataforma e avisa perto do limite", () => {
    const list = [
      ...Array.from({ length: 25 }, (_, i) => sold(`a${i}`, 40, "Vinted", "2026-05-01")),
      sold("b1", 100, "OLX", "2026-06-01"),
      sold("old", 100, "Vinted", "2025-06-01"),
    ];
    const s = taxSummary(list, "2026");
    expect(s.sales).toBe(26);
    expect(s.revenue).toBe(25 * 40 + 100);
    const v = s.platforms.find((p) => p.platform === "Vinted")!;
    expect(v.count).toBe(25);
    expect(v.status).toBe("perto");
    expect(s.platforms.find((p) => p.platform === "OLX")?.status).toBe("ok");
  });

  it("marca acima ao passar 2000 € numa plataforma", () => {
    const s = taxSummary([sold("x", 2100, "Vinted", "2026-02-02")], "2026");
    expect(s.platforms[0].status).toBe("acima");
  });

  it("gera CSV com ; e vírgula decimal, só do ano pedido", () => {
    const csv = salesCsv([sold("x", 100, "Vinted", "2026-02-02"), sold("y", 90, "OLX", "2025-02-02")], "2026");
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("sale_price");
    expect(lines[1]).toContain("100,00");
    expect(lines[1]).toContain("Vinted");
    expect(lines[1]).toContain("46,00");
  });
});

describe("veredicto no limite", () => {
  it("compra colada ao máximo avisa que está no limite", async () => {
    const { decide } = await import("../ui/Verdict");
    const price = { low: 24, typical: 28, high: 32, maxBuy: 20, firm: true, confidence: "media", count: 6, derived: false } as const;
    expect(decide(price, 19)?.title).toBe("Safe, thin profit");
    expect(decide(price, 12)?.title).toBe("Buy");
    expect(decide(price, 22)?.title).toBe("Good for you, not to resell");
    expect(decide(price, 25)?.title).toBe("Pass");
    expect(decide(price, 40)?.title).toBe("Pass");
  });
});

describe("lote com artigo fora do catálogo", () => {
  it("usa o preço próprio da linha e entra na soma", async () => {
    const { evaluateBundle } = await import("./bundle");
    const custom = { low: 90, typical: 100, high: 110, maxBuy: 70, firm: true, confidence: "media", count: 8, derived: false } as const;
    const r = evaluateBundle(
      [{ productId: "custom:Wii U", condition: "B", qty: 1, custom: { label: "Nintendo Wii U", price: custom } }],
      () => est(0, { count: 0, maxBuy: 0 }),
      { targetMargin: 0.25, shipping: 4, promo: 0 },
      80,
    );
    expect(r.items[0].label).toBe("Nintendo Wii U");
    expect(r.pricedUnits).toBe(1);
    expect(r.sumTypical).toBe(100);
  });
});

describe("lote com peças sem preço", () => {
  const custom = { low: 90, typical: 100, high: 110, maxBuy: 70, firm: true, confidence: "media", count: 8, derived: false } as const;
  const line = [{ productId: "custom:Wii U", condition: "B" as const, qty: 1, custom: { label: "Wii U", price: custom } }];
  const settings = { targetMargin: 0.25, shipping: 4, promo: 0 };
  const none = () => est(0, { count: 0, maxBuy: 0 });

  it("com peças sem preço, pedir mais que o valor das contadas não vira 'Pass'", async () => {
    const { evaluateBundle } = await import("./bundle");
    const r = evaluateBundle(line, none, settings, 115, 12);
    expect(r.decision?.title).toBe("Cannot say yet");
    expect(r.decision?.light).toBe("maybe");
  });

  it("sem peças sem preço, o veredito normal continua", async () => {
    const { evaluateBundle } = await import("./bundle");
    expect(evaluateBundle(line, none, settings, 115, 0).decision?.title).toBe("Pass");
  });

  it("comprar barato continua 'Buy' mesmo com peças sem preço", async () => {
    const { evaluateBundle } = await import("./bundle");
    expect(evaluateBundle(line, none, settings, 40, 12).decision?.light).toBe("go");
  });
});
