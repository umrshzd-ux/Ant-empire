// ===== HUD, TOASTS, FLOATERS, MENUS, ACHIEVEMENTS, DAILY, STATS, PRESTIGE/ASCENSION UI =====

var elFood, elFoodCap, elGems, elLevel, elAnts, elEggs, elWaveTimer, elEventTimer, elBossTimer, elPrestige;
var toastEl, floatersEl;
var buildPanel, upgradePanel, shopPanel, achPanel, evoPanel, ppPanel, ascPanel;
var surgeBtn, eventBtn, summonBtn, rallyBtn, rallyOverlay;

function initDOMRefs() {
  elFood = document.getElementById("food-count");
  elFoodCap = document.getElementById("food-cap");
  elGems = document.getElementById("gem-count");
  elLevel = document.getElementById("level-count");
  elAnts = document.getElementById("ant-count");
  elEggs = document.getElementById("egg-count");
  elWaveTimer = document.getElementById("wave-timer");
  elEventTimer = document.getElementById("event-timer");
  elBossTimer = document.getElementById("boss-timer");
  elPrestige = document.getElementById("prestige-count");
  toastEl = document.getElementById("toast");
  floatersEl = document.getElementById("floaters");
  buildPanel = document.getElementById("build-panel");
  upgradePanel = document.getElementById("upgrade-panel");
  shopPanel = document.getElementById("shop-panel");
  achPanel = document.getElementById("achievements-panel");
  evoPanel = document.getElementById("evolution-panel");
  ppPanel = document.getElementById("prestige-shop-panel");
  ascPanel = document.getElementById("ascension-shop-panel");
  surgeBtn = document.getElementById("surge-btn");
  eventBtn = document.getElementById("event-btn");
  summonBtn = document.getElementById("summon-btn");
  rallyBtn = document.getElementById("btn-rally");
  rallyOverlay = rallyBtn ? rallyBtn.querySelector(".cooldown-overlay") : null;
}
initDOMRefs();

// Toasts
var toastQueue = [], toastActive = false;
function processToastQueue() {
  if (toastActive || toastQueue.length === 0) return;
  toastActive = true;
  var msg = toastQueue.shift();
  toastEl.textContent = msg;
  toastEl.style.opacity = "1";
  toastEl.style.transition = "none";
  void toastEl.offsetWidth;
  toastEl.style.transition = "opacity 0.3s ease";
  setTimeout(function() {
    toastEl.style.opacity = "0";
    toastActive = false;
    setTimeout(processToastQueue, 300);
  }, 2200);
}
function showToast(msg) { toastQueue.push(msg); processToastQueue(); }

var achToastTimeout = null;
function showAchievementToast(achName, achIcon, tierDesc, reward) {
  var at = document.getElementById('achievement-toast');
  document.getElementById('ach-toast-icon').textContent = achIcon;
  document.getElementById('ach-toast-title').textContent = achName;
  document.getElementById('ach-toast-desc').textContent = tierDesc + " — 💎 +" + reward;
  at.style.opacity = "1";
  if (achToastTimeout) clearTimeout(achToastTimeout);
  achToastTimeout = setTimeout(function() { at.style.opacity = "0"; achToastTimeout = null; }, 3500);
}
function spawnFloater(text, sx, sy, color) {
  var f = document.createElement("div");
  f.className = "floater";
  f.textContent = text;
  f.style.left = sx + "px";
  f.style.top = sy + "px";
  if (color) f.style.color = color;
  floatersEl.appendChild(f);
  setTimeout(function() { f.remove(); }, 1150);
}

function refreshHUD() {
  elFood.textContent = Math.floor(state.food);
  elFoodCap.textContent = state.foodCap;
  elGems.textContent = Math.floor(state.gems);
  elLevel.textContent = state.level;
  elAnts.textContent = state.workerCount + state.soldierCount + state.scoutCount;
  elEggs.textContent = state.eggs;
  elPrestige.textContent = state.prestigePoints + " PP";
  document.getElementById('virtual-display').textContent = state.virtualWorkers;
  document.getElementById('ascend-points').textContent = state.ascensionPoints + " AP";
  var apill = document.getElementById('ascend-pill');
  if (state.prestigeCount >= BAL.ascendUnlockPrestige && !state.bossActive) {
    apill.style.display = 'flex';
  } else {
    apill.style.display = 'none';
  }
}

