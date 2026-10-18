import { t } from "../i18n";
import { CONDITIONS, findProduct, productLabel } from "./catalog";
import type { Condition } from "./types";

/** Rascunho de anúncio para colar na Vinted ou no OLX. Sai no idioma da interface. */
export function buildListing(productId: string, condition: Condition, price: number): { title: string; body: string } {
  const p = findProduct(productId);
  if (!p) return { title: "", body: "" };
  const cond = CONDITIONS[p.category].find((c) => c.id === condition);
  const name = p.category === "game" ? `${p.name} (${p.variant})` : productLabel(p);
  const title = `${name}${cond ? ` · ${cond.label.split("·").pop()!.trim()}` : ""}`;
  const lines = [
    `${name}.`,
    cond ? t("listing.condition", { label: cond.label, hint: cond.hint }) : "",
    t("listing.tested"),
    t("listing.price", { price: Math.round(price) }),
    t("listing.delivery"),
  ];
  return { title, body: lines.filter(Boolean).join("\n") };
}
