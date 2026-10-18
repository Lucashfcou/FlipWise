import type { Category } from "./types";

/**
 * Produtos de tecnologia com muita venda em segunda mão. Cada linha traz o que pesquisar no eBay
 * e como reconhecer o modelo certo no título. Só preços do eBay por agora (sem referência de loja).
 *
 * Formato: [id, categoria, marca, nome, variante, opções]. Opções:
 *   q    texto de pesquisa (por omissão "nome variante")
 *   must expressões que o título TEM de cumprir (por omissão: as palavras do nome e a capacidade)
 *   not  expressões que o título NÃO pode cumprir (some-se às automáticas)
 */
export interface TechOptions {
  q?: string;
  must?: RegExp[];
  not?: RegExp[];
  /** Piso de plausibilidade em euros: anúncios abaixo disto são peças ou golpes. */
  min?: number;
  /** Sem consulta: os anúncios "usados" saem misturados (PCs, artigos novos) e davam preços sem sentido. */
  skip?: boolean;
}
export interface TechSeed {
  id: string;
  category: Category;
  brand: string;
  name: string;
  variant: string;
  opts: TechOptions;
}

const T = (id: string, category: Category, brand: string, name: string, variant: string, opts: TechOptions = {}): TechSeed => ({
  id, category, brand, name, variant, opts,
});

