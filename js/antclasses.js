// ===== ANT CLASS SYSTEM =====
// Defines 7 ant classes with unique abilities.
// Players unlock new classes through research and evolution.
// Each class has a role, base stats, and a special ability.

var ANT_CLASSES = {
  // ---- Tier 1: Available from start ----
  worker: {
    name: "Worker",
    emoji: "🐜",
    tier: 1,
    role: "economy",
    desc: "Gathers food and builds the colony.",
    baseStats: {
      speed: 1.0,
      carryCapacity: 1,
      health: 10,
      foodBonus: 0
    },
    ability: {
      name: "Diligent",
      desc: "Works 10% faster when food is low.",
      effect: function(w) {
        if (state.food < state.foodCap * 0.3) {
          w.speed *= 1.1;
        }
      }
    },
    unlockReq: null // always available
  },

  soldier: {
    name: "Soldier",
    emoji: "🛡️",
    tier: 1,
    role: "combat",
    desc: "Defends the colony and fights enemies.",
    baseStats: {
      speed: 0.7,
      damage: 10,
      health: 55,
      armor: 0
    },
    ability: {
      name: "Guardian",
      desc: "Takes 20% less damage when near the nest.",
      effect: function(s) {
        if (s.mesh && s.mesh.position.distanceTo(ER) < 4) {
          s.damageMultiplier = 0.8;
        }
      }
    },
    unlockReq: null
  },

  scout: {
    name: "Scout",
    emoji: "🔍",
    tier: 1,
    role: "exploration",
    desc: "Explores the world and finds discoveries.",
    baseStats: {
      speed: 1.3,
      carryCapacity: 1,
      health: 20,
      discoveryBonus: 0
    },
    ability: {
      name: "Keen Eye",
      desc: "15% higher chance to find discoveries.",
      effect: function(sc) {
        // Applied in discovery chance calculation
      }
    },
    unlockReq: null
  },

  // ---- Tier 2: Unlocked via Research Chamber ----
  nurse: {
    name: "Nurse",
    emoji: "💚",
    tier: 2,
    role: "support",
    desc: "Heals nearby injured soldiers over time.",
    baseStats: {
      speed: 0.8,
      carryCapacity: 1,
      health: 30,
      healRate: 0.5
    },
    ability: {
      name: "Healing Aura",
      desc: "Heals all soldiers within 3 units for 0.5 HP/sec.",
      effect: function(n) {
        if (!n.mesh) return;
        for (var i = 0; i < soldiers.length; i++) {
          var s = soldiers[i];
          if (s.mesh && s.mesh.position.distanceTo(n.mesh.position) < 3 && s.health < s.maxHealth) {
            s.health = Math.min(s.maxHealth, s.health + 0.5 / 60);
          }
        }
      }
    },
    unlockReq: { research: "advancedCare", level: 5 }
  },

  builder: {
    name: "Builder",
    emoji: "🔨",
    tier: 2,
    role: "economy",
    desc: "Reduces chamber build time by 25%.",
    baseStats: {
      speed: 0.9,
      carryCapacity: 2,
      health: 25,
      buildSpeedBonus: 0.25
    },
    ability: {
      name: "Master Builder",
      desc: "Build queue progresses 25% faster if a builder exists.",
      effect: function(b) {
        // Applied globally in build queue processing
      }
    },
    unlockReq: { research: "efficientConstruction", level: 8 }
  },

  // ---- Tier 3: Unlocked via Evolution ----
  royalGuard: {
    name: "Royal Guard",
    emoji: "👑",
    tier: 3,
    role: "combat",
    desc: "Stays near the Queen and has high defense.",
    baseStats: {
      speed: 0.5,
      damage: 15,
      health: 100,
      armor: 10
    },
    ability: {
      name: "Queen's Shield",
      desc: "Queen takes 50% less damage if a Royal Guard is within 2 units.",
      effect: function(rg) {
        if (rg.mesh && qMesh && rg.mesh.position.distanceTo(qMesh.position) < 2) {
          state.queenProtected = true;
        }
      }
    },
    unlockReq: { evolution: "soldier", tier: 3 }
  },

  explorer: {
    name: "Explorer",
    emoji: "🗺️",
    tier: 3,
    role: "exploration",
    desc: "Faster scout with double discovery chance.",
    baseStats: {
      speed: 2.0,
      carryCapacity: 1,
      health: 25,
      discoveryBonus: 0.35
    },
    ability: {
      name: "Trailblazer",
      desc: "Each trip counts as 2 trips for zone unlocks.",
      effect: function(ex) {
        // Applied in scout return logic
      }
    },
    unlockReq: { evolution: "scout", tier: 3 }
  }
};

