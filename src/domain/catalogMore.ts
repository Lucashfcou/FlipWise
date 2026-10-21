import type { TechSeed } from "./catalogTech";
import type { Category } from "./types";
import KEEP from "../data/more-keep.json";

/**
 * Catálogo grande, escrito por listas (marca, modelos, variantes) em vez de uma linha por produto. O filtro de cada produto
 * é automático: o código do modelo tem de aparecer inteiro no título, as capacidades têm de bater e peças/acessórios saem.
 * Depois de buscar os preços (npm run ebay:refresh -- --more), o script de poda guarda em data/more-keep.json só os produtos
 * com anúncios suficientes; o que não tem dados não aparece na app.
 */

/** Marca, modelos separados por vírgula, variantes separadas por "/" (capacidades), tipo de aparelho (para a categoria do eBay). */
type Row = [brand: string, models: string, variants?: string, type?: string];

const MIN_PRICE: Partial<Record<Category, number>> = {
  phone: 40, tablet: 40, laptop: 60, cpu: 20, gpu: 35, storage: 8, monitor: 40, peripheral: 8, audio: 12, camera: 40, watch: 20, console: 20, controller: 10, desktop: 80,
};

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Categorias onde o tipo de aparelho é sempre o mesmo: só aí se pesquisa dentro de uma categoria do eBay. */
const TYPED = new Set<Category>(["cpu", "gpu", "phone", "tablet", "laptop", "monitor", "storage"]);

function build(category: Category, defaultType: string, rows: Row[]): TechSeed[] {
  const out: TechSeed[] = [];
  for (const [brand, models, variants, type] of rows) {
    for (const name of models.split(",").map((x) => x.trim()).filter(Boolean)) {
      for (const variant of variants ? variants.split("/").map((x) => x.trim()) : [""]) {
        const specs = (variant.match(/\d+\s?(?:gb|tb)/gi) ?? []).map((x) => x.replace(/\s+/g, "").toUpperCase());
        out.push({
          id: slug(`${brand}-${name}-${variant}`),
          category,
          brand,
          name,
          variant,
          opts: { auto: true, q: `${brand} ${name}`, type: TYPED.has(category) ? (type ?? defaultType) : "", specs, min: MIN_PRICE[category] },
        });
      }
    }
  }
  return out;
}

const CPU: Row[] = [
  ["AMD", "Ryzen 3 3100,Ryzen 3 3300X,Ryzen 3 4100,Ryzen 5 1600,Ryzen 5 2600,Ryzen 5 3500,Ryzen 5 3600,Ryzen 5 3600X,Ryzen 5 4500,Ryzen 5 5500,Ryzen 5 5600,Ryzen 5 5600G,Ryzen 5 5600X,Ryzen 5 7500F,Ryzen 5 7600,Ryzen 5 7600X,Ryzen 7 1700,Ryzen 7 2700,Ryzen 7 2700X,Ryzen 7 3700X,Ryzen 7 3800X,Ryzen 7 5700G,Ryzen 7 5700X,Ryzen 7 5700X3D,Ryzen 7 5800X,Ryzen 7 5800X3D,Ryzen 7 7700,Ryzen 7 7700X,Ryzen 7 7800X3D,Ryzen 9 3900X,Ryzen 9 3950X,Ryzen 9 5900X,Ryzen 9 5950X,Ryzen 9 7900,Ryzen 9 7900X,Ryzen 9 7950X,Ryzen 9 7950X3D"],
  ["Intel", "Core i3-8100,Core i3-9100F,Core i3-10100,Core i3-12100F,Core i5-8400,Core i5-9400F,Core i5-10400F,Core i5-11400F,Core i5-12400F,Core i5-12600K,Core i5-13400F,Core i5-13600K,Core i5-14400F,Core i5-14600K,Core i7-8700K,Core i7-9700K,Core i7-10700K,Core i7-11700K,Core i7-12700K,Core i7-13700K,Core i7-14700K,Core i9-9900K,Core i9-10900K,Core i9-11900K,Core i9-12900K,Core i9-13900K,Core i9-14900K"],
];

const GPU: Row[] = [
  ["NVIDIA", "GeForce GTX 1050 Ti,GeForce GTX 1060 6GB,GeForce GTX 1070 Ti,GeForce GTX 1080,GeForce GTX 1650 Super,GeForce GTX 1660,GeForce GTX 1660 Super,GeForce GTX 1660 Ti,GeForce RTX 2060 Super,GeForce RTX 2070,GeForce RTX 2070 Super,GeForce RTX 2080,GeForce RTX 2080 Super,GeForce RTX 2080 Ti,GeForce RTX 3050,GeForce RTX 3070 Ti,GeForce RTX 3080 Ti,GeForce RTX 3090,GeForce RTX 4060 Ti,GeForce RTX 4070 Super,GeForce RTX 4070 Ti,GeForce RTX 4070 Ti Super,GeForce RTX 4080,GeForce RTX 4080 Super,GeForce RTX 4090"],
  ["AMD", "Radeon RX 470,Radeon RX 480,Radeon RX 570,Radeon RX 590,Radeon RX 5500 XT,Radeon RX 5600 XT,Radeon RX 5700,Radeon RX 5700 XT,Radeon RX 6500 XT,Radeon RX 6600 XT,Radeon RX 6650 XT,Radeon RX 6700,Radeon RX 6700 XT,Radeon RX 6750 XT,Radeon RX 6800,Radeon RX 6900 XT,Radeon RX 7600,Radeon RX 7700 XT,Radeon RX 7800 XT,Radeon RX 7900 GRE,Radeon RX 7900 XT,Radeon RX 7900 XTX"],
  ["Intel", "Arc A380,Arc A750,Arc A770"],
];