export const TECH: TechSeed[] = [
  // iPhones fora da grelha principal (11 a 15 base e Pro já estão em catalog.ts)
  T("iphone-x-64", "phone", "Apple", "iPhone X", "64 GB", { must: [/iphone\s?x\b/i, /\b64\s?gb/i], not: [/\bxs\b|\bxr\b|\bmax\b/i] }),
  T("iphone-xr-64", "phone", "Apple", "iPhone XR", "64 GB", { must: [/iphone\s?xr\b/i, /\b64\s?gb/i] }),
  T("iphone-xs-64", "phone", "Apple", "iPhone XS", "64 GB", { must: [/iphone\s?xs\b/i, /\b64\s?gb/i], not: [/\bmax\b/i] }),
  T("iphone-se-2020-64", "phone", "Apple", "iPhone SE 2020", "64 GB", { q: "iPhone SE 2020 64GB", must: [/iphone\s?se/i, /(2020|2\.?\s?(gen|generaci)|\b2nd\b)/i, /\b64\s?gb/i], not: [/2022|3\.?\s?(gen|generaci)|\b3rd\b/i] }),
  T("iphone-se-2022-64", "phone", "Apple", "iPhone SE 2022", "64 GB", { q: "iPhone SE 2022 64GB", must: [/iphone\s?se/i, /(2022|3\.?\s?(gen|generaci)|\b3rd\b)/i, /\b64\s?gb/i] }),
  T("iphone-11-pro-64", "phone", "Apple", "iPhone 11 Pro", "64 GB", { must: [/iphone\s?11\s?pro\b/i, /\b64\s?gb/i], not: [/\bmax\b/i] }),
  T("iphone-12-mini-64", "phone", "Apple", "iPhone 12 mini", "64 GB", { must: [/iphone\s?12\s?mini/i, /\b64\s?gb/i] }),
  T("iphone-13-mini-128", "phone", "Apple", "iPhone 13 mini", "128 GB", { must: [/iphone\s?13\s?mini/i, /\b128\s?gb/i] }),
  T("iphone-14-plus-128", "phone", "Apple", "iPhone 14 Plus", "128 GB", { must: [/iphone\s?14\s?plus/i, /\b128\s?gb/i] }),
  T("iphone-15-plus-128", "phone", "Apple", "iPhone 15 Plus", "128 GB", { must: [/iphone\s?15\s?plus/i, /\b128\s?gb/i] }),
  T("iphone-16-128", "phone", "Apple", "iPhone 16", "128 GB", { must: [/iphone\s?16\b/i, /\b128\s?gb/i], not: [/\b(pro|max|plus|e)\b/i] }),
  T("iphone-16-pro-128", "phone", "Apple", "iPhone 16 Pro", "128 GB", { must: [/iphone\s?16\s?pro\b/i, /\b128\s?gb/i], not: [/\bmax\b/i] }),

  // Samsung
  T("galaxy-s21-128", "phone", "Samsung", "Galaxy S21", "128 GB", { must: [/\bs21\b/i, /\b128\s?gb/i], not: [/ultra|plus|\+|\bfe\b/i] }),
  T("galaxy-s21-ultra-256", "phone", "Samsung", "Galaxy S21 Ultra", "256 GB", { must: [/\bs21\s?ultra/i, /\b256\s?gb/i] }),
  T("galaxy-s22-128", "phone", "Samsung", "Galaxy S22", "128 GB", { must: [/\bs22\b/i, /\b128\s?gb/i], not: [/ultra|plus|\+/i] }),
  T("galaxy-s22-ultra-256", "phone", "Samsung", "Galaxy S22 Ultra", "256 GB", { must: [/\bs22\s?ultra/i, /\b256\s?gb/i] }),
  T("galaxy-s23-128", "phone", "Samsung", "Galaxy S23", "128 GB", { must: [/\bs23\b/i, /\b128\s?gb/i], not: [/ultra|plus|\+|\bfe\b/i] }),
  T("galaxy-s23-ultra-256", "phone", "Samsung", "Galaxy S23 Ultra", "256 GB", { must: [/\bs23\s?ultra/i, /\b256\s?gb/i] }),
  T("galaxy-s24-128", "phone", "Samsung", "Galaxy S24", "128 GB", { must: [/\bs24\b/i, /\b128\s?gb/i], not: [/ultra|plus|\+|\bfe\b/i] }),
  T("galaxy-s24-ultra-256", "phone", "Samsung", "Galaxy S24 Ultra", "256 GB", { must: [/\bs24\s?ultra/i, /\b256\s?gb/i] }),
  T("galaxy-a54-128", "phone", "Samsung", "Galaxy A54", "128 GB", { must: [/\ba54\b/i, /\b128\s?gb/i] }),
  T("galaxy-a34-128", "phone", "Samsung", "Galaxy A34", "128 GB", { must: [/\ba34\b/i, /\b128\s?gb/i] }),
  T("galaxy-z-flip4-256", "phone", "Samsung", "Galaxy Z Flip 4", "256 GB", { must: [/flip\s?4/i, /\b256\s?gb/i] }),
  T("galaxy-z-flip5-256", "phone", "Samsung", "Galaxy Z Flip 5", "256 GB", { must: [/flip\s?5/i, /\b256\s?gb/i] }),
  T("galaxy-z-fold4-256", "phone", "Samsung", "Galaxy Z Fold 4", "256 GB", { must: [/fold\s?4/i, /\b256\s?gb/i] }),

  // Google, Xiaomi, OnePlus
  T("pixel-6-128", "phone", "Google", "Pixel 6", "128 GB", { must: [/pixel\s?6\b/i, /\b128\s?gb/i], not: [/pro|\ba\b/i] }),
  T("pixel-6a-128", "phone", "Google", "Pixel 6a", "128 GB", { must: [/pixel\s?6\s?a\b/i, /\b128\s?gb/i] }),
  T("pixel-7-128", "phone", "Google", "Pixel 7", "128 GB", { must: [/pixel\s?7\b/i, /\b128\s?gb/i], not: [/pro|\ba\b/i] }),
  T("pixel-7-pro-128", "phone", "Google", "Pixel 7 Pro", "128 GB", { must: [/pixel\s?7\s?pro/i, /\b128\s?gb/i] }),
  T("pixel-7a-128", "phone", "Google", "Pixel 7a", "128 GB", { must: [/pixel\s?7\s?a\b/i, /\b128\s?gb/i] }),
  T("pixel-8-128", "phone", "Google", "Pixel 8", "128 GB", { must: [/pixel\s?8\b/i, /\b128\s?gb/i], not: [/pro|\ba\b/i] }),
  T("pixel-8-pro-128", "phone", "Google", "Pixel 8 Pro", "128 GB", { must: [/pixel\s?8\s?pro/i, /\b128\s?gb/i] }),
  T("xiaomi-13t-256", "phone", "Xiaomi", "Xiaomi 13T", "256 GB", { must: [/\b13t\b/i, /\b256\s?gb/i], not: [/pro/i] }),
  T("poco-f5-256", "phone", "Xiaomi", "Poco F5", "256 GB", { must: [/poco\s?f5/i, /\b256\s?gb/i], not: [/pro/i] }),
  T("oneplus-11-256", "phone", "OnePlus", "OnePlus 11", "256 GB", { must: [/oneplus\s?11\b/i, /\b256\s?gb/i] }),

  // Tablets e leitores
  T("ipad-9-64", "tablet", "Apple", "iPad 9th gen", "64 GB Wi-Fi", { q: "iPad 9 64GB", must: [/ipad/i, /(\b9\b|9th|9ª|novena)/i, /\b64\s?gb/i], not: [/pro|air|mini|cellular|5g|lte/i] }),
  T("ipad-10-64", "tablet", "Apple", "iPad 10th gen", "64 GB Wi-Fi", { q: "iPad 10 64GB", must: [/ipad/i, /(\b10\b|10th|10ª|d[eé]cima)/i, /\b64\s?gb/i], not: [/pro|air|mini|cellular|5g|lte/i] }),
  T("ipad-air-4-64", "tablet", "Apple", "iPad Air 4", "64 GB Wi-Fi", { must: [/ipad\s?air/i, /(\b4\b|4th|4ª)/i, /\b64\s?gb/i], not: [/pro|mini|cellular|5g|lte/i] }),
  T("ipad-air-5-64", "tablet", "Apple", "iPad Air 5", "64 GB Wi-Fi", { must: [/ipad\s?air/i, /(\b5\b|5th|5ª|\bm1\b)/i, /\b64\s?gb/i], not: [/pro|mini|cellular|5g|lte/i] }),
  T("ipad-pro-11-m1-128", "tablet", "Apple", "iPad Pro 11 M1", "128 GB Wi-Fi", { must: [/ipad\s?pro/i, /\b11\b/i, /\bm1\b/i, /\b128\s?gb/i], not: [/12[.,]9|cellular|5g|lte/i] }),
  T("ipad-pro-11-m2-128", "tablet", "Apple", "iPad Pro 11 M2", "128 GB Wi-Fi", { must: [/ipad\s?pro/i, /\b11\b/i, /\bm2\b/i, /\b128\s?gb/i], not: [/12[.,]9|cellular|5g|lte/i] }),
  T("ipad-mini-6-64", "tablet", "Apple", "iPad mini 6", "64 GB Wi-Fi", { must: [/ipad\s?mini/i, /(\b6\b|6th|6ª)/i, /\b64\s?gb/i], not: [/cellular|5g|lte/i] }),
  T("galaxy-tab-s7-128", "tablet", "Samsung", "Galaxy Tab S7", "128 GB", { must: [/tab\s?s7/i, /\b128\s?gb/i], not: [/\bfe\b|plus|\+/i] }),
  T("galaxy-tab-s8-128", "tablet", "Samsung", "Galaxy Tab S8", "128 GB", { must: [/tab\s?s8/i, /\b128\s?gb/i], not: [/ultra|plus|\+/i] }),
  T("galaxy-tab-s9-128", "tablet", "Samsung", "Galaxy Tab S9", "128 GB", { must: [/tab\s?s9/i, /\b128\s?gb/i], not: [/ultra|plus|\+|\bfe\b/i] }),
  T("galaxy-tab-a9-64", "tablet", "Samsung", "Galaxy Tab A9", "64 GB", { must: [/tab\s?a9/i, /\b64\s?gb/i], not: [/plus|\+/i] }),
  T("kindle-paperwhite-11", "tablet", "Amazon", "Kindle Paperwhite", "11th gen 8 GB", { q: "Kindle Paperwhite 11 generation", must: [/kindle/i, /paperwhite/i, /(11|2021|11th|11ª)/i] }),
  T("kindle-10", "tablet", "Amazon", "Kindle", "10th gen", { q: "Kindle 10th generation", must: [/kindle/i, /(10|2019|10th|10ª)/i], not: [/paperwhite|oasis|scribe/i] }),

  // Portáteis
  T("macbook-air-m1-256", "laptop", "Apple", "MacBook Air M1", "8/256 GB", { must: [/macbook\s?air/i, /\bm1\b/i, /256/i], not: [/\bm2\b|\bm3\b|pro/i] }),
  T("macbook-air-m1-512", "laptop", "Apple", "MacBook Air M1", "8/512 GB", { must: [/macbook\s?air/i, /\bm1\b/i, /512/i], not: [/\bm2\b|\bm3\b|pro/i] }),
  T("macbook-air-m2-256", "laptop", "Apple", "MacBook Air M2", "8/256 GB", { must: [/macbook\s?air/i, /\bm2\b/i, /256/i], not: [/\bm1\b|\bm3\b|pro|15/i] }),
  T("macbook-air-m2-512", "laptop", "Apple", "MacBook Air M2", "8/512 GB", { must: [/macbook\s?air/i, /\bm2\b/i, /512/i], not: [/\bm1\b|\bm3\b|pro|15/i] }),
  T("macbook-air-m3-256", "laptop", "Apple", "MacBook Air M3", "8/256 GB", { must: [/macbook\s?air/i, /\bm3\b/i, /256/i], not: [/\bm1\b|\bm2\b|pro/i] }),
  T("macbook-pro-13-m1-256", "laptop", "Apple", "MacBook Pro 13 M1", "8/256 GB", { must: [/macbook\s?pro/i, /\b13\b/i, /\bm1\b/i, /256/i], not: [/\bm2\b|\bm3\b|max|\bpro\s?m1\s?pro/i] }),
  T("macbook-pro-14-m1pro-512", "laptop", "Apple", "MacBook Pro 14 M1 Pro", "16/512 GB", { must: [/macbook\s?pro/i, /\b14\b/i, /m1\s?pro/i, /512/i], not: [/max|\bm2\b|\bm3\b/i] }),
  T("macbook-pro-14-m2pro-512", "laptop", "Apple", "MacBook Pro 14 M2 Pro", "16/512 GB", { must: [/macbook\s?pro/i, /\b14\b/i, /m2\s?pro/i, /512/i], not: [/max|\bm1\b|\bm3\b/i] }),
  T("macbook-pro-16-m1pro-512", "laptop", "Apple", "MacBook Pro 16 M1 Pro", "16/512 GB", { must: [/macbook\s?pro/i, /\b16\b/i, /m1\s?pro/i, /512/i], not: [/max|\bm2\b|\bm3\b/i] }),

  // Relógios
  T("apple-watch-se-44", "watch", "Apple", "Apple Watch SE", "44 mm GPS", { must: [/watch\s?se/i, /44/i], not: [/\b2\b|2nd|2ª|ultra|cellular|lte/i] }),
  T("apple-watch-s6-44", "watch", "Apple", "Apple Watch Series 6", "44 mm GPS", { must: [/watch/i, /(series|serie)\s?6|\bs6\b/i, /44/i], not: [/cellular|lte/i] }),
  T("apple-watch-s7-45", "watch", "Apple", "Apple Watch Series 7", "45 mm GPS", { must: [/watch/i, /(series|serie)\s?7|\bs7\b/i, /45/i], not: [/cellular|lte/i] }),
  T("apple-watch-s8-45", "watch", "Apple", "Apple Watch Series 8", "45 mm GPS", { must: [/watch/i, /(series|serie)\s?8|\bs8\b/i, /45/i], not: [/cellular|lte/i] }),
  T("apple-watch-s9-45", "watch", "Apple", "Apple Watch Series 9", "45 mm GPS", { must: [/watch/i, /(series|serie)\s?9|\bs9\b/i, /45/i], not: [/cellular|lte/i] }),
  T("apple-watch-ultra-49", "watch", "Apple", "Apple Watch Ultra", "49 mm", { must: [/watch\s?ultra/i], not: [/\b2\b|ultra\s?2/i] }),
  T("galaxy-watch-5-44", "watch", "Samsung", "Galaxy Watch 5", "44 mm", { must: [/watch\s?5/i, /44/i], not: [/pro|lte/i] }),
  T("galaxy-watch-6-44", "watch", "Samsung", "Galaxy Watch 6", "44 mm", { must: [/watch\s?6/i, /44/i], not: [/classic|lte/i] }),
  T("garmin-forerunner-255", "watch", "Garmin", "Forerunner 255", "", { must: [/forerunner\s?255/i], not: [/music/i] }),
  T("garmin-forerunner-265", "watch", "Garmin", "Forerunner 265", "", { must: [/forerunner\s?265/i] }),

  // Áudio
  T("airpods-2", "audio", "Apple", "AirPods 2", "", { q: "AirPods 2nd generation", must: [/airpods/i, /(2nd|2ª|2\.?\s?gen|\b2\b|segunda)/i], not: [/pro|max|3|case only|solo\s?(auricular|estuche)/i] }),
  T("airpods-3", "audio", "Apple", "AirPods 3", "", { q: "AirPods 3rd generation", must: [/airpods/i, /(3rd|3ª|3\.?\s?gen|\b3\b|tercera)/i], not: [/pro|max/i] }),
  T("airpods-pro-1", "audio", "Apple", "AirPods Pro", "1st gen", { q: "AirPods Pro 1st generation", must: [/airpods\s?pro/i], not: [/2nd|2ª|\b2\b|segunda|max/i] }),
  T("airpods-pro-2", "audio", "Apple", "AirPods Pro 2", "", { q: "AirPods Pro 2nd generation", must: [/airpods\s?pro/i, /(2nd|2ª|\b2\b|segunda|2\.?\s?gen)/i], not: [/max/i] }),
  T("airpods-max", "audio", "Apple", "AirPods Max", "", { must: [/airpods\s?max/i] }),
  T("sony-wh1000xm4", "audio", "Sony", "WH-1000XM4", "", { must: [/xm4/i, /(wh|1000)/i], not: [/wf/i] }),
  T("sony-wh1000xm5", "audio", "Sony", "WH-1000XM5", "", { must: [/xm5/i, /(wh|1000)/i], not: [/wf/i] }),
  T("sony-wf1000xm4", "audio", "Sony", "WF-1000XM4", "", { must: [/wf.?1000\s?xm4|xm4.*wf/i] }),
  T("sony-wf1000xm5", "audio", "Sony", "WF-1000XM5", "", { must: [/wf.?1000\s?xm5|xm5.*wf/i] }),
  T("bose-qc45", "audio", "Bose", "QuietComfort 45", "", { must: [/(qc|quietcomfort)\s?45/i] }),
  T("bose-qc-ultra", "audio", "Bose", "QuietComfort Ultra", "headphones", { must: [/(qc|quietcomfort)\s?ultra/i], not: [/earbud|buds/i] }),
  T("galaxy-buds2-pro", "audio", "Samsung", "Galaxy Buds2 Pro", "", { must: [/buds\s?2\s?pro/i] }),
  T("jbl-flip-6", "audio", "JBL", "Flip 6", "speaker", { must: [/jbl/i, /flip\s?6/i] }),
  T("jbl-charge-5", "audio", "JBL", "Charge 5", "speaker", { must: [/jbl/i, /charge\s?5/i] }),

  // Câmaras, drones e acessórios de ação
  T("gopro-hero-10", "camera", "GoPro", "GoPro Hero 10", "Black", { must: [/hero\s?10/i], not: [/mount|soporte|bateria|battery/i] }),
  T("gopro-hero-11", "camera", "GoPro", "GoPro Hero 11", "Black", { must: [/hero\s?11/i], not: [/mini|mount|soporte|bateria|battery/i] }),
  T("gopro-hero-12", "camera", "GoPro", "GoPro Hero 12", "Black", { must: [/hero\s?12/i], not: [/mount|soporte|bateria|battery/i] }),
  T("dji-osmo-action-4", "camera", "DJI", "Osmo Action 4", "", { must: [/action\s?4/i, /(dji|osmo)/i] }),
  T("dji-osmo-pocket-3", "camera", "DJI", "Osmo Pocket 3", "", { must: [/pocket\s?3/i, /(dji|osmo)/i] }),
  T("dji-mini-2", "camera", "DJI", "Mini 2", "drone", { must: [/mini\s?2/i, /dji/i], not: [/se\b|mini\s?2\s?se/i] }),
  T("dji-mini-3", "camera", "DJI", "Mini 3", "drone", { must: [/mini\s?3\b/i, /dji/i], not: [/pro/i] }),
  T("dji-mini-3-pro", "camera", "DJI", "Mini 3 Pro", "drone", { must: [/mini\s?3\s?pro/i, /dji/i] }),
  T("dji-mini-4-pro", "camera", "DJI", "Mini 4 Pro", "drone", { must: [/mini\s?4\s?pro/i, /dji/i] }),
  T("sony-a6400-body", "camera", "Sony", "Alpha a6400", "body", { must: [/(a6400|alpha\s?6400)/i] }),
  T("canon-eos-250d-body", "camera", "Canon", "EOS 250D", "body", { must: [/250d/i, /canon/i] }),

  // Placas gráficas
  T("gpu-gtx-1660-super", "gpu", "NVIDIA", "GeForce GTX 1660 Super", "6 GB", { must: [/1660\s?super/i] }),
  T("gpu-rtx-3060-12", "gpu", "NVIDIA", "GeForce RTX 3060", "12 GB", { must: [/3060/i, /12\s?gb/i], not: [/\bti\b|laptop|portatil|notebook/i] }),
  T("gpu-rtx-3060ti", "gpu", "NVIDIA", "GeForce RTX 3060 Ti", "8 GB", { must: [/3060\s?ti/i], not: [/laptop|portatil|notebook/i] }),
  T("gpu-rtx-3070", "gpu", "NVIDIA", "GeForce RTX 3070", "8 GB", { must: [/3070/i], not: [/\bti\b|laptop|portatil|notebook/i] }),
  T("gpu-rtx-3080", "gpu", "NVIDIA", "GeForce RTX 3080", "10 GB", { must: [/3080/i], not: [/\bti\b|laptop|portatil|notebook/i] }),
  T("gpu-rtx-4060", "gpu", "NVIDIA", "GeForce RTX 4060", "8 GB", { must: [/4060/i], not: [/\bti\b|laptop|portatil|notebook/i] }),
  T("gpu-rtx-4060ti", "gpu", "NVIDIA", "GeForce RTX 4060 Ti", "8 GB", { must: [/4060\s?ti/i], not: [/laptop|portatil|notebook/i] }),
  T("gpu-rtx-4070", "gpu", "NVIDIA", "GeForce RTX 4070", "12 GB", { must: [/4070/i], not: [/\bti\b|super|laptop|portatil|notebook/i] }),
  T("gpu-rx-6600", "gpu", "AMD", "Radeon RX 6600", "8 GB", { must: [/rx\s?6600/i], not: [/xt/i] }),
  T("gpu-rx-6700xt", "gpu", "AMD", "Radeon RX 6700 XT", "12 GB", { must: [/6700\s?xt/i] }),
  T("gpu-rx-6800xt", "gpu", "AMD", "Radeon RX 6800 XT", "16 GB", { must: [/6800\s?xt/i] }),

  // Mais consolas e portáteis de jogos
  T("psvr2", "console", "Sony", "PlayStation VR2", "", { must: [/(psvr\s?2|vr\s?2)/i, /(playstation|ps5|sony)/i] }),
  T("meta-quest-2-128", "console", "Meta", "Meta Quest 2", "128 GB", { must: [/quest\s?2/i, /128/i] }),
  T("meta-quest-3-128", "console", "Meta", "Meta Quest 3", "128 GB", { must: [/quest\s?3\b/i, /128/i], not: [/3s/i] }),
  T("rog-ally-z1-extreme", "console", "ASUS", "ROG Ally", "Z1 Extreme", { must: [/rog\s?ally/i], not: [/\bx\b|ally\s?x/i] }),
  T("lenovo-legion-go", "console", "Lenovo", "Legion Go", "512 GB", { must: [/legion\s?go/i] }),
  T("gba-sp", "console", "Nintendo", "Game Boy Advance SP", "", { must: [/(advance|gba)\s?sp|\bsp\b/i, /(game\s?boy|gba)/i] }),
  T("nds-lite", "console", "Nintendo", "Nintendo DS Lite", "", { must: [/ds\s?lite/i] }),
  T("n3ds", "console", "Nintendo", "Nintendo 3DS", "", { must: [/\b3ds\b/i], not: [/xl|2ds/i] }),
  T("ps1", "console", "Sony", "PlayStation 1", "PSone", { q: "PlayStation 1 PSone consola", must: [/(ps1|psone|playstation\s?1|psx)/i], not: [/ps2|ps3/i] }),
];

