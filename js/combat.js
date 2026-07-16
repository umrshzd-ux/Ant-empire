// ===== COMBAT RESOLUTION (SPIDERS ONLY – BOSSES MOVED TO bosses.js) =====

function combatUpdate(dt) {
  var cdt = Math.min(dt, 0.2);
  var guardRadius = getEffectiveGuardRadius();
  var defenseActive = state.defenseBannerTimer > 0;

  // Soldier attacks vs spiders
  for (var i = soldiers.length - 1; i >= 0; i--) {
    var s = soldiers[i];
    if (s.attackCooldown > 0) s.attackCooldown -= cdt;
    var te = null, nd = 1.8;
    for (var j = 0; j < enemies.length; j++) {
      var d = s.mesh.position.distanceTo(enemies[j].mesh.position);
      if (d < nd) { nd = d; te = enemies[j]; }
    }
    if (te && s.attackCooldown <= 0) {
      var dmg = getEffectiveSoldierDamage();
      if (s.damageMultiplier) dmg *= s.damageMultiplier;
      te.health -= dmg;
      spawnDamageNumber(dmg, te.mesh.position, "#ff4444");
      s.attackCooldown = BAL.soldierAttackCD;
      s.lastCombatTime = performance.now() / 1000;
      if (te.health <= 0) killSpider(te);
    }
  }

  // Spider attacks vs soldiers / nest
  for (var j = enemies.length - 1; j >= 0; j--) {
    var sp = enemies[j];
    if (sp.stealing) continue;
    var dtn = sp.mesh.position.distanceTo(ER);
    var hasNearbySoldier = false;
    for (var i = 0; i < soldiers.length; i++) {
      if (sp.mesh.position.distanceTo(soldiers[i].mesh.position) < guardRadius) {
        hasNearbySoldier = true;
        break;
      }
    }
    var canSneak = (dtn < 1.2 && !hasNearbySoldier && Math.random() < BAL.spiderSneakChance);
    if ((dtn < 1.0 && soldiers.length === 0) || canSneak) {
      var stolen = Math.min(state.food, BAL.spiderStealMin + Math.floor(Math.random() * (BAL.spiderStealMax - BAL.spiderStealMin + 1)));
      state.food = Math.max(0, state.food - stolen);
      sp.stealing = true;
      sp.fleeTarget = sp.mesh.position.clone().add(new THREE.Vector3(SW / 2, 0, 0));
      showToast("🕷️ Spider stole " + stolen + " food!");
      spawnFloater("-" + stolen + " 🌾", window.innerWidth / 2, window.innerHeight / 2, "#ff6666");
      continue;
    }
    if (sp.attackCooldown > 0) { sp.attackCooldown -= cdt; continue; }
    var ts = null, nsd = 1.5;
    for (var i = 0; i < soldiers.length; i++) {
      var d = sp.mesh.position.distanceTo(soldiers[i].mesh.position);
      if (d < nsd) { nsd = d; ts = soldiers[i]; }
    }
    if (ts) {
      var dmg = BAL.spiderDamage;
      if (defenseActive) dmg *= 0.5;
      ts.health -= dmg;
      spawnDamageNumber(dmg, ts.mesh.position, "#ffaa00");
      sp.attackCooldown = BAL.spiderAttackCD;
      ts.lastCombatTime = performance.now() / 1000;
      updateHealthBar(ts.healthBar, ts.health / ts.maxHealth);
      if (ts.health <= 0) soldierDied(ts);
    }
  }
}