function updateWaveTimer() {
  if (state.waveActive) {
    elWaveTimer.textContent = "⚠️" + state.waveSpidersRemaining;
    elWaveTimer.parentElement.style.borderColor = "#aa3333";
  } else {
    var sec = Math.ceil(state.waveTimer);
    elWaveTimer.textContent = "Wave " + sec + "s";
    elWaveTimer.parentElement.style.borderColor = sec < 10 ? "#aa3333" : "";
  }
}
function updateEventTimer() {
  if (state.eventActive) {
    elEventTimer.textContent = "🎲Active";
    elEventTimer.parentElement.style.borderColor = "#4488ff";
  } else {
    var sec = Math.ceil(state.eventTimer);
    elEventTimer.textContent = "Event " + sec + "s";
    elEventTimer.parentElement.style.borderColor = sec < 10 ? "#4488ff" : "";
  }
}
function updateBossTimer() {
  if (state.bossActive) {
    elBossTimer.textContent = "💀Boss!";
    elBossTimer.parentElement.style.borderColor = "#cc0000";
  } else {
    var totalSec = Math.ceil(state.bossTimer);
    var mins = Math.floor(totalSec / 60);
    var secs = totalSec % 60;
    var display = mins > 0 ? mins + "m " + (secs < 10 ? "0" : "") + secs + "s" : secs + "s";
    elBossTimer.textContent = "Boss " + display;
    elBossTimer.parentElement.style.borderColor = totalSec < 10 ? "#cc0000" : "";
  }
}