const PHONES_APPLE: Row[] = [
  ["Apple", "iPhone 7,iPhone 8", "32 GB/64 GB/128 GB/256 GB"],
  ["Apple", "iPhone 8 Plus,iPhone XS,iPhone XS Max,iPhone XR", "64 GB/128 GB/256 GB"],
  ["Apple", "iPhone 11,iPhone 11 Pro,iPhone 11 Pro Max", "64 GB/128 GB/256 GB/512 GB"],
  ["Apple", "iPhone 12,iPhone 12 mini,iPhone 12 Pro,iPhone 12 Pro Max", "64 GB/128 GB/256 GB/512 GB"],
  ["Apple", "iPhone 13,iPhone 13 mini,iPhone 13 Pro,iPhone 13 Pro Max", "128 GB/256 GB/512 GB/1 TB"],
  ["Apple", "iPhone 14,iPhone 14 Plus,iPhone 14 Pro,iPhone 14 Pro Max", "128 GB/256 GB/512 GB/1 TB"],
  ["Apple", "iPhone 15,iPhone 15 Plus,iPhone 15 Pro,iPhone 15 Pro Max", "128 GB/256 GB/512 GB/1 TB"],
  ["Apple", "iPhone 16,iPhone 16 Plus,iPhone 16 Pro,iPhone 16 Pro Max", "128 GB/256 GB/512 GB/1 TB"],
  ["Apple", "iPhone SE 2020,iPhone SE 2022", "64 GB/128 GB/256 GB"],
];

const PHONES: Row[] = [
  ["Samsung", "Galaxy S10,Galaxy S10+,Galaxy S10e,Galaxy S20,Galaxy S20+,Galaxy S20 FE,Galaxy S20 Ultra,Galaxy S21,Galaxy S21+,Galaxy S21 FE,Galaxy S21 Ultra,Galaxy S22,Galaxy S22+,Galaxy S22 Ultra,Galaxy S23,Galaxy S23+,Galaxy S23 FE,Galaxy S23 Ultra,Galaxy S24,Galaxy S24+,Galaxy S24 FE,Galaxy S24 Ultra,Galaxy S25,Galaxy S25+,Galaxy S25 Ultra", "128 GB/256 GB/512 GB"],
  ["Samsung", "Galaxy Note 10,Galaxy Note 10+,Galaxy Note 20,Galaxy Note 20 Ultra", "256 GB/512 GB"],
  ["Samsung", "Galaxy A13,Galaxy A14,Galaxy A15,Galaxy A23,Galaxy A25,Galaxy A33,Galaxy A34,Galaxy A35,Galaxy A52,Galaxy A52s,Galaxy A53,Galaxy A54,Galaxy A55,Galaxy A72,Galaxy A73", "64 GB/128 GB/256 GB"],
  ["Samsung", "Galaxy Z Flip3,Galaxy Z Flip4,Galaxy Z Flip5,Galaxy Z Flip6,Galaxy Z Fold3,Galaxy Z Fold4,Galaxy Z Fold5,Galaxy Z Fold6", "256 GB/512 GB"],
  ["Xiaomi", "Redmi Note 10,Redmi Note 10 Pro,Redmi Note 11,Redmi Note 11 Pro,Redmi Note 12,Redmi Note 12 Pro,Redmi Note 12 Pro+,Redmi Note 13,Redmi Note 13 Pro,Redmi Note 13 Pro+,Redmi 12,Redmi 13C", "64 GB/128 GB/256 GB"],
  ["Xiaomi", "Poco X3 Pro,Poco X4 Pro,Poco X5 Pro,Poco X6,Poco X6 Pro,Poco F3,Poco F4,Poco F5,Poco F6,Poco M5,Xiaomi 11T,Xiaomi 11T Pro,Xiaomi 12,Xiaomi 12T,Xiaomi 12T Pro,Xiaomi 13,Xiaomi 13T,Xiaomi 13T Pro,Xiaomi 14,Xiaomi 14T", "128 GB/256 GB/512 GB"],
  ["Google", "Pixel 4a,Pixel 5,Pixel 5a,Pixel 6,Pixel 6a,Pixel 6 Pro,Pixel 7,Pixel 7a,Pixel 7 Pro,Pixel 8,Pixel 8a,Pixel 8 Pro,Pixel 9,Pixel 9 Pro,Pixel 9 Pro XL", "128 GB/256 GB/512 GB"],
  ["OnePlus", "OnePlus 8,OnePlus 8T,OnePlus 9,OnePlus 9 Pro,OnePlus 10 Pro,OnePlus 11,OnePlus 12,OnePlus Nord 2,OnePlus Nord 3,OnePlus Nord CE 2,OnePlus Nord CE 3", "128 GB/256 GB"],
  ["Motorola", "Moto G54,Moto G84,Moto G73,Moto G72,Moto G62,Moto G200,Edge 20,Edge 30,Edge 40,Edge 40 Neo,Razr 40,Razr 40 Ultra", "128 GB/256 GB"],
  ["Huawei", "P30,P30 Pro,P40,P40 Pro,Mate 20 Pro,Mate 30 Pro,Nova 9", "128 GB/256 GB"],
  ["Realme", "Realme 9 Pro,Realme 10 Pro,Realme 11 Pro,Realme GT 2 Pro,Realme GT Neo 3", "128 GB/256 GB"],
  ["OPPO", "Find X3 Pro,Find X5 Pro,Reno 8,Reno 10,Reno 11", "128 GB/256 GB"],
  ["Sony", "Xperia 1 III,Xperia 5 III,Xperia 10 IV", "128 GB/256 GB"],
  ["Nothing", "Phone (1),Phone (2),Phone (2a)", "128 GB/256 GB"],
];

