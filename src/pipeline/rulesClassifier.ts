import type { Classifier, Listing, Verdict } from "./types";

/** Preço abaixo disto, num aparelho principal, é isca ou engano. */
const BAIT_PRICE = 5;

const SEEKING = /\b(procuro|procura-se|compro|compra-se|busco|busca-se|quero comprar|se compra|wanted|looking for|wtb)\b/i;
const NEGOTIABLE_ONLY = /\b(a combinar|troco|troca|permuta|swap|trade only)\b/i;
const DEFECTIVE =
  /(para pe[cç]as|for parts|spare parts|pe[cç]as\b|ecr[aã]\s+(partido|quebrado|estalado)|tela\s+(quebrada|partida|trincada)|display\s+(partido|quebrado)|vidro\s+(partido|quebrado)|bloquead[oa]\s+(icloud|google|operadora|conta)|icloud\s+bloquead|conta\s+(google|icloud)\s+bloquead|sem\s+ligar|n[aã]o\s+liga|n[aã]o\s+funciona|com\s+defeito|avariad[oa]|danificad[oa]|placa\s+(m[aã]e\s+)?(queimada|avariada)|water\s+damage|danos\s+de\s+[aá]gua|para\s+piezas|\bpiezas\b|repuestos?|sin\s+funcionar|no\s+funciona|no\s+enciende|averiad[oa]|defectuos[oa]|\broto\b|\brota\b|pantalla\s+(rota|da[ñn]ada)|bloquead[oa]\s+(icloud|por)|icloud\s+(bloqueado|lock)|defekt|ersatzteile|bastler|nicht\s+funktionsf[aä]hig|pour\s+pi[eè]ces|d[eé]fectueu[xs]e?|hors\s+service|per\s+ricambi|non\s+funzionante|guasto|for\s+repair|not\s+working|faulty|broken|cracked)/i;
const ACCESSORY =
  /\b(capa|capinha|case\b|cover|pel[ií]cula|protetor\s+de\s+(ecr[aã]|tela)|screen\s+protector|vidro\s+temperado|cabo|cable|carregador|charger|adaptador|suporte|stand|dock|caixa\s+vazia|empty\s+box|s[oó]\s+a\s+caixa|manual|bateria\s+externa|powerbank|auriculares|fones)\b/i;

const INJECTION = /(ignor[ae]|ignore|disregard)\b.{0,40}(instru[cç][oõ]es|instructions|regras|rules)/i;

/** Com allowDefective, anúncios defeituosos ou "para peças" são aceites (para medir o valor de peças). */
export function createRulesClassifier(opts: { allowDefective?: boolean } = {}): Classifier {
  return {
  name: opts.allowDefective ? "regras locais (para peças)" : "regras locais",
  async classify(_query: string, listings: Listing[]): Promise<Verdict[]> {
    return listings.map((l) => {
      const text = `${l.title} ${l.description}`;
      if (INJECTION.test(text)) return { id: l.id, valid: false, reason: "texto tenta manipular o classificador" };
      if (SEEKING.test(l.title)) return { id: l.id, valid: false, reason: "anúncio de procura/compra" };
      if (l.price === null || NEGOTIABLE_ONLY.test(l.title)) {
        return { id: l.id, valid: false, reason: "sem preço numérico (a combinar/troca)" };
      }
      if (l.price <= BAIT_PRICE) return { id: l.id, valid: false, reason: `preço isca (${l.price} ${l.currency})` };
      if (!opts.allowDefective && DEFECTIVE.test(text)) return { id: l.id, valid: false, reason: "defeituoso, incompleto ou bloqueado" };
      if (ACCESSORY.test(l.title) && !/\b(com|incl|inclui|\+)\b/i.test(l.title)) {
        return { id: l.id, valid: false, reason: "acessório ou periférico, não o aparelho" };
      }
      return { id: l.id, valid: true, reason: "aparelho utilizável" };
    });
  },
  };
}

export const rulesClassifier: Classifier = createRulesClassifier();
