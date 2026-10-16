import type { Category, Condition, Observation, Product } from "./types";

export const CONDITIONS: Record<Category, { id: Condition; label: string; hint: string }[]> = {
  console: [
    { id: "A", label: "A · como novo", hint: "Completo, caixa e acessórios, sem marcas." },
    { id: "B", label: "B · bom", hint: "Marcas leves, sem caixa ou com um acessório a menos." },
    { id: "C", label: "C · gasto", hint: "Desgaste visível ou falta de acessórios." },
    { id: "P", label: "P · para peças", hint: "Não liga ou com avaria." },
  ],
  controller: [
    { id: "sem-drift", label: "Sem drift", hint: "Analógicos e botões a funcionar bem." },
    { id: "drift-leve", label: "Drift leve", hint: "Pequeno desvio, ainda usável." },
    { id: "defeito", label: "Com defeito", hint: "Falha de botão, bateria ou drift forte." },
  ],
  game: [
    { id: "lacrado", label: "Lacrado", hint: "Por abrir." },
    { id: "completo", label: "Completo", hint: "Caixa e disco em bom estado." },
    { id: "so-disco", label: "Só disco", hint: "Sem caixa." },
  ],
};

export const CATEGORY_LABEL: Record<Category, string> = {
  console: "Consolas",
  controller: "Comandos",
  game: "Jogos",
};

interface Seed {
  id: string;
  category: Category;
  brand: string;
  name: string;
  variant: string;
  /** Preço novo de exemplo. */
  newPrice: number;
  /** Preço típico de exemplo no melhor estado. */
  usedBest: number;
}

const consoleSeeds: Seed[] = [
  { id: "ps4-slim-500", category: "console", brand: "Sony", name: "PlayStation 4 Slim", variant: "500 GB", newPrice: 299, usedBest: 125 },
  { id: "ps4-slim-1tb", category: "console", brand: "Sony", name: "PlayStation 4 Slim", variant: "1 TB", newPrice: 329, usedBest: 140 },
  { id: "ps4-pro-1tb", category: "console", brand: "Sony", name: "PlayStation 4 Pro", variant: "1 TB", newPrice: 399, usedBest: 175 },
  { id: "ps4-fat-500", category: "console", brand: "Sony", name: "PlayStation 4 (original)", variant: "500 GB", newPrice: 299, usedBest: 85 },
  { id: "ps5-disc", category: "console", brand: "Sony", name: "PlayStation 5", variant: "com leitor", newPrice: 549, usedBest: 380 },
  { id: "ps5-digital", category: "console", brand: "Sony", name: "PlayStation 5", variant: "digital", newPrice: 449, usedBest: 310 },
  { id: "switch-v2", category: "console", brand: "Nintendo", name: "Switch", variant: "V2", newPrice: 299, usedBest: 150 },
  { id: "switch-oled", category: "console", brand: "Nintendo", name: "Switch OLED", variant: "64 GB", newPrice: 349, usedBest: 205 },
  { id: "xbox-series-s", category: "console", brand: "Microsoft", name: "Xbox Series S", variant: "512 GB", newPrice: 299, usedBest: 165 },
  { id: "xbox-series-x", category: "console", brand: "Microsoft", name: "Xbox Series X", variant: "1 TB", newPrice: 499, usedBest: 310 },
];

const controllerSeeds: Seed[] = [
  { id: "ds4-v2", category: "controller", brand: "Sony", name: "DualShock 4", variant: "v2", newPrice: 65, usedBest: 28 },
  { id: "dualsense", category: "controller", brand: "Sony", name: "DualSense", variant: "PS5", newPrice: 75, usedBest: 40 },
  { id: "joycon-pair", category: "controller", brand: "Nintendo", name: "Joy-Con", variant: "par", newPrice: 80, usedBest: 45 },
  { id: "xbox-controller", category: "controller", brand: "Microsoft", name: "Comando Xbox", variant: "Series", newPrice: 65, usedBest: 35 },
];

const gameTitles: [string, number, number][] = [
  ["The Last of Us Part II", 20, 9],
  ["God of War", 20, 8],
  ["Marvel's Spider-Man", 20, 8],
  ["Red Dead Redemption 2", 30, 14],
  ["Grand Theft Auto V", 20, 9],
  ["Uncharted 4", 20, 8],
  ["Horizon Zero Dawn", 20, 7],
  ["Bloodborne", 20, 10],
  ["Persona 5 Royal", 40, 28],
  ["Ghost of Tsushima", 30, 15],
  ["Death Stranding", 25, 10],
  ["Gran Turismo Sport", 20, 6],
  ["Days Gone", 20, 8],
  ["The Witcher 3 Wild Hunt", 30, 10],
  ["FIFA 23", 30, 8],
  ["Call of Duty Modern Warfare", 40, 9],
  ["Spider-Man Miles Morales", 40, 18],
  ["Final Fantasy VII Remake", 30, 14],
  ["Kingdom Hearts III", 30, 12],
  ["Dark Souls Remastered", 30, 15],
  ["Resident Evil 2", 30, 14],
  ["Tekken 7", 25, 9],
  ["Crash Bandicoot N. Sane Trilogy", 30, 18],
  ["Minecraft", 25, 12],
  ["Assassin's Creed Odyssey", 30, 9],
];

const gameSeeds: Seed[] = gameTitles.map(([name, newPrice, usedBest]) => ({
  id: "game-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
  category: "game" as const,
  brand: "PS4",
  name,
  variant: "PS4",
  newPrice,
  usedBest,
}));

const SEEDS = [...consoleSeeds, ...controllerSeeds, ...gameSeeds];

export const PRODUCTS: Product[] = SEEDS.map(({ id, category, brand, name, variant }) => ({
  id,
  category,
  brand,
  name,
  variant,
}));

const CONDITION_FACTOR: Partial<Record<Condition, number>> = {
  A: 1, B: 0.85, C: 0.65, P: 0.3,
  "sem-drift": 1, "drift-leve": 0.65, defeito: 0.25,
  lacrado: 1.9, completo: 1, "so-disco": 0.7,
};

/** Gerador determinístico para os exemplos serem sempre iguais. */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822069);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Observações de EXEMPLO para o app arrancar com algo. Não são preços reais:
 * ficam marcadas com `example: true` e a interface avisa isso.
 */
export function exampleObservations(): Observation[] {
  const out: Observation[] = [];
  for (const s of SEEDS) {
    out.push({
      productId: s.id, condition: s.category === "game" ? "lacrado" : "A",
      value: s.newPrice, kind: "new", source: "exemplo", date: daysAgo(5), example: true,
    });
    for (const c of CONDITIONS[s.category]) {
      const f = CONDITION_FACTOR[c.id] ?? 1;
      const r = rng(s.id + c.id);
      const base = s.usedBest * f;
      for (let i = 0; i < 6; i++) {
        const jitter = 0.9 + r() * 0.25;
        out.push({
          productId: s.id, condition: c.id, value: Math.round(base * jitter * 1.1),
          kind: "ask", source: `exemplo-${i}`, date: daysAgo(Math.floor(r() * 40)), example: true,
        });
      }
      for (let i = 0; i < 2; i++) {
        out.push({
          productId: s.id, condition: c.id, value: Math.round(base * (0.55 + r() * 0.1)),
          kind: "buyback", source: `exemplo-b${i}`, date: daysAgo(Math.floor(r() * 30)), example: true,
        });
      }
    }
  }
  return out;
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
