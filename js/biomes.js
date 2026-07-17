// ===== BIOME SYSTEM – Randomized Content Per Zone =====
// Each biome has unique spawn tables for food stations, enemies, bosses,
// and discovery chances. Content randomizes per prestige run.

var BIOME_CONTENT = {
  forest: {
    name: "Forest",
    label: "🌳 Forest",
    bg: 0x87ceeb,
    fog: 0x87ceeb,
    foodBonus: 0,
    enemyMult: 1,
    tripReq: 0,
    prestigeReq: 0,
    // Spawn tables
    foodStations: [
      { type: "berryBush", count: 2, foodPerTrip: 3 },
      { type: "seedPile", count: 1, foodPerTrip: 4 }
    ],
    enemyTypes: ["spider"],
    bossTypes: ["queen"],
    discoveryChance: 0.35,
    rareDiscoveryBonus: 0,
    description: "A temperate forest with abundant food and mild threats."
  },

  meadow: {
    name: "Meadow",
    label: "🌿 Meadow",
    bg: 0x7ab44d,
    fog: 0x7ab44d,
    foodBonus: 1,
    enemyMult: 1,
    tripReq: 15,
    prestigeReq: 0,
    foodStations: [
      { type: "flowerField", count: 2, foodPerTrip: 4 },
      { type: "honeyDrop", count: 1, foodPerTrip: 5 }
    ],
    enemyTypes: ["spider", "wasp"],
    bossTypes: ["queen", "wasp"],
    discoveryChance: 0.40,
    rareDiscoveryBonus: 0.02,
    description: "Open grasslands rich with flowers and nectar."
  },

  forestEdge: {
    name: "Forest Edge",
    label: "🌲 Forest Edge",
    bg: 0x6b8e5a,
    fog: 0x6b8e5a,
    foodBonus: 2,
    enemyMult: 1.2,
    tripReq: 30,
    prestigeReq: 0,
    foodStations: [
      { type: "deadWood", count: 2, foodPerTrip: 5 },
      { type: "mushroomPatch", count: 1, foodPerTrip: 6 }
    ],
    enemyTypes: ["spider", "beetle"],
    bossTypes: ["beetle"],
    discoveryChance: 0.38,
    rareDiscoveryBonus: 0.03,
    description: "The boundary between forest and the unknown."
  },

  riverside: {
    name: "Riverside",
    label: "🏞️ Riverside",
    bg: 0x5a8a8a,
    fog: 0x5a8a8a,
    foodBonus: 2,
    enemyMult: 0.8,
    tripReq: 60,
    prestigeReq: 0,
    foodStations: [
      { type: "riverbank", count: 2, foodPerTrip: 5 },
      { type: "fishCarcass", count: 1, foodPerTrip: 7 }
    ],
    enemyTypes: ["spider", "wasp"],
    bossTypes: ["queen", "wasp"],
    discoveryChance: 0.42,
    rareDiscoveryBonus: 0.04,
    description: "Fertile riverbanks with rich pickings but seasonal floods."
  },

  deepWoods: {
    name: "Deep Woods",
    label: "🌲 Deep Woods",
    bg: 0x2a4a2a,
    fog: 0x2a4a2a,
    foodBonus: 3,
    enemyMult: 1.5,
    tripReq: 100,
    prestigeReq: 0,
    foodStations: [
      { type: "ancientLog", count: 2, foodPerTrip: 6 },
      { type: "fungalGarden", count: 1, foodPerTrip: 8 }
    ],
    enemyTypes: ["spider", "beetle", "centipede"],
    bossTypes: ["beetle", "centipede"],
    discoveryChance: 0.36,
    rareDiscoveryBonus: 0.05,
    description: "Dark and dangerous, but full of ancient treasures."
  },

  cave: {
    name: "Cave",
    label: "🕳️ Cave",
    bg: 0x334455,
    fog: 0x334455,
    foodBonus: 4,
    enemyMult: 1.6,
    tripReq: 0,
    prestigeReq: 10,
    foodStations: [
      { type: "crystalMoss", count: 2, foodPerTrip: 7 },
      { type: "batGuano", count: 1, foodPerTrip: 9 }
    ],
    enemyTypes: ["spider", "centipede"],
    bossTypes: ["centipede"],
    discoveryChance: 0.30,
    rareDiscoveryBonus: 0.08,
    description: "Deep underground caves with crystals and danger."
  },

  swamp: {
    name: "Swamp",
    label: "🌿 Swamp",
    bg: 0x3a5a3a,
    fog: 0x3a5a3a,
    foodBonus: 5,
    enemyMult: 1.3,
    tripReq: 0,
    prestigeReq: 25,
    foodStations: [
      { type: "bogPlants", count: 2, foodPerTrip: 8 },
      { type: "insectSwarm", count: 1, foodPerTrip: 10 }
    ],
    enemyTypes: ["spider", "hydraSpawn"],
    bossTypes: ["hydra"],
    discoveryChance: 0.32,
    rareDiscoveryBonus: 0.10,
    description: "A murky swamp where ancient creatures lurk."
  },

  mountain: {
    name: "Mountain",
    label: "🏔️ Mountain",
    bg: 0x88aacc,
    fog: 0x88aacc,
    foodBonus: 6,
    enemyMult: 1.9,
    tripReq: 0,
    prestigeReq: 50,
    foodStations: [
      { type: "alpineHerbs", count: 2, foodPerTrip: 9 },
      { type: "frozenCarcass", count: 1, foodPerTrip: 12 }
    ],
    enemyTypes: ["spider", "wyrmHatchling"],
    bossTypes: ["wyrm"],
    discoveryChance: 0.28,
    rareDiscoveryBonus: 0.12,
    description: "The frozen peak where only the strongest survive."
  }
};

