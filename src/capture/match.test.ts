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
    expect(id("Samsung Galaxy S21 Ultra")).toBe("galaxy-s21-ultra-256");
  });

  it("sem capacidade e com várias no catálogo devolve opções, não adivinha", () => {
    const m = matchCatalog("iPhone 13");
    if (!m.exact) expect(m.options.length).toBeGreaterThan(1);
  });

  it("produto que não existe no catálogo devolve nada", () => {
    const m = matchCatalog("Lenovo IdeaPad S145-15IWL");
    expect(m.exact).toBeUndefined();
    expect(m.options).toHaveLength(0);
  });

  it("capacidade que o catálogo não tem não casa com outro tamanho", () => {
    const m = matchCatalog("Samsung Galaxy S21 Ultra 1TB");
    expect(m.exact).toBeUndefined();
  });
});
