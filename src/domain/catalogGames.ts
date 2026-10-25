/**
 * Jogos de outras plataformas além de PS4, Switch e PS5, para o preço de cada jogo de um lote. Só títulos comuns no mercado de usados.
 * Os preços vêm do eBay (npm run ebay:refresh -- --category game --missing --no-parts); o que não tiver anúncios fiáveis fica sem preço.
 */
export type OldPlatform = "DS" | "3DS" | "Wii" | "Wii U" | "Xbox One" | "Xbox 360" | "PS3";

export const GAMES_BY_PLATFORM: Record<OldPlatform, { suffix: string; titles: string[] }> = {
  DS: {
    suffix: "-ds",
    titles: [
      "New Super Mario Bros", "Mario Kart DS", "Pokemon Diamond", "Pokemon Pearl", "Pokemon Platinum", "Pokemon HeartGold",
      "Pokemon SoulSilver", "Pokemon Black", "Pokemon White", "Pokemon Black 2", "Pokemon White 2",
      "The Legend of Zelda Phantom Hourglass", "The Legend of Zelda Spirit Tracks", "Animal Crossing Wild World",
      "Brain Training", "Nintendogs", "Professor Layton and the Curious Village", "Professor Layton and the Diabolical Box",
      "Super Mario 64 DS", "Mario & Luigi Bowser's Inside Story", "Kirby Super Star Ultra", "Dragon Quest IX", "Mario Party DS",
      "Tetris DS", "Metroid Prime Hunters", "Castlevania Dawn of Sorrow", "Castlevania Portrait of Ruin",
      "Grand Theft Auto Chinatown Wars", "Pokemon Mystery Dungeon Explorers of Sky", "Yoshi's Island DS",
      "Lego Star Wars The Complete Saga", "Phoenix Wright Ace Attorney", "Big Brain Academy", "Mario & Sonic at the Olympic Games",
    ],
  },
  "3DS": {
    suffix: "-3ds",
    titles: [
      "Pokemon X", "Pokemon Y", "Pokemon Omega Ruby", "Pokemon Alpha Sapphire", "Pokemon Sun", "Pokemon Moon",
      "Pokemon Ultra Sun", "Pokemon Ultra Moon", "Super Mario 3D Land", "Mario Kart 7", "New Super Mario Bros 2",
      "The Legend of Zelda Ocarina of Time 3D", "The Legend of Zelda Majora's Mask 3D", "The Legend of Zelda A Link Between Worlds",
      "Animal Crossing New Leaf", "Fire Emblem Awakening", "Fire Emblem Fates Birthright", "Monster Hunter 4 Ultimate",
      "Monster Hunter Generations", "Kirby Triple Deluxe", "Luigi's Mansion Dark Moon", "Super Smash Bros for Nintendo 3DS",
      "Mario & Luigi Dream Team", "Bravely Default", "Professor Layton and the Miracle Mask", "Metroid Samus Returns",
      "Kid Icarus Uprising", "Yo-kai Watch", "Tomodachi Life", "Mario Party Island Tour", "Super Mario Maker for Nintendo 3DS",
      "Dragon Quest VII", "Dragon Quest VIII", "Xenoblade Chronicles 3D", "Resident Evil Revelations", "Star Fox 64 3D",
      "Paper Mario Sticker Star",
    ],
  },
  Wii: {
    suffix: "-wii",
    titles: [
      "Wii Sports", "Wii Sports Resort", "Wii Fit", "Wii Fit Plus", "Mario Kart Wii", "Super Mario Galaxy", "Super Mario Galaxy 2",
      "New Super Mario Bros Wii", "Super Smash Bros Brawl", "The Legend of Zelda Twilight Princess", "The Legend of Zelda Skyward Sword",
      "Animal Crossing City Folk", "Just Dance 2", "Just Dance 3", "Mario Party 8", "Mario Party 9", "Donkey Kong Country Returns",
      "Kirby's Epic Yarn", "Metroid Prime Trilogy", "Xenoblade Chronicles", "The Last Story", "Wii Party", "Mario Sports Mix",
      "Super Paper Mario", "Resident Evil Umbrella Chronicles", "Punch-Out", "Fire Emblem Radiant Dawn", "Guitar Hero World Tour",
      "Rayman Origins", "Lego Star Wars The Complete Saga",
    ],
  },
  "Wii U": {
    suffix: "-wiiu",
    titles: [
      "Mario Kart 8", "Super Mario 3D World", "New Super Mario Bros U", "Super Smash Bros for Wii U", "Splatoon",
      "The Legend of Zelda Breath of the Wild", "The Legend of Zelda The Wind Waker HD", "The Legend of Zelda Twilight Princess HD",
      "Nintendo Land", "Super Mario Maker", "Xenoblade Chronicles X", "Bayonetta 2", "Pikmin 3", "Donkey Kong Country Tropical Freeze",
      "Mario Party 10", "Yoshi's Woolly World", "Kirby and the Rainbow Curse", "Star Fox Zero", "Paper Mario Color Splash",
      "Hyrule Warriors", "Captain Toad Treasure Tracker", "The Wonderful 101", "Pokken Tournament", "Minecraft Wii U Edition",
      "Just Dance 2017", "Lego City Undercover", "Lego Marvel Super Heroes", "Rayman Legends", "Wii Party U", "Guitar Hero Live",
    ],
  },
  "Xbox One": {
    suffix: "-xboxone",
    titles: [
      "Halo 5 Guardians", "Halo The Master Chief Collection", "Forza Horizon 3", "Forza Horizon 4", "Forza Motorsport 7",
      "Gears of War 4", "Gears 5", "Red Dead Redemption 2", "Grand Theft Auto V", "Minecraft", "FIFA 23", "Call of Duty Black Ops 4",
      "Call of Duty Modern Warfare", "Battlefield 1", "Fallout 4", "The Witcher 3 Wild Hunt", "Sea of Thieves", "Cuphead",
      "Ori and the Blind Forest", "Ori and the Will of the Wisps", "Rocket League", "Assassin's Creed Odyssey", "Assassin's Creed Origins",
      "Far Cry 5", "Star Wars Battlefront II", "Titanfall 2", "Dark Souls III", "Resident Evil 2", "WWE 2K19",
      "The Lego Movie Videogame", "Lego Marvel's Avengers", "Lego Star Wars The Force Awakens", "Mortal Kombat 11",
    ],
  },
  "Xbox 360": {
    suffix: "-xbox360",
    titles: [
      "Halo 3", "Halo Reach", "Halo 4", "Gears of War", "Gears of War 2", "Gears of War 3", "Forza Motorsport 4", "Forza Horizon",
      "Grand Theft Auto V", "Red Dead Redemption", "Call of Duty Modern Warfare 2", "Call of Duty Black Ops", "Call of Duty Black Ops 2",
      "Fable II", "Fable III", "Mass Effect 2", "Mass Effect 3", "The Elder Scrolls V Skyrim", "Fallout 3", "Fallout New Vegas",
      "Assassin's Creed II", "Assassin's Creed Brotherhood", "Dark Souls", "Batman Arkham City", "Minecraft Xbox 360 Edition",
      "FIFA 14", "Kinect Adventures", "Kinect Sports", "Just Dance 3", "Lego Star Wars The Complete Saga",
    ],
  },
  PS3: {
    suffix: "-ps3",
    titles: [
      "The Last of Us", "Uncharted Drake's Fortune", "Uncharted 2 Among Thieves", "Uncharted 3 Drake's Deception", "God of War III",
      "God of War Ascension", "Metal Gear Solid 4", "Grand Theft Auto V", "Red Dead Redemption", "Gran Turismo 5", "Gran Turismo 6",
      "Heavy Rain", "Beyond Two Souls", "Demon's Souls", "Dark Souls", "Resident Evil 5", "Call of Duty Modern Warfare 3",
      "Call of Duty Black Ops", "Batman Arkham City", "The Elder Scrolls V Skyrim", "Fallout 3", "Assassin's Creed II",
      "Ratchet & Clank A Crack in Time", "LittleBigPlanet", "Killzone 3", "Infamous", "FIFA 14", "Persona 5", "BioShock Infinite",
    ],
  },
};
