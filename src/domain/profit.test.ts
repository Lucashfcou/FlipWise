import { describe, expect, it } from "vitest";
import { itemProfit, monthlySummary, daysHeld } from "./profit";
import type { StockItem } from "./types";

const base: StockItem = {
  id: "1",
  productId: "p",
  condition: "B",
  cost: 100,
  extraCosts: 10,
  boughtAt: "feira",
  boughtDate: "2026-10-01",
};

describe("profit", () => {
  it("calcula lucro e margem de item vendido", () => {
    const r = itemProfit({ ...base, sale: { price: 180, platform: "Vinted", shipping: 5, date: "2026-10-11" } });
    expect(r?.profit).toBe(65);
    expect(r?.margin).toBeCloseTo(65 / 110, 3);
  });

  it("não calcula lucro de item por vender", () => {
    expect(itemProfit(base)).toBeNull();
  });

  it("conta dias parado até hoje ou até à venda", () => {
    expect(daysHeld(base, new Date("2026-10-16"))).toBe(15);
    expect(
      daysHeld({ ...base, sale: { price: 1, platform: "x", shipping: 0, date: "2026-10-11" } }, new Date("2026-10-16")),
    ).toBe(10);
  });

  it("resume o mês", () => {
    const sold: StockItem = { ...base, sale: { price: 180, platform: "Vinted", shipping: 5, date: "2026-10-11" } };
    const other: StockItem = { ...base, id: "2", cost: 50, extraCosts: 0, sale: { price: 90, platform: "OLX", shipping: 0, date: "2026-09-20" } };
    const s = monthlySummary([sold, other, { ...base, id: "3" }], "2026-10");
    expect(s.sold).toBe(1);
    expect(s.profit).toBe(65);
    expect(s.unsold).toBe(1);
  });
});