const TABLETS: Row[] = [
  ["Apple", "iPad 6,iPad 7,iPad 8,iPad 9,iPad 10", "32 GB/64 GB/128 GB/256 GB"],
  ["Apple", "iPad Air 2,iPad Air 3,iPad Air 4,iPad Air 5,iPad Air 11 M2", "64 GB/128 GB/256 GB"],
  ["Apple", "iPad mini 4,iPad mini 5,iPad mini 6,iPad mini 7", "64 GB/128 GB/256 GB"],
  ["Apple", "iPad Pro 10.5,iPad Pro 11 2018,iPad Pro 11 2020,iPad Pro 11 M1,iPad Pro 11 M2,iPad Pro 12.9 2018,iPad Pro 12.9 2020,iPad Pro 12.9 M1,iPad Pro 12.9 M2", "128 GB/256 GB/512 GB/1 TB"],
  ["Samsung", "Galaxy Tab A7,Galaxy Tab A7 Lite,Galaxy Tab A8,Galaxy Tab A9,Galaxy Tab A9+,Galaxy Tab S6,Galaxy Tab S6 Lite,Galaxy Tab S7,Galaxy Tab S7 FE,Galaxy Tab S7+,Galaxy Tab S8,Galaxy Tab S8+,Galaxy Tab S8 Ultra,Galaxy Tab S9,Galaxy Tab S9 FE,Galaxy Tab S9+,Galaxy Tab S9 Ultra", "32 GB/64 GB/128 GB/256 GB"],
  ["Xiaomi", "Pad 5,Pad 6,Redmi Pad", "64 GB/128 GB/256 GB"],
  ["Lenovo", "Tab P11,Tab P11 Pro,Tab M10,Tab M10 Plus", "64 GB/128 GB"],
  ["Microsoft", "Surface Go 2,Surface Go 3,Surface Pro 6,Surface Pro 7,Surface Pro 8,Surface Pro 9", "128 GB/256 GB/512 GB"],
  ["Amazon", "Fire HD 8,Fire HD 10,Fire 7", "32 GB/64 GB"],
  ["Huawei", "MatePad 11,MatePad Pro", "128 GB/256 GB"],
];

const LAPTOPS: Row[] = [
  ["Apple", "MacBook Air 2017,MacBook Air 2019,MacBook Air 2020 Intel,MacBook Air M1,MacBook Air M2,MacBook Air M3,MacBook Air 15 M2,MacBook Air 15 M3,MacBook Pro 13 2017,MacBook Pro 13 2019,MacBook Pro 13 2020 Intel,MacBook Pro 13 M1,MacBook Pro 13 M2,MacBook Pro 14 M1 Pro,MacBook Pro 14 M2 Pro,MacBook Pro 14 M3,MacBook Pro 14 M3 Pro,MacBook Pro 15 2018,MacBook Pro 15 2019,MacBook Pro 16 2019,MacBook Pro 16 M1 Pro,MacBook Pro 16 M2 Pro,MacBook Pro 16 M3 Pro"],
  ["Dell", "XPS 13 9310,XPS 13 9315,XPS 13 9380,XPS 13 9360,XPS 15 9500,XPS 15 9510,XPS 15 9520,XPS 15 7590,Latitude 5400,Latitude 5410,Latitude 5420,Latitude 5490,Latitude 5500,Latitude 7400,Latitude 7490,Latitude 7420,Inspiron 15 3000,Inspiron 15 5000,Inspiron 14 5000,Vostro 3500,G15 5511,G15 5520"],
  ["Lenovo", "ThinkPad T14,ThinkPad T14s,ThinkPad T480,ThinkPad T480s,ThinkPad T490,ThinkPad T495,ThinkPad T580,ThinkPad T590,ThinkPad X1 Carbon Gen 6,ThinkPad X1 Carbon Gen 7,ThinkPad X1 Carbon Gen 8,ThinkPad X1 Carbon Gen 9,ThinkPad X1 Carbon Gen 10,ThinkPad X280,ThinkPad X390,ThinkPad L14,ThinkPad L15,ThinkPad E14,ThinkPad E15,ThinkPad P1,ThinkPad P52,ThinkPad P53,ThinkPad T460,ThinkPad T470,ThinkPad T450,IdeaPad 3,IdeaPad 5,IdeaPad S145,IdeaPad Gaming 3,Legion 5,Legion 5 Pro,Legion Y540,Yoga 7,Yoga Slim 7"],
  ["HP", "EliteBook 840 G5,EliteBook 840 G6,EliteBook 840 G7,EliteBook 840 G8,EliteBook 830 G7,EliteBook 850 G5,EliteBook 850 G6,EliteBook 745 G5,ProBook 450 G7,ProBook 450 G8,ProBook 430 G7,ZBook Fury 15 G7,ZBook Studio G5,Pavilion 15,Pavilion 14,Pavilion Gaming 15,Envy 13,Envy 15,Envy x360,Spectre x360 13,Spectre x360 14,Omen 15,Victus 15,250 G7,250 G8,255 G8"],
  ["Asus", "VivoBook 15,VivoBook X515,VivoBook S15,VivoBook Pro 15,ZenBook 14,ZenBook 13,ZenBook Flip 13,ROG Zephyrus G14,ROG Zephyrus G15,ROG Strix G15,ROG Strix G17,TUF Gaming F15,TUF Gaming A15,TUF Gaming F17,Chromebook Flip C434,ExpertBook B1"],
  ["Acer", "Aspire 3,Aspire 5,Aspire 7,Swift 3,Swift 5,Nitro 5,Predator Helios 300,Predator Triton 300,TravelMate P2,Chromebook Spin 713,Chromebook 314"],
  ["MSI", "GF63 Thin,Katana GF66,Katana 15,Cyborg 15,Stealth 15M,Raider GE76,Modern 14,Prestige 14,Pulse GL66"],
  ["Microsoft", "Surface Laptop 2,Surface Laptop 3,Surface Laptop 4,Surface Laptop 5,Surface Laptop Go,Surface Book 2,Surface Book 3"],
  ["Samsung", "Galaxy Book Pro,Galaxy Book2,Galaxy Book3,Galaxy Chromebook"],
  ["Razer", "Blade 14,Blade 15,Blade 17,Blade Stealth 13"],
  ["LG", "Gram 14,Gram 15,Gram 16,Gram 17"],
];

const DESKTOPS: Row[] = [
  ["Apple", "Mac mini 2014,Mac mini 2018,Mac mini M1,Mac mini M2,Mac mini M2 Pro,iMac 21.5 2017,iMac 27 2017,iMac 27 2019,iMac 24 M1,iMac 27 2020,Mac Studio M1 Max,Mac Studio M2 Max"],
  ["Intel", "NUC 8,NUC 10,NUC 11,NUC 12"],
  ["Dell", "OptiPlex 3070,OptiPlex 5060,OptiPlex 7040,OptiPlex 7050,OptiPlex 7070"],
  ["HP", "EliteDesk 800 G3,EliteDesk 800 G4,ProDesk 400 G5,Z2 Mini G4"],
  ["Lenovo", "ThinkCentre M720q,ThinkCentre M920q,ThinkCentre M910q,ThinkCentre M70q"],
];

