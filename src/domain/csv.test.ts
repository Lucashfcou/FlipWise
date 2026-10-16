import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("lê linhas válidas e ignora o cabeçalho", () => {
    const r = parseCsv("produto,estado,tipo,valor,fonte,data\nps4-slim-500,B,sold,120,eBay,2026-10-01\n", "2026-10-16");
    expect(r.errors).toEqual([]);
    expect(r.ok).toHaveLength(1);
    expect(r.ok[0]).toMatchObject({ productId: "ps4-slim-500", condition: "B", kind: "sold", value: 120, source: "eBay", date: "2026-10-01" });
  });

  it("aceita vírgula decimal com ponto e vírgula e usa a data de hoje por omissão", () => {
    const r = parseCsv("ps4-slim-500;B;ask;119,5", "2026-10-16");
    expect(r.ok[0].value).toBe(119.5);
    expect(r.ok[0].date).toBe("2026-10-16");
  });

  it("devolve erros claros por linha", () => {
    const r = parseCsv("nada,B,sold,10\nps4-slim-500,Z,sold,10\nps4-slim-500,B,xx,10\nps4-slim-500,B,sold,abc\nps4-slim-500,B");
    expect(r.ok).toHaveLength(0);
    expect(r.errors).toHaveLength(5);
    expect(r.errors[0]).toContain("não existe");
  });
});
