import { describe, expect, it } from "vitest";
import { cleanLookupQuery, lookupProductQuery } from "./lookup";

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