// ---- Helper: get current biome config ----
function getCurrentBiomeConfig() {
  return BIOME_CONTENT[state.currentZone] || BIOME_CONTENT["forest"];
}

// ---- Helper: get food bonus for current biome ----
function getBiomeFoodBonus() {
  var cfg = getCurrentBiomeConfig();
  return cfg ? cfg.foodBonus : 0;
}

// ---- Helper: get enemy multiplier for current biome ----
function getBiomeEnemyMult() {
  var cfg = getCurrentBiomeConfig();
  return cfg ? cfg.enemyMult : 1;
}

// ---- Biome transition effect (called when switching zones) ----
function applyBiomeTransition(zoneId) {
  var cfg = BIOME_CONTENT[zoneId];
  if (!cfg) return;

  // Update scene background and fog
  if (typeof scene !== 'undefined') {
    scene.background = new THREE.Color(cfg.bg);
    scene.fog = new THREE.Fog(cfg.fog, 20, 80);
  }

  // Update zone display
  var zoneDisp = document.getElementById('zone-display');
  if (zoneDisp) zoneDisp.textContent = cfg.label;

  // Update food station visuals to match biome theme
  updateBiomeVisuals(zoneId);
}

// ---- Update terrain visuals for each biome (subtle colour changes) ----
function updateBiomeVisuals(zoneId) {
  // This is called by applyBiomeTransition.
  // The main terrain rebuild already happens via initGameSystems.
  // Here we can add biome-specific particle colours or lighting tweaks.
  var cfg = BIOME_CONTENT[zoneId];
  if (!cfg) return;

  // Tweak directional light colour based on biome
  if (typeof sLight !== 'undefined') {
    switch (zoneId) {
      case "cave": sLight.color.setHex(0x8899aa); break;
      case "swamp": sLight.color.setHex(0xaaccaa); break;
      case "mountain": sLight.color.setHex(0xccddff); break;
      default: sLight.color.setHex(0xffe9b0);
    }
  }

  // Show biome description as a toast
  showToast(cfg.label + " – " + cfg.description);
}
