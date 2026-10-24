import { describe, expect, it } from "vitest";
import { matchCatalog } from "./match";

const id = (q: string, specs: string[] = []) => matchCatalog(q, specs).exact?.id;

describe("casar o nome lido com o catálogo", () => {
  it("consolas e variantes", () => {
    expect(id("PlayStation 4 Slim 500GB")).toBe("ps4-slim-500");
    expect(id("PS4 Slim 1TB")).toBe("ps4-slim-1tb");
    expect(id("Nintendo Switch OLED")).toBe("switch-oled");
    expect(id("Sony DualSense")).toBe("dualsense");
  });

  it("telemóveis: o modelo mais específico ganha e a capacidade escolhe a variante", () => {
    expect(id("Samsung Galaxy S21 Ultra 256GB")).toBe("galaxy-s21-ultra-256");
    expect(id("Samsung Galaxy S21", ["128GB"])).toBe("galaxy-s21-128");
    expect(matchCatalog("Samsung Galaxy S21 Ultra").options.length).toBeGreaterThan(1);
  });

  it("sem capacidade e com várias no catálogo devolve opções, não adivinha", () => {
    const m = matchCatalog("iPhone 13");
    if (!m.exact) expect(m.options.length).toBeGreaterThan(1);
  });

  it("relógios: Series 8 casa com S8", () => {
    expect(matchCatalog("Apple Watch Series 8 45mm").exact?.id).toBe("apple-watch-s8-45");
  });

  it("nomes genéricos como \"7\" só casam com a marca no texto", () => {
    expect(matchCatalog("Processador Ryzen 7 AM4").exact).toBeUndefined();
    expect(matchCatalog("Processador Ryzen 7 AM4").options).toHaveLength(0);
  });

  it("produto que não existe no catálogo devolve nada", () => {
    const m = matchCatalog("Foobar Zzyzx X9000 Pro");
    expect(m.exact).toBeUndefined();
    expect(m.options).toHaveLength(0);
  });

  it("capacidade que o catálogo não tem não casa com outro tamanho", () => {
    const m = matchCatalog("Samsung Galaxy S21 Ultra 1TB");
    expect(m.exact).toBeUndefined();
  });
});

describe("jogos: cada plataforma tem o seu preço", () => {
  it("jogo de outra plataforma não casa com o do PS4", () => {
    expect(matchCatalog("Minecraft Wii U Edition").exact).toBeUndefined();
    expect(matchCatalog("Minecraft Wii U Edition").options).toHaveLength(0);
    expect(matchCatalog("Minecraft Xbox One").exact).toBeUndefined();
  });

  it("com a plataforma certa casa", () => {
    expect(id("Minecraft PS4")).toBe("game-minecraft");
    expect(id("Minecraft PlayStation 4")).toBe("game-minecraft");
  });

  it("sem plataforma no texto pergunta em vez de assumir", () => {
    const m = matchCatalog("Minecraft");
    expect(m.exact).toBeUndefined();
    expect(m.options.length).toBeGreaterThan(0);
  });
});
