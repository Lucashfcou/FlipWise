import { describe, expect, it } from "vitest";
import { estimate } from "./priceEngine";
import type { Observation } from "./types";

const TODAY = new Date("2026-10-16");

function obs(value: number, kind: Observation["kind"] = "sold", date = "2026-10-10", source = "t"): Observation {
  return { productId: "p", condition: "B", value, kind, source, date };
}

const costs = { shipping: 4, promo: 0, margin: 0.25 };

describe("estimate", () => {
  it("devolve confiança baixa e maxBuy não firme com poucos dados", () => {
    const r = estimate([obs(200), obs(210)], costs, TODAY);
    expect(r.confidence).toBe("baixa");
    expect(r.firm).toBe(false);
    expect(r.count).toBe(2);
  });

  it("calcula mediana e percentis com vendas reais", () => {
    const list = [180, 190, 195, 200, 200, 205, 210, 215, 220, 230].map((v, i) =>
      obs(v, "sold", "2026-10-10", `s${i}`),
    );
    const r = estimate(list, costs, TODAY);
    expect(r.typical).toBeGreaterThan(195);
    expect(r.typical).toBeLessThan(210);
    expect(r.low).toBeLessThan(r.typical);
    expect(r.high).toBeGreaterThan(r.typical);
    expect(r.confidence).toBe("alta");
    expect(r.firm).toBe(true);
  });

  it("descarta valores absurdos", () => {
    const list = [200, 205, 210, 195, 5, 9000].map((v, i) => obs(v, "sold", "2026-10-10", `s${i}`));
    const r = estimate(list, costs, TODAY);
    expect(r.count).toBe(4);
    expect(r.typical).toBeGreaterThan(190);
    expect(r.typical).toBeLessThan(215);
  });

  it("aplica desconto ao preço pedido", () => {
    const list = [200, 200, 200, 200].map((v, i) => obs(v, "ask", "2026-10-10", `a${i}`));
    const r = estimate(list, costs, TODAY);
    expect(r.typical).toBeCloseTo(180, 0);
    expect(r.confidence).toBe("media");
  });

  it("recompra e recondicionado não entram no típico, ficam como piso e teto", () => {
    const list = [
      ...[100, 105, 110, 100, 108].map((v, i) => obs(v, "sold", "2026-10-10", `s${i}`)),
      obs(60, "buyback", "2026-10-10", "cex"),
      obs(60, "buyback", "2026-10-10", "cex2"),
      obs(150, "refurb", "2026-10-10", "bm"),
    ];
    const r = estimate(list, costs, TODAY);
    expect(r.floor).toBe(60);
    expect(r.ceiling).toBe(150);
    expect(r.typical).toBeGreaterThan(98);
    expect(r.typical).toBeLessThan(112);
    expect(r.low).toBeGreaterThan(95);
  });

  it("sem vendas nem anúncios infere o típico entre piso e teto com confiança baixa", () => {
    const r = estimate([obs(60, "buyback", "2026-10-10", "a"), obs(140, "refurb", "2026-10-10", "b")], costs, TODAY);
    expect(r.derived).toBe(true);
    expect(r.confidence).toBe("baixa");
    expect(r.typical).toBeCloseTo(60 + 0.3 * 80, 0);
    expect(r.low).toBeCloseTo(60 + 0.2 * 80, 0);
    expect(r.high).toBeCloseTo(60 + 0.4 * 80, 0);
    expect(r.safeBuy).toBeCloseTo(60 * 0.92, 1);
  });

  it("o típico nunca fica abaixo do piso da loja", () => {
    const list = [300, 310, 305, 300].map((v, i) => obs(v, "ask", "2026-10-10", `a${i}`));
    const r = estimate([...list, obs(400, "buyback", "2026-10-10", "cex"), obs(600, "refurb", "2026-10-10", "cex2")], costs, TODAY);
    expect(r.typical).toBe(400);
    expect(r.low).toBe(400);
    expect(r.safeBuy).toBeCloseTo(400 * 0.92, 1);
  });

  it("limita o típico ao teto de loja", () => {
    const list = [300, 310, 305, 300].map((v, i) => obs(v, "sold", "2026-10-10", `s${i}`));
    const r = estimate([...list, obs(200, "refurb", "2026-10-10", "bm")], costs, TODAY);
    expect(r.typical).toBe(200);
  });

  it("dá menos peso a observações antigas", () => {
    const list = [
      obs(100, "sold", "2026-01-01", "a"),
      obs(100, "sold", "2026-01-02", "b"),
      obs(200, "sold", "2026-10-12", "c"),
      obs(200, "sold", "2026-10-13", "d"),
    ];
    const r = estimate(list, costs, TODAY);
    expect(r.typical).toBeGreaterThan(150);
  });

  it("maxBuy desconta custos e margem e nunca é negativo", () => {
    const list = Array.from({ length: 10 }, (_, i) => obs(200, "sold", "2026-10-10", `s${i}`));
    const r = estimate(list, costs, TODAY);
    expect(r.maxBuy).toBeCloseTo(200 - 4 - 50, 0);
    const cheap = Array.from({ length: 10 }, (_, i) => obs(5, "sold", "2026-10-10", `s${i}`));
    expect(estimate(cheap, { shipping: 20, promo: 0, margin: 0.5 }, TODAY).maxBuy).toBe(0);
  });

  it("sem observações devolve zeros e confiança baixa", () => {
    const r = estimate([], costs, TODAY);
    expect(r.count).toBe(0);
    expect(r.typical).toBe(0);
    expect(r.confidence).toBe("baixa");
  });
});