const STORAGE: Row[] = [
  ["Samsung", "970 EVO Plus,970 EVO,980,980 Pro,990 Pro,870 EVO,860 EVO,860 QVO,870 QVO", "250 GB/500 GB/1 TB/2 TB", "ssd"],
  ["Western Digital", "WD Blue SN570,WD Blue SN550,WD Blue SN580,WD Black SN750,WD Black SN770,WD Black SN850,WD Black SN850X,WD Green SN350", "250 GB/500 GB/1 TB/2 TB", "ssd"],
  ["Crucial", "MX500,P2,P3,P3 Plus,P5 Plus,BX500,T500", "250 GB/500 GB/1 TB/2 TB", "ssd"],
  ["Kingston", "A400,NV1,NV2,KC3000,Fury Renegade,A2000", "240 GB/480 GB/500 GB/960 GB/1 TB/2 TB", "ssd"],
  ["Seagate", "Barracuda,FireCuda 530,FireCuda 520,IronWolf,Expansion Portable", "1 TB/2 TB/4 TB/8 TB", "hard drive"],
  ["Western Digital", "WD Blue HDD,WD Red,WD Elements,My Passport,My Book", "1 TB/2 TB/4 TB/6 TB", "hard drive"],
  ["Samsung", "T5,T7,T7 Shield,X5", "500 GB/1 TB/2 TB", "ssd"],
  ["SanDisk", "Extreme Portable SSD,Extreme Pro,Ultra 3D", "500 GB/1 TB/2 TB", "ssd"],
  ["Corsair", "Vengeance LPX DDR4,Vengeance RGB Pro DDR4,Vengeance DDR5,Dominator Platinum DDR5", "16 GB/32 GB/64 GB", "ram"],
  ["G.Skill", "Ripjaws V DDR4,Trident Z RGB DDR4,Trident Z5 DDR5,Ripjaws S5 DDR5", "16 GB/32 GB/64 GB", "ram"],
  ["Kingston", "Fury Beast DDR4,Fury Beast DDR5,Fury Renegade DDR5", "16 GB/32 GB/64 GB", "ram"],
  ["Crucial", "Ballistix DDR4,Pro DDR5", "16 GB/32 GB", "ram"],
];

const MONITORS: Row[] = [
  ["Dell", "S2721DGF,S2721QS,S2722DGM,U2419H,U2720Q,U2723QE,U2722D,P2419H,P2422H,P2722H,P2723QE,S2421HS,SE2422H,UltraSharp U3223QE", undefined, "monitor"],
  ["LG", "27GL850,27GL83A,27GN800,27GN950,24GN600,27GP850,32GK650F,27UL500,27UK650,34WN80C,34GN850,UltraGear 27GP83B,24MK430H,27MK430H", undefined, "monitor"],
  ["Samsung", "Odyssey G3 24,Odyssey G5 27,Odyssey G5 32,Odyssey G7 27,Odyssey G7 32,Odyssey G9,Odyssey Neo G8,M5 27,M7 32,S24R350,S27R350,ViewFinity S8", undefined, "monitor"],
  ["AOC", "24G2U,24G2,27G2U,27G2,Q27G2U,C24G1,CQ27G2,U28G2XU,24B2XH,27B2H,Agon AG274QZM", undefined, "monitor"],
  ["Asus", "TUF VG249Q,TUF VG259QM,TUF VG27AQ,TUF VG27AQL1A,TUF VG259Q,ProArt PA278QV,ROG Swift PG279QM,ROG Strix XG27AQ,VP249QGR,VG279Q,MG279Q,ZenScreen MB16AC", undefined, "monitor"],
  ["Acer", "Nitro XV272U,Nitro VG270,Nitro VG240Y,Predator XB271HU,Predator X27,KG241Q,SB220Q,R240HY,Nitro XV252Q,ED273", undefined, "monitor"],
  ["BenQ", "GW2480,GW2780,EX2780Q,EX3203R,PD2700U,Zowie XL2411K,Zowie XL2546K,Mobiuz EX2710Q,GL2480", undefined, "monitor"],
  ["MSI", "Optix G24C6,Optix G27C4,Optix MAG274QRF,Optix MAG274R,Optix MAG321CQR,G2412,G274QPF,MAG274QRF-QD", undefined, "monitor"],
  ["Gigabyte", "G24F,G27Q,M27Q,M27Q-X,M32Q,G32QC,AORUS FI27Q,AORUS FI25F", undefined, "monitor"],
  ["Philips", "243V7QDSB,24E1N,242E1GSJ,272M8,275M1RZ,328E1CA,Momentum 279M1RV", undefined, "monitor"],
  ["Apple", "Studio Display,Thunderbolt Display,Pro Display XDR", undefined, "monitor"],
  ["ViewSonic", "VX2458,VX2758,XG2405,XG270QG", undefined, "monitor"],
];

const CONSOLES_MORE: Row[] = [
  ["Sony", "PlayStation VR,PlayStation 4 Pro 500 GB,PlayStation 3 Fat,PlayStation 3 Super Slim,PSP 1000,PSP 2000,PSP Go,PS Vita 1000,PlayStation Classic", undefined, "console"],
  ["Microsoft", "Xbox One 500 GB,Xbox 360 Fat,Xbox 360 Elite,Xbox Original,Xbox Series S 1 TB", undefined, "console"],
  ["Nintendo", "Game Boy,Game Boy Pocket,Game Boy Advance SP,Nintendo DS,Nintendo DSi,Nintendo 2DS,New Nintendo 3DS XL,Nintendo 3DS,GameCube,NES Classic Mini,SNES Classic Mini,Wii Mini,Nintendo NES,Virtual Boy,Switch OLED Zelda", undefined, "console"],
  ["Sega", "Mega Drive,Mega Drive 2,Master System,Saturn,Dreamcast,Game Gear,Mega Drive Mini", undefined, "console"],
  ["Valve", "Steam Deck 1 TB,Steam Deck OLED 1 TB,Steam Link", undefined, "console"],
  ["Asus", "ROG Ally Z1,ROG Ally X", undefined, "console"],
  ["Meta", "Quest 3S,Quest Pro,Quest 1,Oculus Rift S", undefined, "console"],
  ["Atari", "Atari 2600,Atari 7800,Atari Flashback", undefined, "console"],
  ["SNK", "Neo Geo Mini,Neo Geo AES", undefined, "console"],
  ["Analogue", "Pocket,Super Nt,Mega Sg", undefined, "console"],
  ["Anbernic", "RG35XX,RG405M,RG353V", undefined, "console"],
  ["Retroid", "Pocket 3+,Pocket 4 Pro", undefined, "console"],
  ["Lenovo", "Legion Go", undefined, "console"],
  ["MSI", "Claw A1M", undefined, "console"],
];

