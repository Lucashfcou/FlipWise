import type { Category, Condition, Product } from "./types";

const DEVICE_CONDITIONS = [
  { id: "A" as const, label: "A · como novo", hint: "Completo, caixa e acessórios, sem marcas." },
  { id: "B" as const, label: "B · bom", hint: "Marcas leves, sem caixa ou com um acessório a menos." },
  { id: "C" as const, label: "C · gasto", hint: "Desgaste visível ou falta de acessórios." },
  { id: "P" as const, label: "P · para peças", hint: "Não liga ou com avaria." },
];

export const CONDITIONS: Record<Category, { id: Condition; label: string; hint: string }[]> = {
  console: DEVICE_CONDITIONS,
  phone: [
    { id: "A", label: "A · como novo", hint: "Sem riscos, bateria acima de 90%, de preferência com caixa." },
    { id: "B", label: "B · bom", hint: "Marcas leves, bateria entre 80% e 90%." },
    { id: "C", label: "C · gasto", hint: "Riscos visíveis ou bateria abaixo de 80%." },
    { id: "P", label: "P · para peças", hint: "Ecrã partido, não liga ou bloqueado." },
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
  phone: "Telemóveis",
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
  { id: "ps5-slim-disc", category: "console", brand: "Sony", name: "PlayStation 5 Slim", variant: "1 TB com leitor" },
  { id: "ps5-slim-digital", category: "console", brand: "Sony", name: "PlayStation 5 Slim", variant: "1 TB digital" },
  { id: "ps5-pro", category: "console", brand: "Sony", name: "PlayStation 5 Pro", variant: "2 TB" },
  { id: "ps3-slim-500", category: "console", brand: "Sony", name: "PlayStation 3 Slim", variant: "500 GB" },
  { id: "ps3-slim-250", category: "console", brand: "Sony", name: "PlayStation 3 Slim", variant: "250 GB" },
  { id: "ps2-slim", category: "console", brand: "Sony", name: "PlayStation 2 Slim", variant: "slim" },
  { id: "psp-3000", category: "console", brand: "Sony", name: "PSP", variant: "3000" },
  { id: "ps-vita", category: "console", brand: "Sony", name: "PS Vita", variant: "slim" },
  { id: "switch-v2", category: "console", brand: "Nintendo", name: "Switch", variant: "V2" },
  { id: "switch-oled", category: "console", brand: "Nintendo", name: "Switch OLED", variant: "64 GB" },
  { id: "switch-lite", category: "console", brand: "Nintendo", name: "Switch Lite", variant: "32 GB" },
  { id: "switch-2", category: "console", brand: "Nintendo", name: "Switch 2", variant: "256 GB" },
  { id: "wii", category: "console", brand: "Nintendo", name: "Wii", variant: "com comando" },
  { id: "wii-u", category: "console", brand: "Nintendo", name: "Wii U", variant: "32 GB" },
  { id: "3ds-xl", category: "console", brand: "Nintendo", name: "Nintendo 3DS XL", variant: "XL" },
  { id: "xbox-series-s", category: "console", brand: "Microsoft", name: "Xbox Series S", variant: "512 GB" },
  { id: "xbox-series-x", category: "console", brand: "Microsoft", name: "Xbox Series X", variant: "1 TB" },
  { id: "xbox-one-s", category: "console", brand: "Microsoft", name: "Xbox One S", variant: "1 TB" },
  { id: "xbox-one-x", category: "console", brand: "Microsoft", name: "Xbox One X", variant: "1 TB" },
  { id: "xbox-360-slim", category: "console", brand: "Microsoft", name: "Xbox 360 Slim", variant: "250 GB" },
  { id: "steam-deck-lcd", category: "console", brand: "Valve", name: "Steam Deck", variant: "LCD 256 GB" },
  { id: "steam-deck-oled", category: "console", brand: "Valve", name: "Steam Deck OLED", variant: "512 GB" },
];

const controllerSeeds: Seed[] = [
  { id: "ds4-v2", category: "controller", brand: "Sony", name: "DualShock 4", variant: "v2" },
  { id: "dualsense", category: "controller", brand: "Sony", name: "DualSense", variant: "PS5" },
  { id: "joycon-pair", category: "controller", brand: "Nintendo", name: "Joy-Con", variant: "par" },
  { id: "switch-pro-controller", category: "controller", brand: "Nintendo", name: "Pro Controller", variant: "Switch" },
  { id: "xbox-controller", category: "controller", brand: "Microsoft", name: "Comando Xbox", variant: "Series" },
  { id: "xbox-one-controller", category: "controller", brand: "Microsoft", name: "Comando Xbox One", variant: "One" },
];

/** [id, nome, armazenamento]. Só modelos base ou Pro, sem Max, Plus nem mini. */
const PHONES: [string, string, string][] = [
  ["iphone-11-64", "iPhone 11", "64 GB"],
  ["iphone-11-128", "iPhone 11", "128 GB"],
  ["iphone-12-64", "iPhone 12", "64 GB"],
  ["iphone-12-128", "iPhone 12", "128 GB"],
  ["iphone-12-pro-128", "iPhone 12 Pro", "128 GB"],
  ["iphone-13-128", "iPhone 13", "128 GB"],
  ["iphone-13-256", "iPhone 13", "256 GB"],
  ["iphone-13-pro-128", "iPhone 13 Pro", "128 GB"],
  ["iphone-14-128", "iPhone 14", "128 GB"],
  ["iphone-14-256", "iPhone 14", "256 GB"],
  ["iphone-14-pro-128", "iPhone 14 Pro", "128 GB"],
  ["iphone-14-pro-256", "iPhone 14 Pro", "256 GB"],
  ["iphone-15-128", "iPhone 15", "128 GB"],
  ["iphone-15-256", "iPhone 15", "256 GB"],
  ["iphone-15-pro-128", "iPhone 15 Pro", "128 GB"],
  ["iphone-15-pro-256", "iPhone 15 Pro", "256 GB"],
];

const phoneSeeds: Seed[] = PHONES.map(([id, name, variant]) => ({ id, category: "phone" as const, brand: "Apple", name, variant }));

export type Platform = "PS4" | "PS5" | "Switch";

const PS4_GAMES = [
  "The Last of Us Part II", "God of War", "Marvel's Spider-Man", "Red Dead Redemption 2", "Grand Theft Auto V",
  "Uncharted 4", "Horizon Zero Dawn", "Bloodborne", "Persona 5 Royal", "Ghost of Tsushima", "Death Stranding",
  "Gran Turismo Sport", "Days Gone", "The Witcher 3 Wild Hunt", "FIFA 23", "Call of Duty Modern Warfare",
  "Spider-Man Miles Morales", "Final Fantasy VII Remake", "Kingdom Hearts III", "Dark Souls Remastered",
  "Resident Evil 2", "Tekken 7", "Crash Bandicoot N. Sane Trilogy", "Minecraft", "Assassin's Creed Odyssey",
  "Detroit Become Human", "Until Dawn", "Nioh 2", "Sekiro Shadows Die Twice", "Dark Souls III", "Monster Hunter World",
  "NieR Automata", "Yakuza 0", "Fallout 4", "The Elder Scrolls V Skyrim", "Doom Eternal", "Cyberpunk 2077", "Control",
  "Watch Dogs 2", "Far Cry 5", "Far Cry 6", "Assassin's Creed Origins", "Assassin's Creed Valhalla", "Battlefield 1",
  "Battlefield V", "FIFA 22", "EA Sports FC 24", "NBA 2K23", "Call of Duty Black Ops 4", "Call of Duty Black Ops Cold War",
  "Rocket League", "Shadow of the Tomb Raider", "Horizon Forbidden West", "Ratchet & Clank", "Gran Turismo 7",
  "Mortal Kombat 11", "Dragon Ball Z Kakarot", "Resident Evil 7", "Resident Evil Village", "The Last Guardian",
  "Need for Speed Heat", "Mafia Definitive Edition", "Marvel's Avengers",
];

const SWITCH_GAMES = [
  "The Legend of Zelda Breath of the Wild", "The Legend of Zelda Tears of the Kingdom", "The Legend of Zelda Link's Awakening",
  "Mario Kart 8 Deluxe", "Super Mario Odyssey", "Super Smash Bros Ultimate", "Animal Crossing New Horizons",
  "Pokemon Sword", "Pokemon Shield", "Pokemon Scarlet", "Pokemon Violet", "Luigi's Mansion 3", "Super Mario Party",
  "Mario Party Superstars", "Splatoon 3", "Splatoon 2", "Kirby and the Forgotten Land", "Metroid Dread", "Pikmin 4",
  "Super Mario Bros Wonder", "Pokemon Let's Go Pikachu", "Super Mario 3D World Bowser's Fury", "Xenoblade Chronicles 3",
];

const PS5_GAMES = [
  "Marvel's Spider-Man 2", "Spider-Man Miles Morales", "God of War Ragnarok", "Horizon Forbidden West", "Returnal",
  "Demon's Souls", "Ratchet & Clank Rift Apart", "Gran Turismo 7", "Ghost of Tsushima Director's Cut", "EA Sports FC 24",
  "Hogwarts Legacy", "Elden Ring", "Final Fantasy XVI", "Resident Evil 4", "Call of Duty Modern Warfare III",
  "The Last of Us Part I", "Astro Bot",
];

export const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");

function gameSeeds(titles: string[], platform: Platform, suffix: string): Seed[] {
  return titles.map((name) => ({ id: `game-${slug(name)}${suffix}`, category: "game" as const, brand: platform, name, variant: platform }));
}

const SEEDS: Seed[] = [
  ...consoleSeeds,
  ...phoneSeeds,
  ...controllerSeeds,
  ...gameSeeds(PS4_GAMES, "PS4", ""),
  ...gameSeeds(SWITCH_GAMES, "Switch", "-switch"),
  ...gameSeeds(PS5_GAMES, "PS5", "-ps5"),
];

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
