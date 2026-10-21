import { describe, expect, it } from "vitest";
import { cleanLookupQuery, cleanSpecs, lookupProductQuery, specMatcher } from "./lookup";

describe("busca fora do catálogo", () => {
  it("limpa o texto: tira símbolos estranhos e limita o tamanho", () => {
    expect(cleanLookupQuery("  Sony   WH-CH720N  ")).toBe("Sony WH-CH720N");
    expect(cleanLookupQuery("<script>alert(1)</script>")).toBe("script alert 1 /script");
    expect(cleanLookupQuery("ab")).toBeNull();
    expect(cleanLookupQuery(42)).toBeNull();
    expect(cleanLookupQuery("x".repeat(300))!.length).toBe(80);
  });

  it("o título tem de conter todas as palavras do nome, ignorando espaços, hífenes e acentos", () => {
    const q = lookupProductQuery("Sony WH-CH720N");
    const ok = (title: string) => q.must.every((m) => m.test(title));
    expect(ok("Auriculares Sony WH CH720N negros")).toBe(true);
    expect(ok("SONY WH-CH720N")).toBe(true);
    expect(ok("Sony WH-CH520")).toBe(false);
    expect(ok("Auriculares Bose QC45")).toBe(false);
  });
});

describe("busca fora do catálogo: peças e acessórios", () => {
  it("tira carregadores e peças, exceto se o nome pesquisado os inclui", () => {
    const q = lookupProductQuery("Lenovo IdeaPad S145-15IWL");
    const ok = (title: string) => q.must.every((m) => m.test(title)) && !q.mustNot.some((m) => m.test(title));
    expect(ok("Portátil Lenovo IdeaPad S145-15IWL 8GB 256GB")).toBe(true);
    expect(ok("Cargador Lenovo IdeaPad S145-15IWL 65W")).toBe(false);
    expect(ok("Pantalla para Lenovo IdeaPad S145-15IWL")).toBe(false);
    const c = lookupProductQuery("Apple MagSafe cargador");
    expect(c.mustNot.some((m) => m.test("Apple MagSafe cargador 15W"))).toBe(false);
  });
});

describe("busca fora do catálogo: especificações", () => {
  const ok = (spec: string, title: string) => specMatcher(spec).test(title);
  it("8GB não casa com 128GB, e 240GB aceita 256GB", () => {
    expect(ok("8GB", "Portatil i5 8 GB RAM 256GB SSD")).toBe(true);
    expect(ok("8GB", "Movil 128GB")).toBe(false);
    expect(ok("240GB", "Disco SSD 256 GB")).toBe(true);
    expect(ok("240GB", "Disco 512GB")).toBe(false);
    expect(ok("i7", "Intel Core i7-8565U")).toBe(true);
    expect(ok("i7", "Intel Core i5-8265U")).toBe(false);
  });
  it("limpa a lista de especificações", () => {
    expect(cleanSpecs(["i7", " 8 GB ", "x", "<b>", "256GB", 5])).toEqual(["i7", "8GB", "256GB"]);
  });
});

describe("busca fora do catálogo: código do modelo", () => {
  it("5700X não casa com 5700X3D nem com 5700G", () => {
    const q = lookupProductQuery("AMD Ryzen 7 5700X");
    const ok = (title: string) => q.must.every((m) => m.test(title));
    expect(ok("Procesador AMD Ryzen 7 5700X CPU de escritorio")).toBe(true);
    expect(lookupProductQuery("Ryzen 7 5700X").must.every((m) => m.test("CPU Ryzen 7 5700X, AM4"))).toBe(true);
    expect(ok("AMD Ryzen 7 5700X3D 8 núcleos")).toBe(false);
    expect(ok("AMD Ryzen 7 5700G")).toBe(false);
  });
});
