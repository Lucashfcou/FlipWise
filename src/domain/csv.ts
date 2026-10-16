import { CONDITIONS, PRODUCTS } from "./catalog";
import type { Condition, Observation, ObservationKind } from "./types";

export const CSV_TEMPLATE = "produto,estado,tipo,valor,fonte,data\nps4-slim-500,B,sold,120,eBay,2026-10-16\n";

const KINDS: ObservationKind[] = ["new", "refurb", "buyback", "ask", "sold"];

export interface CsvResult {
  ok: Observation[];
  errors: string[];
}

/** Lê linhas "produto,estado,tipo,valor,fonte,data". O produto pode ser o id ou o nome do catálogo. */
export function parseCsv(text: string, today = new Date().toISOString().slice(0, 10)): CsvResult {
  const ok: Observation[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, idx) => {
    const n = idx + 1;
    if (/^produto\s*[,;]/i.test(line)) return;
    // Com ";" a vírgula é decimal (formato português); sem ";" o separador é ",".
    const cells = line.split(line.includes(";") ? ";" : ",").map((c) => c.trim());
    if (cells.length < 4) {
      errors.push(`Linha ${n}: faltam colunas (produto, estado, tipo, valor).`);
      return;
    }
    const [prod, cond, kind, value, source, date] = cells;
    const product = PRODUCTS.find(
      (p) => p.id === prod.toLowerCase() || `${p.name} ${p.variant}`.toLowerCase() === prod.toLowerCase(),
    );
    if (!product) return void errors.push(`Linha ${n}: produto "${prod}" não existe no catálogo.`);
    const condition = CONDITIONS[product.category].find((c) => c.id === cond || c.id.toLowerCase() === cond.toLowerCase());
    if (!condition) return void errors.push(`Linha ${n}: estado "${cond}" inválido para ${product.name}.`);
    if (!KINDS.includes(kind as ObservationKind)) {
      return void errors.push(`Linha ${n}: tipo "${kind}" inválido. Usa new, refurb, buyback, ask ou sold.`);
    }
    const v = Number(value.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) return void errors.push(`Linha ${n}: valor "${value}" inválido.`);
    ok.push({
      productId: product.id,
      condition: condition.id as Condition,
      kind: kind as ObservationKind,
      value: v,
      source: source || "importado",
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today,
    });
  });
  return { ok, errors };
}
