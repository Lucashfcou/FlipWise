import { afterEach, describe, expect, it } from "vitest";
import { CATEGORY_LABEL, CONDITIONS, PRODUCTS, productLabel, variantLabel } from "./domain/catalog";
import { buildListing } from "./domain/listing";
import { money } from "./format";
import { getLang, setLang, t } from "./i18n";

afterEach(() => setLang("en"));

describe("idiomas", () => {
  it("o inglês é o idioma por omissão", () => {
    expect(getLang()).toBe("en");
    expect(t("nav.evaluate")).toBe("Evaluate");
  });

  it("troca para português e volta", () => {
    setLang("pt");
    expect(t("nav.evaluate")).toBe("Avaliar");
    setLang("en");
    expect(t("nav.evaluate")).toBe("Evaluate");
  });

  it("substitui parâmetros", () => {
    expect(t("eval.bought", { price: "€120" })).toBe("I bought it for €120");
    setLang("pt");
    expect(t("eval.bought", { price: "120 €" })).toBe("Comprei por 120 €");
  });

  it("formata dinheiro conforme o idioma", () => {
    expect(money(110)).toBe("€110");
    setLang("pt");
    expect(money(110).replace(/\s/g, " ")).toBe("110 €");
  });

  it("categorias, estados e variantes acompanham o idioma", () => {
    expect(CATEGORY_LABEL.console).toBe("Consoles");
    expect(CONDITIONS.console[0].label).toBe("Used · good");
    expect(variantLabel("disc")).toBe("disc");
    setLang("pt");
    expect(CATEGORY_LABEL.console).toBe("Consolas");
    expect(CONDITIONS.console[0].label).toBe("Usado · bom");
    expect(variantLabel("disc")).toBe("com leitor");
    const ps5 = PRODUCTS.find((p) => p.id === "ps5-disc")!;
    expect(productLabel(ps5)).toBe("PlayStation 5 com leitor");
  });

  it("o anúncio gerado sai no idioma da interface", () => {
    expect(buildListing("ps4-slim-500", "B", 120).body).toContain("Tested and working");
    setLang("pt");
    expect(buildListing("ps4-slim-500", "B", 120).body).toContain("Testado e a funcionar");
  });
});
