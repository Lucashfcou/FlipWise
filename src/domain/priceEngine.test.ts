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
