import { describe, expect, it } from "vitest";
import { referenceFor } from "../data/market";
import { PRODUCTS } from "../domain/catalog";
import { runPipeline } from "../pipeline/run";
import { buildSearchUrl, toRaw } from "./client";
import type { EbayItem } from "./client";
import { productClassifier, queryFor } from "./queries";

const it_ = (id: string, title: string, value: string, condition?: string): EbayItem => ({
  itemId: id, title, price: { value, currency: "EUR" }, condition,
});

async function accepted(productId: string, items: EbayItem[], opts: { parts?: boolean } = {}, bounds = {}) {
  const q = queryFor(productId)!;
  const r = await runPipeline("t", toRaw(items), productClassifier(q, opts), "EUR", bounds);
  return { ids: items.filter((i) => !r.rejected.some((x) => x.id === i.itemId)).map((i) => i.itemId), r };
}

describe("catálogo", () => {
  it("todos os ids são únicos e cada produto (menos os sem consulta) tem consulta", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PRODUCTS.length).toBeGreaterThan(150);
    const semConsulta = PRODUCTS.filter((p) => !queryFor(p.id)).map((p) => p.id);
    expect(semConsulta.sort()).toEqual(["gpu-rtx-3060-12", "gpu-rtx-4060", "gpu-rtx-4060ti", "gpu-rtx-4070", "ps5-pro", "switch-2"]);
  });

  it("tem telemóveis, consolas, comandos e jogos de três plataformas", () => {
    const cats = new Set(PRODUCTS.map((p) => p.category));
    expect([...cats].sort()).toEqual(["audio", "camera", "console", "controller", "game", "gpu", "laptop", "phone", "shoe", "tablet", "watch"]);
    expect(new Set(PRODUCTS.filter((p) => p.category === "game").map((p) => p.variant))).toEqual(new Set(["PS4", "PS5", "Switch"]));
  });
});

describe("telemóveis", () => {
  it("iPhone 13 128: rejeita Pro, mini, outras capacidades, capas e outras gerações", async () => {
    const items = [
      it_("1", "Apple iPhone 13 128GB Medianoche", "280"),
      it_("2", "iPhone 13 Pro 128GB", "420"),
      it_("3", "iPhone 13 mini 128GB", "250"),
      it_("4", "iPhone 13 256GB", "330"),
      it_("5", "Funda para iPhone 13 128GB", "9"),
      it_("6", "iPhone 12 128GB", "200"),
      it_("7", "iPhone 13 128 GB azul libre", "275"),
    ];
    expect((await accepted("iphone-13-128", items)).ids).toEqual(["1", "7"]);
  });

  it("iPhone 14 Pro 256 exige Pro e 256, e rejeita Pro Max", async () => {
    const items = [it_("1", "iPhone 14 Pro 256GB", "700"), it_("2", "iPhone 14 Pro Max 256GB", "800"), it_("3", "iPhone 14 Pro 128GB", "620"), it_("4", "iPhone 14 256GB", "500")];
    expect((await accepted("iphone-14-pro-256", items)).ids).toEqual(["1"]);
  });
});

describe("edições especiais", () => {
  it("PS4 Slim: rejeita Spider-Man, Days of Play e edição limitada", async () => {
    const items = [
      it_("1", "PlayStation 4 Slim 500GB negra", "120"),
      it_("2", "PS4 Slim 500GB edición Spider-Man", "170"),
      it_("3", "PlayStation 4 Slim 500GB Days of Play azul", "150"),
      it_("4", "PS4 Slim 500GB edición limitada", "160"),
    ];
    expect((await accepted("ps4-slim-500", items)).ids).toEqual(["1"]);
  });

  it("PS5 Digital Edition continua a ser aceite (a palavra 'edition' não é edição especial)", async () => {
    const r = await accepted("ps5-digital", [it_("1", "PlayStation 5 Digital Edition 825GB", "400")]);
    expect(r.ids).toEqual(["1"]);
  });
});

describe("limites de plausibilidade", () => {
  it("corta preços suspeitos de golpe (muito baixos) e de edição especial ou lote (muito altos)", async () => {
    const items = [
      it_("1", "PlayStation 5 825GB disc", "440"),
      it_("2", "PlayStation 5 825GB disc", "450"),
      it_("3", "PlayStation 5 825GB disc", "430"),
      it_("4", "PlayStation 5 825GB disc", "200"),
      it_("5", "PlayStation 5 825GB disc", "900"),
    ];
    const ref = referenceFor("ps5-disc", "B"); // CeX: paga 434, vende 620
    const { ids, r } = await accepted("ps5-disc", items, {}, { min: ref.floor! * 0.8, max: ref.ceiling });
    expect(ids).toEqual(["1", "2", "3"]);
    expect(r.rejected.find((x) => x.id === "4")?.reason).toContain("golpe");
    expect(r.rejected.find((x) => x.id === "5")?.reason).toContain("edição especial ou lote");
    expect(r.prices).toEqual([430, 440, 450]);
  });

  it("produtos do CeX têm referência por estado; os outros não", () => {
    expect(referenceFor("ps4-slim-500", "B")).toEqual({ ceiling: 160, floor: 72 });
    expect(referenceFor("iphone-13-128", "B")).toEqual({});
  });
});

