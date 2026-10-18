import { t } from "../i18n";
import type { Key } from "../i18n";
import { TECH } from "./catalogTech";
import type { Category, Condition, Product } from "./types";

/** Estado com texto no idioma atual: os getters leem t() no momento em que são usados. */
function cond(id: Condition, labelKey: Key, hintKey: Key): { id: Condition; label: string; hint: string } {
  return {
    id,
    get label() {
      return t(labelKey);
    },
    get hint() {
      return t(hintKey);
    },
  };
}

const DEVICE_CONDITIONS = [
  cond("A", "cond.A", "cond.A.hint"),
  cond("B", "cond.B", "cond.B.hint"),
  cond("C", "cond.C", "cond.C.hint"),
  cond("P", "cond.P", "cond.P.hint"),
];

const PHONE_CONDITIONS = [
  cond("A", "cond.A", "cond.phoneA.hint"),
  cond("B", "cond.B", "cond.phoneB.hint"),
  cond("C", "cond.C", "cond.phoneC.hint"),
  cond("P", "cond.P", "cond.phoneP.hint"),
];

export const CONDITIONS: Record<Category, { id: Condition; label: string; hint: string }[]> = {
  console: DEVICE_CONDITIONS,
  phone: PHONE_CONDITIONS,
  tablet: PHONE_CONDITIONS,
  laptop: PHONE_CONDITIONS,
  watch: PHONE_CONDITIONS,
  audio: DEVICE_CONDITIONS,
  camera: DEVICE_CONDITIONS,
  gpu: DEVICE_CONDITIONS,
  controller: [
    cond("sem-drift", "cond.sem-drift", "cond.sem-drift.hint"),
    cond("drift-leve", "cond.drift-leve", "cond.drift-leve.hint"),
    cond("defeito", "cond.defeito", "cond.defeito.hint"),
  ],
  game: [
    cond("lacrado", "cond.lacrado", "cond.lacrado.hint"),
    cond("completo", "cond.completo", "cond.completo.hint"),
    cond("so-disco", "cond.so-disco", "cond.so-disco.hint"),
  ],
};

export const CATEGORY_LABEL: Record<Category, string> = {
  get console() {
    return t("cat.console");
  },
  get phone() {
    return t("cat.phone");
  },
  get tablet() {
    return t("cat.tablet");
  },
  get laptop() {
    return t("cat.laptop");
  },
  get watch() {
    return t("cat.watch");
  },
  get audio() {
    return t("cat.audio");
  },
  get camera() {
    return t("cat.camera");
  },
  get gpu() {
    return t("cat.gpu");
  },
  get controller() {
    return t("cat.controller");
  },
  get game() {
    return t("cat.game");
  },
};

/** Variantes escritas em inglês nos dados; algumas têm tradução. */
export function variantLabel(variant: string): string {
  const key = `variant.${variant}` as Key;
  const s = t(key);
  return s === key ? variant : s;
}

/** Nome completo para mostrar: "PlayStation 5 disc" ou "PlayStation 5 com leitor". */
export function productLabel(p: Pick<Product, "name" | "variant">): string {
  const v = variantLabel(p.variant);
  // Sem variante vazia nem repetida ("PlayStation 2 Slim slim", "Nintendo 3DS XL XL").
  if (!v || p.name.toLowerCase().includes(v.toLowerCase())) return p.name;
  return `${p.name} ${v}`;
}

/** Estado sem a letra: "B · good" -> "good". */
export function conditionShort(category: Category, id: Condition): string {
  const c = CONDITIONS[category].find((x) => x.id === id);
  return c ? c.label.split("·").pop()!.trim() : id;
}

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
  { id: "ps5-disc", category: "console", brand: "Sony", name: "PlayStation 5", variant: "disc" },
  { id: "ps5-digital", category: "console", brand: "Sony", name: "PlayStation 5", variant: "digital" },
  { id: "ps5-slim-disc", category: "console", brand: "Sony", name: "PlayStation 5 Slim", variant: "1 TB disc" },
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
  { id: "wii", category: "console", brand: "Nintendo", name: "Wii", variant: "with controller" },
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
  { id: "joycon-pair", category: "controller", brand: "Nintendo", name: "Joy-Con", variant: "pair" },
  { id: "switch-pro-controller", category: "controller", brand: "Nintendo", name: "Pro Controller", variant: "Switch" },
  { id: "xbox-controller", category: "controller", brand: "Microsoft", name: "Xbox Controller", variant: "Series" },
  { id: "xbox-one-controller", category: "controller", brand: "Microsoft", name: "Xbox One Controller", variant: "One" },
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

const techSeeds: Seed[] = TECH.map(({ id, category, brand, name, variant }) => ({ id, category, brand, name, variant }));

const SEEDS: Seed[] = [
  ...consoleSeeds,
  ...phoneSeeds,
  ...techSeeds,
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
