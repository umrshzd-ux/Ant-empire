// ===== BIOME SYSTEM – Randomized Content Per Zone =====
// Each biome has unique spawn tables for food stations, enemies, bosses,
// and discovery chances. Content randomizes per prestige run.
//
// Basic zone properties (name, bg, fog, foodBonus, enemyMult, etc.)
// are defined in config.js → ZONE_CONFIG to avoid duplication.

// ---- Additional biome data (spawn tables, discovery rates) ----
var BIOME_EXTRA = {
  forest: {
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

// ---- Helper: get current biome config (from ZONE_CONFIG) ----
function getCurrentBiomeConfig() {
  return ZONE_CONFIG[state.currentZone] || ZONE_CONFIG["forest"];
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
  var cfg = ZONE_CONFIG[zoneId];
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
  var cfg = ZONE_CONFIG[zoneId];
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
  var extra = BIOME_EXTRA[zoneId];
  showToast(cfg.label + " – " + (extra ? extra.description : ""));
}

// ---- (Optional) Get extra biome data (spawn tables, etc.) ----
function getBiomeExtra(zoneId) {
  return BIOME_EXTRA[zoneId] || BIOME_EXTRA["forest"];
}