const CONTROLLERS_MORE: Row[] = [
  ["Sony", "DualSense PS5 White,DualSense Midnight Black,DualShock 4 V1,DualShock 3,PS Move,PlayStation VR2 Sense", undefined, "controller"],
  ["Microsoft", "Xbox Wireless Controller Series,Xbox 360 Controller,Xbox Elite Series 1,Xbox Adaptive Controller", undefined, "controller"],
  ["Nintendo", "Pro Controller,Joy-Con Pair Neon,Joy-Con Single,GameCube Controller,Wii Remote,Wii Nunchuk,Switch Online NES Controller", undefined, "controller"],
  ["8BitDo", "Pro 2,Ultimate Bluetooth,Ultimate 2.4g,SN30 Pro,Lite 2", undefined, "controller"],
  ["Logitech", "G29,G923,G920,Driving Force GT,G Pro Wheel,Extreme 3D Pro,X52 Pro,G Flight Yoke", undefined, "controller"],
  ["Thrustmaster", "T300 RS,T150,T248,TX Racing,T-LCM Pedals,TMX,T16000M,Warthog,TCA Yoke Boeing", undefined, "controller"],
  ["Fanatec", "CSL Elite,CSL DD,Podium DD1,ClubSport V3 Pedals", undefined, "controller"],
  ["Valve", "Steam Controller", undefined, "controller"],
  ["Hori", "Fighting Stick Alpha,Fighting Commander,Racing Wheel Overdrive,Pokken Controller", undefined, "controller"],
  ["Razer", "Wolverine V2,Raiju,Kishi V2", undefined, "controller"],
  ["SteelSeries", "Nimbus+,Stratus Duo", undefined, "controller"],
  ["PowerA", "Enhanced Wireless Controller,Spectra Infinity", undefined, "controller"],
];

const AUDIO_MORE: Row[] = [
  ["Sony", "WH-CH720N,WH-CH520,WH-CH510,WH-XB910N,WH-1000XM3,WF-C700N,WF-C500,WF-1000XM3,LinkBuds S,LinkBuds,WH-1000XM6,ULT Wear,SRS-XB13,SRS-XB23,SRS-XB33,SRS-XG300,SRS-XE300,SRS-XB43", undefined, "headphones"],
  ["Bose", "QuietComfort 35 II,QuietComfort 45,QuietComfort 25,QuietComfort Earbuds,QuietComfort Earbuds II,QuietComfort Ultra Earbuds,Noise Cancelling Headphones 700,SoundSport Free,SoundLink Mini II,SoundLink Revolve,SoundLink Revolve+,SoundLink Color II,Sport Earbuds,Solo 5", undefined, "headphones"],
  ["Sennheiser", "Momentum 3 Wireless,Momentum True Wireless 2,Momentum True Wireless 3,HD 599,HD 560S,HD 600,HD 650,HD 800 S,HD 450BT,CX Plus,IE 200,PXC 550,Accentum", undefined, "headphones"],
  ["Beats", "Solo 3,Solo 4,Solo Pro,Studio 3,Studio Buds,Studio Buds+,Fit Pro,Powerbeats Pro,Powerbeats 3,Beats Flex,Pill+", undefined, "headphones"],
  ["JBL", "Tune 510BT,Tune 520BT,Tune 660NC,Tune 760NC,Tune 770NC,Live 460NC,Live 660NC,Live 770NC,Quantum 400,Quantum 600,Quantum One,Go 2,Go 3,Clip 3,Clip 4,Xtreme 2,Xtreme 3,Pulse 4,Charge 5,PartyBox 110,PartyBox 310,Wave 200TWS,Tour One M2,Endurance Peak 3", undefined, "headphones"],
  ["Marshall", "Emberton,Stanmore II,Stanmore III,Acton II,Acton III,Woburn II,Willen,Major IV,Major V,Monitor II ANC,Motif ANC", undefined, "speaker"],
  ["Sonos", "One,One SL,Beam Gen 2,Beam,Arc,Ray,Move,Move 2,Five,Sub Gen 3,Era 100,Era 300", undefined, "speaker"],
  ["Apple", "HomePod mini,HomePod 2,AirPods 1,AirPods Pro 1,AirPods Max USB-C,Beats Studio Pro", undefined, "headphones"],
  ["Amazon", "Echo Dot 3,Echo Dot 4,Echo Dot 5,Echo 4,Echo Show 8,Echo Show 5,Echo Studio", undefined, "speaker"],
  ["Anker", "Soundcore Liberty 4 NC,Soundcore Liberty 3 Pro,Soundcore Life Q30,Soundcore Life Q35,Soundcore Space One,Soundcore Motion+,Soundcore Motion Boom,Soundcore Boom 2,Soundcore Space A40", undefined, "headphones"],
  ["Samsung", "Galaxy Buds,Galaxy Buds+,Galaxy Buds Live,Galaxy Buds2,Galaxy Buds FE,Galaxy Buds3,Galaxy Buds3 Pro", undefined, "headphones"],
  ["Jabra", "Elite 3,Elite 4,Elite 5,Elite 7 Pro,Elite 75t,Elite 85t,Elite Active 75t,Evolve2 65,Evolve2 75,Speak 510", undefined, "headphones"],
  ["Nothing", "Ear (1),Ear (2),Ear (a),Headphone (1)", undefined, "headphones"],
  ["Google", "Pixel Buds Pro,Pixel Buds A-Series", undefined, "headphones"],
  ["Bang & Olufsen", "Beoplay E8,Beoplay H95,Beoplay Portal,Beosound A1,Beosound A5", undefined, "headphones"],
  ["Audio-Technica", "ATH-M50x,ATH-M40x,ATH-M20x,ATH-M30x,ATH-ANC700BT,ATH-SR50BT", undefined, "headphones"],
  ["Shure", "SM58,SM57,SM7B,MV7,Aonic 50", undefined, "headphones"],
  ["Ultimate Ears", "Boom 3,Megaboom 3,Wonderboom 2,Wonderboom 3,Hyperboom", undefined, "speaker"],
  ["Huawei", "FreeBuds Pro,FreeBuds Pro 2,FreeBuds 4i,FreeBuds 5i", undefined, "headphones"],
  ["Xiaomi", "Redmi Buds 3 Pro,Redmi Buds 4 Pro,Redmi Buds 5 Pro,Buds 3T Pro", undefined, "headphones"],
  ["Beyerdynamic", "DT 770 Pro,DT 990 Pro,DT 1990 Pro,Amiron Home,Lagoon ANC", undefined, "headphones"],
  ["Bowers & Wilkins", "PX7,PX7 S2,PX8,Px5,Pi7", undefined, "headphones"],
];