// Achievements
function checkAchievements() {
  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    var ach = ACHIEVEMENTS[i];
    if (ach.hidden && !isAchRevealed(ach)) continue;
    var claimedTier = state.achievementsClaimed[ach.id] || 0;
    if (claimedTier >= ach.tiers.length) continue;
    var nextTier = ach.tiers[claimedTier];
    if (checkAchReq(ach, nextTier.req)) {
      state.achievementsClaimed[ach.id] = claimedTier + 1;
      state.gems += nextTier.reward;
      state.totalGemsEarned += nextTier.reward;
      showAchievementToast(ach.name, ach.icon, nextTier.desc, nextTier.reward);
      showToast("🏆 " + ach.name + " Tier " + (claimedTier + 1) + "! +" + nextTier.reward + "💎");
      AudioManager.sfx.achievement();
    }
  }
}
function isAchRevealed(ach) {
  if (!ach.hidden) return true;
  if (state.achievementsClaimed[ach.id] && state.achievementsClaimed[ach.id] > 0) return true;
  for (var i = 0; i < ach.tiers.length; i++) { if (checkAchReq(ach, ach.tiers[i].req)) return true; }
  return false;
}
function checkAchReq(ach, req) {
  switch (ach.id) {
    case "hatch": return state.totalHatched >= req;
    case "spider": return state.totalKills >= req;
    case "boss": return state.bossKills >= req;
    case "level": return state.level >= req;
    case "storage": return state.foodCap >= req;
    case "prestige": return state.prestigeCount >= req;
    case "builder": return state.chambers.foodStorage.count > 0 && state.chambers.nursery.count > 0 && state.chambers.soldier.count > 0 && state.chambers.research.count > 0 && state.chambers.scout.count > 0;
    case "rare": return state.rareAntCount >= req;
    case "gem": return state.totalGemsEarned >= req;
    case "explorer": return state.unlockedZonesList.length - 1 >= req;
    case "feast": return (state.lifetimeStats.totalFood || 0) >= req;
    case "time": return (state.lifetimeStats.totalPlayTime || 0) >= req;
    case "rally": return state.rallyUses >= req;
    case "surge": return state.surgesCollected >= req;
    case "night": return state.survivedNight >= req;
    case "speed": if (state.prestigeCount === 0) return false; var pt = (state.lifetimeStats.fastestPrestige || 999999); if (req === 1) return pt < 7200; if (req === 2) return pt < 3600; if (req === 3) return pt < 1800; return false;
    case "pacifist": return state.level >= 30 && state.chambers.soldier.count === 0;
    case "queenclick": return state.queenClicks >= req;
    case "weathervet": return state.survivedNight >= 10 && (state.lifetimeStats.totalNights || 0) >= 10;
    case "golden": var gc = 0; for (var j = 0; j < workers.length; j++) if (workers[j].isGolden) gc++; return gc >= req;
    case "beetle": return state.beetleKills >= req;
    case "wasp": return state.waspKills >= req;
    case "cave": return state.caveBossKills >= req;
    case "swamp": return state.swampBossKills >= req;
    case "mountain": return state.mountainBossKills >= req;
    case "ascend1": return state.ascensionCount >= req;
    case "ascend2": var spent = 0; for (var k in state.ascensionUpgrades) spent += state.ascensionUpgrades[k]; return spent >= req;
    case "zoneMaster": return state.unlockedZonesList.length >= 6;
    case "poisonProof": return state.caveBossKills >= req;
    case "regenerationSlayer": return state.swampBossKills >= req;
    case "frostBreaker": return state.mountainBossKills >= req;
    case "ascendFast": if (state.ascensionCount === 0) return false; var timeToAscend = state.lifetimeStats.totalPlayTime; if (req === 1) return timeToAscend < 86400; if (req === 2) return timeToAscend < 43200; return false;
    case "allBosses": var bossTypes = ["queen", "beetle", "wasp", "centipede", "hydra", "wyrm"]; for (var bi = 0; bi < bossTypes.length; bi++) { if (!state.bossKillsByType || (state.bossKillsByType[bossTypes[bi]] || 0) === 0) return false; } return true;
    case "endGame": return state.prestigeCount >= 100 && state.ascensionCount >= 1;
    default: return false;
  }
}
function getAchProgress(ach) { /* unchanged */ }
function refreshAchievementsUI() { /* unchanged */ }
function getDailyChallengeById(id) { /* unchanged */ }
function checkDailyReset() { /* unchanged */ }
function refreshDailyUI() { /* unchanged */ }
function updateDailyProgress(type, amount) { /* unchanged */ }
function refreshStatsUI() { /* unchanged */ }
function formatNum(n) { /* unchanged */ }
function refreshRoadmapUI() { /* unchanged */ }
function calculateOfflineProgress() { /* unchanged */ }
function showOfflineModal(data) { /* unchanged */ }
function getTodayString() { /* unchanged */ }
function checkDailyLogin() { /* unchanged */ }
function updateStreakDisplay() { /* unchanged */ }
function showPrestigeModal() { /* unchanged */ }
function performPrestige(ppGain) { /* unchanged */ }
function rebuildAllChambers() { /* unchanged */ }
function showAscendModal() { /* unchanged */ }
function performAscension(apGain) { /* unchanged */ }
function clearAllMeshes() { /* unchanged */ }
function buyAscensionUpgrade(id) { /* unchanged */ }
function refreshAscensionShopUI() { /* unchanged */ }
window._buyAsc = buyAscensionUpgrade;
function refreshPrestigeShopUI() { /* unchanged */ }
function buyPrestigeUpgrade(id) { /* unchanged */ }
window._buyPP = buyPrestigeUpgrade;
function refreshEvolutionUI() { /* unchanged */ }
window._buyEvo = buyEvolution;
function refreshUpgradeUI() { /* unchanged */ }