// ---- Track which classes the player has unlocked ----
var unlockedClasses = ["worker", "soldier", "scout"]; // start with tier 1

// ---- Check if a class is unlocked ----
function isClassUnlocked(classId) {
  return unlockedClasses.indexOf(classId) !== -1;
}

// ---- Unlock a class ----
function unlockClass(classId) {
  if (isClassUnlocked(classId)) return false;
  var cls = ANT_CLASSES[classId];
  if (!cls) return false;
  unlockedClasses.push(classId);
  showToast("🧬 " + cls.emoji + " " + cls.name + " class unlocked!");
  AudioManager.sfx.achievement();
  return true;
}

// ---- Get builder count for build speed bonus ----
function getBuilderCount() {
  var count = 0;
  for (var i = 0; i < workers.length; i++) {
    if (workers[i].antClass === "builder") count++;
  }
  return count;
}

// ---- Get build speed multiplier from builders ----
function getBuildSpeedMultiplier() {
  var builders = getBuilderCount();
  if (builders === 0) return 1;
  return 1 / (1 + builders * 0.25); // each builder reduces time by 25%
}

// ---- Get nurse count for healing ----
function getNurseCount() {
  var count = 0;
  for (var i = 0; i < workers.length; i++) {
    if (workers[i].antClass === "nurse") count++;
  }
  return count;
}

// ---- Update all class abilities (called each frame) ----
function updateClassAbilities(dt) {
  // Nurse healing
  for (var i = 0; i < workers.length; i++) {
    var w = workers[i];
    if (w.antClass === "nurse" && w.mesh) {
      for (var j = 0; j < soldiers.length; j++) {
        var s = soldiers[j];
        if (s.mesh && s.mesh.position.distanceTo(w.mesh.position) < 3 && s.health < s.maxHealth) {
          s.health = Math.min(s.maxHealth, s.health + 0.5 * dt);
          updateHealthBar(s.healthBar, s.health / s.maxHealth);
        }
      }
    }
  }

  // Royal Guard – queen protection
  state.queenProtected = false;
  for (var i = 0; i < soldiers.length; i++) {
    var sg = soldiers[i];
    if (sg.antClass === "royalGuard" && sg.mesh && qMesh) {
      if (sg.mesh.position.distanceTo(qMesh.position) < 2) {
        state.queenProtected = true;
        break;
      }
    }
  }

  // Builder – applied in build queue (handled in main loop)
}

// ---- Create an ant of a specific class ----
function createClassAnt(classId, golden, rareType) {
  var cls = ANT_CLASSES[classId];
  if (!cls) return createWorker(golden, rareType);

  var ant;
  switch (classId) {
    case "worker":
      ant = createWorker(golden, rareType);
      break;
    case "soldier":
      ant = null; // soldiers use spawnSoldier
      break;
    case "scout":
      ant = null; // scouts use spawnScout
      break;
    case "nurse":
    case "builder":
      ant = createWorker(golden, rareType);
      if (ant) {
        ant.antClass = classId;
        if (ant.mesh && ant.mesh.userData && ant.mesh.userData.labelObj) {
          setLabelText(ant.mesh.userData.labelObj, cls.emoji + " " + cls.name);
        }
      }
      break;
    case "royalGuard":
      // Spawn as soldier with modified stats
      var chX = BAL.soldierRowStart + TX + 5 + state.chambers.soldier.count * 3.5;
      ant = spawnSoldier(chX);
      if (ant) {
        ant.antClass = "royalGuard";
        ant.maxHealth = cls.baseStats.health;
        ant.health = cls.baseStats.health;
        if (ant.mesh && ant.mesh.userData && ant.mesh.userData.labelObj) {
          setLabelText(ant.mesh.userData.labelObj, cls.emoji + " " + cls.name);
        }
      }
      break;
    case "explorer":
      ant = null; // use spawnScout with modified stats
      break;
    default:
      ant = createWorker(golden, rareType);
  }

  return ant;
                }