const CAMERAS_MORE: Row[] = [
  ["GoPro", "Hero 5 Black,Hero 6 Black,Hero 7 Black,Hero 8 Black,Hero 9 Black,Hero 10 Black,Hero 11 Black,Hero 12 Black,Hero 13 Black,Max,Hero 11 Mini", undefined, "camera"],
  ["DJI", "Osmo Action,Osmo Action 2,Osmo Action 3,Osmo Action 4,Osmo Action 5 Pro,Osmo Pocket,Osmo Pocket 2,Osmo Pocket 3,Osmo Mobile 3,Osmo Mobile 4,Osmo Mobile 5,Osmo Mobile 6,RS 2,RS 3,RS 3 Mini,Ronin SC,Mavic Mini,Mini 2 SE,Mini 3,Mini 4K,Mini 4 Pro,Air 2S,Air 3,Mavic Air 2,Mavic 2 Pro,Mavic 3 Classic,Mavic 3,Mavic Pro,Phantom 4,Phantom 4 Pro,Avata,FPV,Neo", undefined, "camera"],
  ["Sony", "Alpha 6000,Alpha 6100,Alpha 6300,Alpha 6400,Alpha 6500,Alpha 6600,Alpha 7 II,Alpha 7 III,Alpha 7 IV,Alpha 7C,Alpha 7R III,Alpha 7R IV,Alpha 7S III,Alpha 9,ZV-E10,ZV-E1,ZV-1 II,RX100 III,RX100 V,RX100 VII,RX10 IV,Alpha 5100,Alpha 7 I", undefined, "camera"],
  ["Canon", "EOS R,EOS RP,EOS R5,EOS R6,EOS R6 Mark II,EOS R7,EOS R8,EOS R10,EOS R50,EOS M6 Mark II,EOS M200,EOS 2000D,EOS 4000D,EOS 800D,EOS 850D,EOS 90D,EOS 80D,EOS 77D,EOS 6D,EOS 6D Mark II,EOS 5D Mark III,EOS 5D Mark IV,EOS 7D Mark II,EOS 1300D,EOS 1500D,EOS 750D,EOS 700D,EOS 600D,PowerShot G7 X Mark II,PowerShot G7 X Mark III,PowerShot SX740,PowerShot G9 X Mark II", undefined, "camera"],
  ["Nikon", "D3300,D3400,D5300,D5500,D5600,D7000,D7200,D7500,D750,D780,D810,D850,Z fc,Z30,Z5,Z6,Z6 II,Z7,Z7 II,Z8,Z9,Coolpix P1000,Coolpix P950,Coolpix B500,Coolpix A1000", undefined, "camera"],
  ["Fujifilm", "X-T10,X-T20,X-T30,X-T30 II,X-T3,X-T4,X-T5,X-S10,X-S20,X-E3,X-E4,X-H1,X-H2,X-Pro2,X-Pro3,X100F,X100V,X100VI,X-A7,GFX 50S,Instax Mini 11,Instax Mini 12,Instax Wide 300,Instax Square SQ1", undefined, "camera"],
  ["Panasonic", "Lumix G7,Lumix G80,Lumix G9,Lumix GH5,Lumix GH5 II,Lumix GH6,Lumix S5,Lumix S5 II,Lumix S1,Lumix TZ100,Lumix LX100 II,Lumix FZ1000", undefined, "camera"],
  ["Olympus", "OM-D E-M10 Mark II,OM-D E-M10 Mark III,OM-D E-M10 Mark IV,OM-D E-M5 Mark II,OM-D E-M5 Mark III,OM-D E-M1 Mark II,OM-D E-M1 Mark III,PEN E-PL9,Tough TG-6", undefined, "camera"],
  ["Insta360", "ONE X2,X3,X4,ONE RS,Ace Pro,GO 2,GO 3,Link", undefined, "camera"],
  ["Canon", "RF 50mm f1.8,RF 35mm f1.8,RF 24-105mm f4,RF 85mm f2,EF 50mm f1.8 STM,EF 50mm f1.4,EF 24-70mm f2.8 II,EF 70-200mm f2.8L II,EF 85mm f1.8,EF 24-105mm f4L,EF 35mm f2 IS,EF-S 18-55mm,EF-S 10-18mm,EF 100mm f2.8 Macro", undefined, "camera"],
  ["Sony", "FE 50mm f1.8,FE 35mm f1.8,FE 85mm f1.8,FE 24-70mm f2.8 GM,FE 28-70mm,FE 70-200mm f4,FE 24-105mm f4,E 16-50mm,E 18-135mm,E 10-18mm f4", undefined, "camera"],
  ["Sigma", "30mm f1.4 DC DN,56mm f1.4 DC DN,16mm f1.4 DC DN,35mm f1.4 Art,50mm f1.4 Art,24-70mm f2.8 Art,18-35mm f1.8", undefined, "camera"],
  ["Tamron", "28-75mm f2.8,17-28mm f2.8,70-180mm f2.8,150-500mm,18-300mm", undefined, "camera"],
  ["Nikon", "AF-S 50mm f1.8G,AF-S 35mm f1.8G,AF-S 85mm f1.8G,AF-S 24-70mm f2.8G,AF-S 70-200mm f2.8,AF-P 18-55mm,AF-S 18-140mm,Z 50mm f1.8 S,Z 24-70mm f4 S,Z 40mm f2", undefined, "camera"],
];