// Build buttons
function updateBuildButtons() {
  var bfs = document.getElementById("build-food-storage"), bn = document.getElementById("build-nursery"),
      bs = document.getElementById("build-soldier"), br = document.getElementById("build-research"),
      bsc = document.getElementById("build-scout");
  if (bfs) bfs.disabled = state.chambers.foodStorage.count >= BAL.maxStorage;
  if (bn) bn.disabled = state.chambers.nursery.count >= BAL.maxNursery;
  if (bs) bs.disabled = state.chambers.soldier.count >= BAL.maxSoldierChambers;
  if (br) br.disabled = state.chambers.research.count >= 1;
  if (bsc) bsc.disabled = state.chambers.scout.count >= BAL.maxScoutChambers;
  updateBuildButtonLabels();
}
function updateBuildButtonLabels() {
  var bfs = document.getElementById("build-food-storage"), bn = document.getElementById("build-nursery"),
      bs = document.getElementById("build-soldier"), br = document.getElementById("build-research"),
      bsc = document.getElementById("build-scout");
  if (bfs && !bfs.disabled) bfs.textContent = getStorageCost() + "🌾";
  if (bn && !bn.disabled) bn.textContent = getEffectiveChamberCost(BAL.nurseryCost) + "🌾";
  if (bs && !bs.disabled) bs.textContent = getEffectiveChamberCost(BAL.soldierChamberCost) + "🌾";
  if (br && !br.disabled) br.textContent = getEffectiveChamberCost(BAL.researchChamberCost) + "🌾";
  if (bsc && !bsc.disabled) bsc.textContent = getEffectiveChamberCost(BAL.scoutChamberCost) + "🌾";
}
function buildFoodStorageChamber() {
  if (state.chambers.foodStorage.count >= BAL.maxStorage) { showToast("Max storage reached!"); return; }
  var cost = getStorageCost();
  if (state.food < cost) { showToast("Need " + cost + " food!"); return; }
  state.food -= cost;
  state.chambers.foodStorage.count++;
  state.chambers.foodStorage.bonusCap += BAL.foodCapPerStorage;
  recalculateFoodCap();
  var chX = getNextStorageX();
  storageChambers.push(makeChamber(chX, CCY, CZ, 3, 2, 4, 0x5a4020));
  makeLabel("🌾 Storage", chX, CCY + 1.4, CZ, 256, 64, true);
  var pile = new THREE.Group(); pile.position.set(chX, CCY - 0.8, CZ); scene.add(pile); storagePiles.push(pile);
  AudioManager.sfx.buttonClick(); updateDailyProgress('build1', 1);
  showToast("Food Storage built! +" + BAL.foodCapPerStorage);
  refreshHUD(); updateBuildButtons(); checkAchievements(); checkTutorials();
}
function buildNurseryChamber() {
  if (state.chambers.nursery.count >= BAL.maxNursery) { showToast("Max nurseries!"); return; }
  var cost = getEffectiveChamberCost(BAL.nurseryCost);
  if (state.food < cost) { showToast("Need " + cost + " food!"); return; }
  state.food -= cost; state.chambers.nursery.count++; state.chambers.nursery.hatchReduction += 2; recalculateHatchTime();
  var chX = TX - 5 - (state.chambers.nursery.count - 1) * 3.5;
  nurseryChambers.push(makeChamber(chX, CCY, CZ, 3, 2, 4, 0x6b5040));
  makeLabel("🥚 Nursery", chX, CCY + 1.4, CZ, 256, 64, true);
  var cluster = new THREE.Group(); cluster.position.set(chX, CCFY + 0.05, CZ); scene.add(cluster); nurseryEggClusters.push(cluster);
  buildQueenChamberWalls();
  AudioManager.sfx.buttonClick(); updateDailyProgress('build1', 1);
  showToast("Nursery built! Hatch -2s"); refreshHUD(); updateBuildButtons(); checkAchievements();
}
function buildSoldierChamber() {
  if (state.chambers.soldier.count >= BAL.maxSoldierChambers) { showToast("Max soldier chambers!"); return; }
  var cost = getEffectiveChamberCost(BAL.soldierChamberCost);
  if (state.food < cost) { showToast("Need " + cost + " food!"); return; }
  state.food -= cost; state.chambers.soldier.count++;
  var chX = getNextSoldierX();
  soldierChambers.push({ x: chX, mesh: makeChamber(chX, CCY, CZ, 3, 2, 4, 0x4a2a1a) });
  makeLabel("🛡️ Barracks", chX, CCY + 1.4, CZ, 256, 64, true);
  state.soldierCount++; spawnSoldier(chX);
  AudioManager.sfx.buttonClick(); updateDailyProgress('build1', 1);
  showToast("Soldier +1"); refreshHUD(); updateBuildButtons(); checkAchievements();
}
function buildResearchChamber() {
  if (state.chambers.research.count >= 1) { showToast("Only one research chamber!"); return; }
  var cost = getEffectiveChamberCost(BAL.researchChamberCost);
  if (state.food < cost) { showToast("Need " + cost + " food!"); return; }
  state.food -= cost; state.chambers.research.count++;
  var chX = getNextResearchX();
  researchChambers.push({ x: chX, mesh: makeChamber(chX, CCY, CZ, 3, 2, 4, 0x3a3a5a) });
  makeLabel("🔬 Research", chX, CCY + 1.4, CZ, 256, 64, true);
  researchChamberGroup = new THREE.Group(); researchChamberGroup.position.set(chX, CCY + 1.8, CZ);
  var orbMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.8 });
  for (var i = 0; i < 5; i++) { var orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), orbMat); var angle = (i / 5) * Math.PI * 2; orb.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6); researchChamberGroup.add(orb); }
  scene.add(researchChamberGroup);
  var btns = ["btn-upgrades", "btn-shop", "btn-achievements", "btn-daily"];
  for (var bi = 0; bi < btns.length; bi++) { var b = document.getElementById(btns[bi]); if (b) b.style.display = "inline-block"; }
  if (state.level >= BAL.evolutionUnlockLevel) { var evoBtn = document.getElementById("btn-evolution"); if (evoBtn) evoBtn.style.display = "inline-block"; }
  AudioManager.sfx.buttonClick(); updateDailyProgress('build1', 1);
  showToast("Research Chamber built!"); refreshHUD(); updateBuildButtons(); checkAchievements(); checkTutorials();
}
function buildScoutChamber() {
  if (state.chambers.scout.count >= BAL.maxScoutChambers) { showToast("Max scout chambers!"); return; }
  var cost = getEffectiveChamberCost(BAL.scoutChamberCost);
  if (state.food < cost) { showToast("Need " + cost + " food!"); return; }
  state.food -= cost; state.chambers.scout.count++;
  var chX = getNextScoutX();
  scoutChambers.push({ x: chX, mesh: makeChamber(chX, CCY, CZ, 3, 2, 4, 0x3a5a3a) });
  makeLabel("🔍 Scout Post", chX, CCY + 1.4, CZ, 256, 64, true);
  state.scoutCount++; spawnScout();
  AudioManager.sfx.buttonClick(); updateDailyProgress('build1', 1);
  showToast("Scout +1"); refreshHUD(); updateBuildButtons(); checkAchievements();
}