describe("para peças", () => {
  it("modo peças aceita defeituosos mas continua a recusar acessórios e lotes", async () => {
    const items = [
      it_("1", "iPhone 12 128GB pantalla rota", "90"),
      it_("2", "iPhone 12 128GB para piezas no enciende", "70"),
      it_("3", "Funda iPhone 12 128GB", "8"),
      it_("4", "iPhone 12 128GB bloqueado iCloud", "60"),
    ];
    expect((await accepted("iphone-12-128", items, { parts: true })).ids).toEqual(["1", "2", "4"]);
    expect((await accepted("iphone-12-128", items)).ids).toEqual([]);
  });

  it("reconhece 'defeituoso' em vários idiomas no modo normal", async () => {
    const items = [
      it_("1", "PS4 Slim 500GB defekt Ersatzteile", "40"),
      it_("2", "PS4 Slim 500GB pour pièces", "40"),
      it_("3", "PS4 Slim 500GB non funzionante", "40"),
      it_("4", "PS4 Slim 500GB sin funcionar", "40"),
    ];
    expect((await accepted("ps4-slim-500", items)).ids).toEqual([]);
  });

  it("a pesquisa de peças usa o código de condição 7000", () => {
    expect(decodeURIComponent(buildSearchUrl("x", 50, "PARTS"))).toContain("conditionIds:{7000}");
    expect(decodeURIComponent(buildSearchUrl("x", 50, "USED"))).toContain("conditions:{USED}");
  });
});

describe("jogos por plataforma", () => {
  it("PS5 não aceita a versão PS4 nem Switch", async () => {
    const items = [it_("1", "God of War Ragnarök PS5", "35"), it_("2", "God of War Ragnarök PS4", "25"), it_("3", "God of War Ragnarok Nintendo Switch", "30")];
    expect((await accepted("game-god-of-war-ragnarok-ps5", items)).ids).toEqual(["1"]);
  });
});

describe("produtos de tecnologia", () => {
  it("AirPods Pro 2 aceita o certo e recusa 1.ª geração, estojo isolado e lotes", async () => {
    const items = [
      it_("1", "Apple AirPods Pro 2nd generation con estuche MagSafe", "170"),
      it_("2", "AirPods Pro 2 segunda generación", "165"),
      it_("3", "AirPods Pro 1st generation", "110"),
      it_("4", "AirPods Max plata", "350"),
      it_("5", "Funda para AirPods Pro 2", "8"),
    ];
    expect((await accepted("airpods-pro-2", items)).ids).toEqual(["1", "2"]);
  });

  it("GPU 3070 recusa Ti e portáteis; MacBook Air M1 recusa Pro e M2", async () => {
    const gpu = [it_("1", "MSI GeForce RTX 3070 8GB", "280"), it_("2", "RTX 3070 Ti 8GB", "330"), it_("3", "Portatil RTX 3070 laptop", "900")];
    expect((await accepted("gpu-rtx-3070", gpu)).ids).toEqual(["1"]);
    const mac = [it_("1", "Apple MacBook Air M1 256GB 2020", "550"), it_("2", "MacBook Air M2 256GB", "750"), it_("3", "MacBook Pro M1 256 GB", "700")];
    expect((await accepted("macbook-air-m1-256", mac)).ids).toEqual(["1"]);
  });

  it("Galaxy S23 recusa Ultra, Plus e FE; Pixel 7 recusa Pro e 7a", async () => {
    const s = [it_("1", "Samsung Galaxy S23 128GB negro", "380"), it_("2", "Samsung Galaxy S23 Ultra 256GB", "620"), it_("3", "Galaxy S23+ 128GB", "450"), it_("4", "Galaxy S23 FE 128GB", "300")];
    expect((await accepted("galaxy-s23-128", s)).ids).toEqual(["1"]);
    const p = [it_("1", "Google Pixel 7 128GB", "230"), it_("2", "Google Pixel 7 Pro 128GB", "340"), it_("3", "Pixel 7a 128GB", "250")];
    expect((await accepted("pixel-7-128", p)).ids).toEqual(["1"]);
  });

  it("rótulos dos produtos não repetem a variante", async () => {
    const { productLabel, PRODUCTS: ALL } = await import("../domain/catalog");
    const ps2 = ALL.find((p) => p.id === "ps2-slim")!;
    expect(productLabel(ps2)).toBe("PlayStation 2 Slim");
    expect(productLabel(ALL.find((p) => p.id === "3ds-xl")!)).toBe("Nintendo 3DS XL");
  });
});
