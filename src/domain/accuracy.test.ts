import { describe, expect, it } from "vitest";
import { accuracy } from "./profit";
import { buildListing } from "./listing";
import type { StockItem } from "./types";

const item = (estimate: number | undefined, sold: number | null): StockItem => ({
  id: String(Math.random()),
  productId: "ps4-slim-500",
  condition: "B",
  cost: 80,
  extraCosts: 0,
  boughtAt: "feira",
  boughtDate: "2026-10-01",
  estimate,
  sale: sold === null ? undefined : { price: sold, platform: "Vinted", shipping: 4, date: "2026-10-10" },
});

describe("accuracy", () => {
  it("conta acertos dentro de 15% do estimado", () => {
    const r = accuracy([item(100, 110), item(100, 85), item(100, 60), item(100, 140)]);
    expect(r).toEqual({ hits: 2, total: 4 });
  });

  it("ignora itens sem estimativa ou por vender", () => {
    const r = accuracy([item(undefined, 100), item(100, null), item(100, 100)]);
    expect(r).toEqual({ hits: 1, total: 1 });
  });
});

describe("buildListing", () => {
  it("monta título e descrição com o estado e o preço", () => {
    const l = buildListing("ps4-slim-500", "B", 120);
    expect(l.title).toContain("PlayStation 4 Slim");
    expect(l.title).toContain("500 GB");
    expect(l.body).toContain("120");
    expect(l.body.toLowerCase()).toContain("light marks");
  });
});
