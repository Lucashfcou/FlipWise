import { CONDITIONS, findProduct } from "./catalog";
import type { Condition } from "./types";

/** Rascunho de anúncio para colar na Vinted ou no OLX. */
export function buildListing(productId: string, condition: Condition, price: number): { title: string; body: string } {
  const p = findProduct(productId);
  if (!p) return { title: "", body: "" };
  const cond = CONDITIONS[p.category].find((c) => c.id === condition);
  const name = p.category === "game" ? `${p.name} (${p.variant})` : `${p.name} ${p.variant}`;
  const title = `${name}${cond ? ` · ${cond.label.split("·").pop()!.trim()}` : ""}`;
  const lines = [
    `${name}.`,
    cond ? `Estado: ${cond.label}. ${cond.hint}` : "",
    "Testado e a funcionar. Fotos reais do artigo.",
    `Preço: ${Math.round(price)} €. Aceito propostas razoáveis.`,
    "Entrega em mão ou envio, a combinar.",
  ];
  return { title, body: lines.filter(Boolean).join("\n") };
}