const WATCHES_MORE: Row[] = [
  ["Apple", "Watch Series 3,Watch Series 4,Watch Series 5,Watch Series 6,Watch SE 2020,Watch Series 7,Watch Series 8,Watch Series 9,Watch Series 10,Watch Ultra,Watch Ultra 2", "40 mm/41 mm/44 mm/45 mm/46 mm/49 mm", "smartwatch"],
  ["Samsung", "Galaxy Watch 3,Galaxy Watch 4,Galaxy Watch 4 Classic,Galaxy Watch 5,Galaxy Watch 5 Pro,Galaxy Watch 6,Galaxy Watch 6 Classic,Galaxy Watch 7,Galaxy Watch Ultra,Galaxy Watch Active 2,Galaxy Fit 3,Galaxy Watch FE", undefined, "smartwatch"],
  ["Garmin", "Forerunner 35,Forerunner 45,Forerunner 55,Forerunner 245,Forerunner 255,Forerunner 265,Forerunner 645,Forerunner 745,Forerunner 945,Forerunner 955,Forerunner 965,Fenix 5,Fenix 5 Plus,Fenix 6,Fenix 6 Pro,Fenix 6X Pro,Fenix 7,Fenix 7X,Fenix 7 Pro,Epix Gen 2,Instinct,Instinct 2,Instinct 2X,Venu,Venu 2,Venu 2 Plus,Venu 3,Venu Sq,Vivoactive 3,Vivoactive 4,Vivoactive 5,Vivosmart 4,Vivosmart 5,Vivomove,Lily,Enduro,Tactix,MARQ,Swim 2,Edge 530,Edge 830,Edge 540,Edge 1030,Edge 1040,Edge 130", undefined, "smartwatch"],
  ["Fitbit", "Charge 3,Charge 4,Charge 5,Charge 6,Versa 2,Versa 3,Versa 4,Sense,Sense 2,Inspire 2,Inspire 3,Luxe,Ace 3", undefined, "smartwatch"],
  ["Huawei", "Watch GT 2,Watch GT 2 Pro,Watch GT 3,Watch GT 3 Pro,Watch GT 4,Watch GT 5,Watch Fit,Watch Fit 2,Watch Fit 3,Watch D,Watch 4 Pro,Band 6,Band 7,Band 8,Band 9", undefined, "smartwatch"],
  ["Xiaomi", "Mi Band 5,Mi Band 6,Mi Band 7,Smart Band 8,Smart Band 9,Watch S1,Watch S1 Active,Watch 2 Pro", undefined, "smartwatch"],
  ["Google", "Pixel Watch,Pixel Watch 2,Pixel Watch 3", undefined, "smartwatch"],
  ["Amazfit", "GTR 3,GTR 3 Pro,GTR 4,GTS 3,GTS 4,GTS 4 Mini,T-Rex Pro,T-Rex 2,Bip 3,Bip 5,Balance,Cheetah Pro,Active", undefined, "smartwatch"],
  ["Polar", "Vantage M,Vantage M2,Vantage V,Vantage V2,Grit X,Grit X Pro,Pacer,Pacer Pro,Ignite,Ignite 2,Unite,H10", undefined, "smartwatch"],
  ["Coros", "Pace 2,Pace 3,Apex,Apex 2,Apex 2 Pro,Vertix 2", undefined, "smartwatch"],
  ["Suunto", "9 Peak,9 Baro,5,3 Fitness,7,Vertical,Race", undefined, "smartwatch"],
  ["Withings", "ScanWatch,ScanWatch 2,Steel HR,Move", undefined, "smartwatch"],
  ["Oura", "Ring Gen 3,Ring 4", undefined, "smartwatch"],
  ["Whoop", "4.0", undefined, "smartwatch"],
];