// Setup all buttons (guaranteed to work)
function setupButtons() {
  // Ensure panel elements exist before attaching events
  buildPanel = buildPanel || document.getElementById("build-panel");
  upgradePanel = upgradePanel || document.getElementById("upgrade-panel");
  shopPanel = shopPanel || document.getElementById("shop-panel");
  achPanel = achPanel || document.getElementById("achievements-panel");
  evoPanel = evoPanel || document.getElementById("evolution-panel");
  ppPanel = ppPanel || document.getElementById("prestige-shop-panel");
  ascPanel = ascPanel || document.getElementById("ascension-shop-panel");

  var btnBuild = document.getElementById("btn-build"), btnEvo = document.getElementById("btn-evolution"),
      btnUpgrades = document.getElementById("btn-upgrades"), btnShop = document.getElementById("btn-shop"),
      btnAch = document.getElementById("btn-achievements"), btnPP = document.getElementById("btn-prestige-shop"),
      btnAscShop = document.getElementById("btn-ascension-shop"), btnDaily = document.getElementById("btn-daily");

  var closeAll = function() {
    if (buildPanel) buildPanel.classList.remove("open");
    if (evoPanel) evoPanel.classList.remove("open");
    if (upgradePanel) upgradePanel.classList.remove("open");
    if (shopPanel) shopPanel.classList.remove("open");
    if (achPanel) achPanel.classList.remove("open");
    if (ppPanel) ppPanel.classList.remove("open");
    if (ascPanel) ascPanel.classList.remove("open");
  };

  if (btnBuild) btnBuild.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (buildPanel && buildPanel.classList.contains("open")) closeAll();
    else { closeAll(); if (buildPanel) { buildPanel.classList.add("open"); updateBuildButtonLabels(); } }
  };
  if (btnEvo) btnEvo.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (evoPanel && evoPanel.classList.contains("open")) closeAll();
    else { closeAll(); if (evoPanel) { evoPanel.classList.add("open"); refreshEvolutionUI(); } }
  };
  if (btnUpgrades) btnUpgrades.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (upgradePanel && upgradePanel.classList.contains("open")) closeAll();
    else { closeAll(); if (upgradePanel) { upgradePanel.classList.add("open"); refreshUpgradeUI(); } }
  };
  if (btnShop) btnShop.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (shopPanel && shopPanel.classList.contains("open")) closeAll();
    else { closeAll(); if (shopPanel) shopPanel.classList.add("open"); }
  };
  if (btnAch) btnAch.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (achPanel && achPanel.classList.contains("open")) closeAll();
    else { closeAll(); if (achPanel) { achPanel.classList.add("open"); refreshAchievementsUI(); } }
  };
  if (btnPP) btnPP.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (ppPanel && ppPanel.classList.contains("open")) closeAll();
    else { closeAll(); if (ppPanel) { ppPanel.classList.add("open"); refreshPrestigeShopUI(); } }
  };
  if (btnAscShop) btnAscShop.onclick = function() {
    AudioManager.sfx.buttonClick();
    if (ascPanel && ascPanel.classList.contains("open")) closeAll();
    else { closeAll(); if (ascPanel) { ascPanel.classList.add("open"); refreshAscensionShopUI(); } }
  };
  if (btnDaily) btnDaily.onclick = function() {
    AudioManager.sfx.buttonClick();
    var dp = document.getElementById('daily-panel');
    dp.style.display = dp.style.display === 'flex' ? 'none' : 'flex';
    refreshDailyUI();
  };

  document.getElementById("prestige-pill").onclick = function() { AudioManager.sfx.buttonClick(); showPrestigeModal(); };
  document.getElementById("ascend-pill").onclick = function() { AudioManager.sfx.buttonClick(); showAscendModal(); };
  document.getElementById("zone-pill").onclick = function() {
    AudioManager.sfx.buttonClick();
    var zones = state.unlockedZonesList;
    if (zones.length <= 1) { showToast("Explore more to unlock new zones!"); return; }
    var idx = zones.indexOf(state.currentZone);
    var nextIdx = (idx + 1) % zones.length;
    switchZone(zones[nextIdx]);
  };

  document.getElementById("build-food-storage").onclick = buildFoodStorageChamber;
  document.getElementById("build-nursery").onclick = buildNurseryChamber;
  document.getElementById("build-soldier").onclick = buildSoldierChamber;
  document.getElementById("build-research").onclick = buildResearchChamber;
  document.getElementById("build-scout").onclick = buildScoutChamber;

  document.getElementById("btn-upg-damage").onclick = function() { buyUpgrade("soldierDamage"); };
  document.getElementById("btn-upg-speed").onclick = function() { buyUpgrade("workerSpeed"); };
  document.getElementById("btn-upg-egg").onclick = function() { buyUpgrade("eggLayTime"); };
  document.getElementById("btn-upg-cap").onclick = function() { buyUpgrade("foodCap"); };

  var shopBtns = ["golden", "armor", "bless", "map", "boost", "hatch", "skin"];
  for (var si = 0; si < shopBtns.length; si++) {
    var sid = shopBtns[si];
    var btn = document.getElementById("btn-shop-" + sid);
    if (btn) btn.onclick = function(id) { return function() { buyGemItem(id); }; }(sid);
  }

  document.getElementById("btn-menu-ingame").onclick = function() { AudioManager.sfx.buttonClick(); showMainMenu(); };
  document.getElementById("btn-settings-menu").onclick = function() { AudioManager.sfx.buttonClick(); document.getElementById('settings-panel').style.display = 'flex'; };
  document.getElementById("btn-stats-menu").onclick = function() { AudioManager.sfx.buttonClick(); document.getElementById('stats-panel').style.display = 'flex'; refreshStatsUI(); };
  document.getElementById("btn-roadmap-menu").onclick = function() { AudioManager.sfx.buttonClick(); document.getElementById('roadmap-panel').style.display = 'flex'; refreshRoadmapUI(); };
  document.getElementById("btn-howtoplay-menu").onclick = function() { AudioManager.sfx.buttonClick(); document.getElementById('howtoplay-panel').style.display = 'flex'; };
  document.getElementById("btn-about-menu").onclick = function() { AudioManager.sfx.buttonClick(); document.getElementById('about-modal').style.display = 'flex'; };

  document.getElementById("btn-close-settings").onclick = function() { AudioManager.sfx.buttonClick(); document.getElementById('settings-panel').style.display = 'none'; };
  document.getElementById("btn-close-stats").onclick = function() { document.getElementById('stats-panel').style.display = 'none'; };
  document.getElementById("btn-close-daily").onclick = function() { document.getElementById('daily-panel').style.display = 'none'; };
  document.getElementById("btn-close-roadmap").onclick = function() { document.getElementById('roadmap-panel').style.display = 'none'; };
  document.getElementById("btn-close-ascension").onclick = function() { document.getElementById('ascension-panel').style.display = 'none'; };
  document.getElementById("btn-close-howtoplay").onclick = function() { document.getElementById('howtoplay-panel').style.display = 'none'; };
  document.getElementById("btn-close-about").onclick = function() { document.getElementById('about-modal').style.display = 'none'; };

  document.getElementById("toggle-sfx").onclick = function() {
    GameSettings.sfxOn = !GameSettings.sfxOn; AudioManager.setSfx(GameSettings.sfxOn);
    this.className = 'toggle-switch' + (GameSettings.sfxOn ? ' on' : '');
  };
  document.getElementById("toggle-ambient").onclick = function() {
    GameSettings.ambientOn = !GameSettings.ambientOn; AudioManager.setAmbient(GameSettings.ambientOn);
    this.className = 'toggle-switch' + (GameSettings.ambientOn ? ' on' : '');
  };
  document.getElementById("toggle-shake").onclick = function() {
    GameSettings.shakeOn = !GameSettings.shakeOn; localStorage.setItem('antEmpire_shake', GameSettings.shakeOn ? '1' : '0');
    this.className = 'toggle-switch' + (GameSettings.shakeOn ? ' on' : '');
  };

  updateBuildButtons();
  if (state.chambers.research.count > 0) {
    var btns = ["btn-upgrades", "btn-shop", "btn-achievements", "btn-daily"];
    for (var bi = 0; bi < btns.length; bi++) { var b = document.getElementById(btns[bi]); if (b) b.style.display = "inline-block"; }
    if (state.level >= BAL.evolutionUnlockLevel) { var evoBtn = document.getElementById("btn-evolution"); if (evoBtn) evoBtn.style.display = "inline-block"; }
  }
  if (state.prestigeCount > 0) { var ppBtn = document.getElementById("btn-prestige-shop"); if (ppBtn) ppBtn.style.display = "inline-block"; }
  if (state.prestigeCount >= BAL.ascendUnlockPrestige || state.ascensionCount > 0) { var ascBtn = document.getElementById("btn-ascension-shop"); if (ascBtn) ascBtn.style.display = "inline-block"; }
  for (var si = 0; si < shopBtns.length; si++) {
    var sid = shopBtns[si];
    if (GEM_ITEMS[sid] && GEM_ITEMS[sid].oneTime && state.gemUpgrades[sid]) {
      var btn = document.getElementById("btn-shop-" + sid);
      if (btn) { btn.disabled = true; btn.textContent = "Owned"; }
    }
  }
  refreshUpgradeUI();
  refreshAscensionShopUI();
    }
