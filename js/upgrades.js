// ===== RESEARCH UPGRADES =====

function buyUpgrade(type) {
  var upg = UPGRADES[type];
  var cl = state.upgrades[type];
  if (cl >= upg.maxLevel) { showToast("Max level!"); return; }
  var cost = getUpgradeCost(type);
  if (state.food < cost) { showToast("Need " + cost + " food!"); return; }
  state.food -= cost;
  state.upgrades[type]++;
  var msg = "";
  AudioManager.sfx.upgrade();
  updateDailyProgress('upgrade1', 1);
  if (type === "soldierDamage") {
    msg = "⚔️ Soldier Might Lv" + (cl + 1);
    for (var si = 0; si < soldiers.length; si++) {
      var s = soldiers[si];
      var mands = s.mesh.userData.mandibles;
      if (mands && mands.length > 0) {
        var nt = BAL.soldierMandibleBaseThickness + state.upgrades.soldierDamage * BAL.soldierMandibleScalePerUpgrade;
        for (var mi = 0; mi < mands.length; mi++) {
          mands[mi].geometry.dispose();
          mands[mi].geometry = new THREE.CylinderGeometry(nt, nt * 0.8, 0.12, 4);
          mands[mi].userData = { baseRX: mands[mi].rotation.x };
        }
      }
      if (s.mesh.userData.labelObj) setLabelText(s.mesh.userData.labelObj, "🛡️ Soldier Lv" + (state.upgrades.soldierDamage + 1));
    }
  } else if (type === "workerSpeed") {
    msg = "💨 Worker Haste Lv" + (cl + 1);
    var ns = getWorkerVisualScale();
    for (var wi = 0; wi < workers.length; wi++) {
      var w = workers[wi];
      if (!w.isSoldier && !w.isScout && w.rendered) {
        w.mesh.scale.setScalar(ns);
        w.targetScale = ns;
      }
    }
    applyAllWorkerSpeeds();
  } else if (type === "eggLayTime") {
    updateEggLayTime();
    msg = "🥚 Queen Fertility Lv" + (cl + 1);
  } else if (type === "foodCap") {
    recalculateFoodCap();
    msg = "📦 Storage Lv" + (cl + 1);
  }
  showToast(msg);
  refreshUpgradeUI();
  refreshHUD();
}
