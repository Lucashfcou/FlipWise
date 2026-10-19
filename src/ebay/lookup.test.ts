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