/**
 * Ajustes depois da primeira corrida real: placas gráficas vinham misturadas com PCs completos, drones com baterias
 * e hélices, AirPods com auriculares soltos. `min` é um piso de plausibilidade (abaixo disto é peça ou golpe).
 */
const PC = /\b(pc|ordenador|desktop|torre|sobremesa|computer|komplett|rechner|ryzen|i[3579][- ]?\d{4,5}|intel)\b/i;
const SPARE = /(bater[ií]a|battery|h[eé]lice|propeller|bolsa|bag|maleta|filtro|filter|soporte|repuesto|spare|cable|cargador|charger|hub|palo|stick)/i;
const SINGLE = /(izquierdo|derecho|\bleft\b|\bright\b|solo\s?(el\s)?(auricular|estuche|case)|estuche\s?(solo|de carga)|charging case|\bcase only\b|einzeln|\blinks\b|\brechts\b)/i;

const PATCH: Record<string, { min?: number; not?: RegExp[]; skip?: boolean }> = {
  "gpu-gtx-1660-super": { min: 80, not: [PC] },
  "gpu-rtx-3060-12": { skip: true },
  "gpu-rtx-3060ti": { min: 180, not: [PC] },
  "gpu-rtx-3070": { min: 200, not: [PC] },
  "gpu-rtx-3080": { min: 300, not: [PC] },
  "gpu-rtx-4060": { skip: true },
  "gpu-rtx-4060ti": { skip: true },
  "gpu-rtx-4070": { skip: true },
  "gpu-rx-6600": { min: 120, not: [PC] },
  "gpu-rx-6700xt": { min: 170, not: [PC] },
  "gpu-rx-6800xt": { min: 270, not: [PC] },
  "dji-mini-2": { min: 150, not: [SPARE] },
  "dji-mini-3": { min: 200, not: [SPARE] },
  "dji-mini-3-pro": { min: 280, not: [SPARE] },
  "dji-mini-4-pro": { min: 450, not: [SPARE] },
  "airpods-max": { min: 220, not: [/(almohadilla|ears?cushion|cojin|cushion|pads?)/i] },
  "airpods-3": { min: 60, not: [SINGLE] },
  "airpods-pro-1": { min: 55, not: [SINGLE] },
  "airpods-pro-2": { min: 100, not: [SINGLE] },
  "sony-wh1000xm5": { min: 100, not: [/(almohadilla|earpad|ear pad|pads)/i] },
  "sony-wh1000xm4": { min: 60, not: [/(almohadilla|earpad|ear pad|pads)/i] },
};

for (const s of TECH) {
  const p = PATCH[s.id];
  if (!p) continue;
  s.opts.min = p.min ?? s.opts.min;
  if (p.skip) s.opts.skip = true;
  s.opts.not = [...(s.opts.not ?? []), ...(p.not ?? [])];
}
