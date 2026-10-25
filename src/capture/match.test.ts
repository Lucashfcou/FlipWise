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
    expect(id("Minecraft Wii U Edition")).toBe("game-minecraft-wii-u-edition-wiiu");
    expect(id("Minecraft Xbox One")).toBe("game-minecraft-xboxone");
    expect(matchCatalog("Mario Kart 8 Deluxe Nintendo Switch").exact?.variant).toBe("Switch");
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

describe("jogos das plataformas antigas", () => {
  it("cada jogo casa só com a sua plataforma", () => {
    expect(matchCatalog("Mario Kart 8 Wii U").exact?.variant).toBe("Wii U");
    expect(matchCatalog("Mario Kart Wii").exact?.variant).toBe("Wii");
    expect(matchCatalog("Mario Kart 7 Nintendo 3DS").exact?.variant).toBe("3DS");
    expect(matchCatalog("Mario Kart DS Nintendo DS").exact?.variant).toBe("DS");
    expect(matchCatalog("Halo 3 Xbox 360").exact?.variant).toBe("Xbox 360");
    expect(matchCatalog("The Last of Us PS3").exact?.variant).toBe("PS3");
  });

  it("nome sem plataforma ou 'Xbox' sem versão: pergunta em vez de assumir", () => {
    expect(matchCatalog("Halo 3").exact).toBeUndefined();
    const m = matchCatalog("Grand Theft Auto V Xbox");
    expect(m.exact).toBeUndefined();
    expect(m.options.map((o) => o.variant).sort()).toEqual(["Xbox 360", "Xbox One"]);
  });
});
