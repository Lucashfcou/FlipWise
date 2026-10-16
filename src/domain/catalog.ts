import type { Category, Condition, Product } from "./types";

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
}

const consoleSeeds: Seed[] = [
  { id: "ps4-slim-500", category: "console", brand: "Sony", name: "PlayStation 4 Slim", variant: "500 GB" },
  { id: "ps4-slim-1tb", category: "console", brand: "Sony", name: "PlayStation 4 Slim", variant: "1 TB" },
  { id: "ps4-pro-1tb", category: "console", brand: "Sony", name: "PlayStation 4 Pro", variant: "1 TB" },
  { id: "ps4-fat-500", category: "console", brand: "Sony", name: "PlayStation 4 (original)", variant: "500 GB" },
  { id: "ps5-disc", category: "console", brand: "Sony", name: "PlayStation 5", variant: "com leitor" },
  { id: "ps5-digital", category: "console", brand: "Sony", name: "PlayStation 5", variant: "digital" },
  { id: "switch-v2", category: "console", brand: "Nintendo", name: "Switch", variant: "V2" },
  { id: "switch-oled", category: "console", brand: "Nintendo", name: "Switch OLED", variant: "64 GB" },
  { id: "xbox-series-s", category: "console", brand: "Microsoft", name: "Xbox Series S", variant: "512 GB" },
  { id: "xbox-series-x", category: "console", brand: "Microsoft", name: "Xbox Series X", variant: "1 TB" },
];

const controllerSeeds: Seed[] = [
  { id: "ds4-v2", category: "controller", brand: "Sony", name: "DualShock 4", variant: "v2" },
  { id: "dualsense", category: "controller", brand: "Sony", name: "DualSense", variant: "PS5" },
  { id: "joycon-pair", category: "controller", brand: "Nintendo", name: "Joy-Con", variant: "par" },
  { id: "xbox-controller", category: "controller", brand: "Microsoft", name: "Comando Xbox", variant: "Series" },
];

const gameTitles: string[] = [
  "The Last of Us Part II",
  "God of War",
  "Marvel's Spider-Man",
  "Red Dead Redemption 2",
  "Grand Theft Auto V",
  "Uncharted 4",
  "Horizon Zero Dawn",
  "Bloodborne",
  "Persona 5 Royal",
  "Ghost of Tsushima",
  "Death Stranding",
  "Gran Turismo Sport",
  "Days Gone",
  "The Witcher 3 Wild Hunt",
  "FIFA 23",
  "Call of Duty Modern Warfare",
  "Spider-Man Miles Morales",
  "Final Fantasy VII Remake",
  "Kingdom Hearts III",
  "Dark Souls Remastered",
  "Resident Evil 2",
  "Tekken 7",
  "Crash Bandicoot N. Sane Trilogy",
  "Minecraft",
  "Assassin's Creed Odyssey",
];

const gameSeeds: Seed[] = gameTitles.map((name) => ({
  id: "game-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
  category: "game" as const,
  brand: "PS4",
  name,
  variant: "PS4",
}));

const SEEDS = [...consoleSeeds, ...controllerSeeds, ...gameSeeds];

export const PRODUCTS: Product[] = SEEDS.map(({ id, category, brand, name, variant }) => ({
  id,
  category,
  brand,
  name,
  variant,
}));

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