const PERIPHERALS: Row[] = [
  ["Logitech", "MX Master 2S,MX Master 3,MX Master 3S,MX Anywhere 2S,MX Anywhere 3,MX Anywhere 3S,MX Ergo,MX Vertical,Lift,G502 Hero,G502 X,G502 X Plus,G502 Lightspeed,G305,G203,G102,G903,G703,G Pro Wireless,G Pro X Superlight,G Pro X Superlight 2,G Pro Hero,G604,G600,M720 Triathlon,Pebble M350,MX Keys,MX Keys Mini,MX Mechanical,G915,G915 TKL,G815,G613,G413,G Pro Keyboard,K380,K780,K400 Plus,Ergo K860,G733,G Pro X Headset,G Pro X 2,G435,G935,G432,G332,G Pro Headset,Zone Vibe,C920,C922,C930e,Brio 4K,Brio 500,Brio 300,StreamCam,C270,Litra Glow,Litra Beam,Yeti,Yeti X,Blue Yeti Nano,Ultimate Ears Wonderboom", undefined, "mouse"],
  ["Razer", "DeathAdder V2,DeathAdder V2 Pro,DeathAdder V3,DeathAdder V3 Pro,DeathAdder Essential,Viper,Viper Ultimate,Viper V2 Pro,Viper Mini,Basilisk V2,Basilisk V3,Basilisk Ultimate,Naga Pro,Naga X,Cobra,Orochi V2,Lancehead,Mamba Elite,Abyssus,BlackWidow V3,BlackWidow V3 Pro,BlackWidow V4,BlackWidow Elite,Huntsman,Huntsman Mini,Huntsman V2,Huntsman Tournament Edition,Ornata V2,Ornata V3,Cynosa V2,Cynosa Lite,DeathStalker,BlackShark V2,BlackShark V2 Pro,BlackShark V2 X,Kraken,Kraken V3,Kraken Kitty,Kraken X,Barracuda X,Barracuda,Nari,Seiren Mini,Seiren V2 Pro,Seiren Emote,Kiyo,Kiyo Pro,Kiyo X,Firefly,Goliathus,Tartarus V2,Tartarus Pro,Orbweaver,Wolverine", undefined, "keyboard"],
  ["Corsair", "K55,K57,K60 Pro,K65 Mini,K68,K70,K70 RGB MK.2,K70 Pro,K95 Platinum,K95 RGB,K100,Strafe,M55,M65 RGB Elite,M65 Pro,Harpoon,Ironclaw,Nightsabre,Scimitar,Dark Core,Sabre RGB,Katar,Glaive,Void Elite,Void Pro,HS35,HS45,HS50,HS60,HS65,HS70,HS80,Virtuoso,Virtuoso Pro,Virtuoso SE,Virtuoso XT,Void RGB Elite Wireless,MM300,MM350,MM700,MM800,Dark Core RGB Pro,Slipstream,Ironclaw Wireless,Sabre Pro,Nightsabre Wireless,Scimitar Elite,Scimitar Pro RGB,K83,Gaming Keyboard K70 Lux", undefined, "keyboard"],
  ["SteelSeries", "Arctis 1,Arctis 3,Arctis 5,Arctis 7,Arctis 7P,Arctis 7X,Arctis 9,Arctis 9X,Arctis Pro,Arctis Pro Wireless,Arctis Nova 1,Arctis Nova 3,Arctis Nova 5,Arctis Nova 7,Arctis Nova Pro,Arctis Nova Pro Wireless,Arctis Prime,Apex 3,Apex 5,Apex 7,Apex Pro,Apex Pro TKL,Apex Pro Mini,Rival 3,Rival 5,Rival 600,Rival 650,Rival 710,Aerox 3,Aerox 5,Aerox 9,Prime,Prime Wireless,Sensei Ten,Sensei 310,QcK,Alias,Alias Pro", undefined, "headphones"],
  ["HyperX", "Cloud II,Cloud II Wireless,Cloud Alpha,Cloud Alpha Wireless,Cloud Stinger,Cloud Stinger 2,Cloud Flight,Cloud Orbit,Cloud 3,Alloy Origins,Alloy Origins 60,Alloy Origins Core,Alloy FPS,Alloy Elite 2,Pulsefire Haste,Pulsefire Haste 2,Pulsefire Surge,Pulsefire FPS Pro,Pulsefire Dart,QuadCast,QuadCast S,SoloCast,ProCast,Fury S,Pulsefire Core,Cloud Revolver", undefined, "headphones"],
  ["Elgato", "Stream Deck MK.2,Stream Deck Mini,Stream Deck XL,Stream Deck +,Stream Deck Pedal,Facecam,Facecam Pro,Facecam MK.2,HD60 S,HD60 S+,HD60 X,HD60 Pro,4K60 S+,4K60 Pro,Game Capture HD60,Cam Link 4K,Wave 1,Wave 3,Wave DX,Wave Neo,Key Light,Key Light Air,Ring Light,Light Strip,Green Screen,Multi Mount,Prompter,Eve,Neo", undefined, "keyboard"],
  ["Blue", "Yeti,Yeti X,Yeti Nano,Snowball,Snowball iCE,Compass,Spark,Baby Bottle,Raspberry,Ember,Nessie,Yeticaster,Sona,Blackout", undefined, "headphones"],
  ["Rode", "NT-USB,NT-USB Mini,NT-USB+,PodMic,PodMic USB,Wireless GO,Wireless GO II,Wireless ME,VideoMicro,VideoMic Pro,VideoMic NTG,Procaster,NT1,NT1-A,Rodecaster Pro,Rodecaster Pro II,AI-1,Wireless Pro,NT5,SC6", undefined, "headphones"],
  ["Wacom", "Intuos S,Intuos M,Intuos Pro S,Intuos Pro M,One by Wacom,Cintiq 16,Cintiq 22,Cintiq Pro 16,Cintiq Pro 24,MobileStudio Pro,Bamboo Splash,Bamboo Ink,Bamboo Slate,Bamboo Spark,Cintiq 13HD,Cintiq 22HD,Mobile Studio Pro 13", undefined, "keyboard"],
  ["Keychron", "K2,K3,K4,K6,K8,K10,K1,Q1,Q2,Q3,Q5,V1,V3,V6,K15 Pro,K3 Pro,K2 Pro,Q1 Pro,Q6 Pro,M1,M3,M4,M6,Lemokey L1,Lemokey X1,Lemokey P1,C1,C2,C3,Q8,Q10,Q11,Q60,Q65", undefined, "keyboard"],
  ["Apple", "Magic Keyboard,Magic Keyboard Touch ID,Magic Keyboard Numeric,Magic Mouse,Magic Mouse 2,Magic Trackpad,Magic Trackpad 2,Apple Pencil,Apple Pencil 2,Apple Pencil USB-C,Apple Pencil Pro,Smart Keyboard Folio,Magic Keyboard iPad,AirTag,AirTag 4 Pack,Apple TV 4K,Apple TV HD,Siri Remote,MagSafe Charger,MagSafe Duo,AirPort Express,AirPort Extreme,Time Capsule,Lightning to USB Cable,USB-C Power Adapter,HomePod,AirPods Charging Case,Smart Cover,Smart Folio,Leather Sleeve,Leather Case,Silicone Case,Clear Case", undefined, "keyboard"],
];

const ALL = [
  ...build("cpu", "cpu", CPU),
  ...build("gpu", "graphics card", GPU),
  ...build("phone", "smartphone", [...PHONES_APPLE, ...PHONES]),
  ...build("tablet", "tablet", TABLETS),
  ...build("laptop", "laptop", LAPTOPS),
  ...build("desktop", "desktop", DESKTOPS),
  ...build("storage", "ssd", STORAGE),
  ...build("monitor", "monitor", MONITORS),
  ...build("console", "console", CONSOLES_MORE),
  ...build("controller", "controller", CONTROLLERS_MORE),
  ...build("audio", "headphones", AUDIO_MORE),
  ...build("camera", "camera", CAMERAS_MORE),
  ...build("watch", "smartwatch", WATCHES_MORE),
  ...build("peripheral", "keyboard", PERIPHERALS),
];

/** Todos os produtos gerados, antes da poda (para o script de preços). */
export const MORE_ALL: TechSeed[] = ALL;

const keep = new Set<string>((KEEP as { ids: string[] }).ids);

/** Os que têm anúncios suficientes (poda feita depois de buscar os preços). Sem lista de poda, entram todos. */
export const MORE: TechSeed[] = keep.size > 0 ? ALL.filter((s) => keep.has(s.id)) : ALL;
