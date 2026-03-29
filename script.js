document.addEventListener("DOMContentLoaded", () => {
  // ==================== DOM ====================
  const ocean = document.getElementById("ocean");
  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const bestEl = document.getElementById("best");
  const comboEl = document.getElementById("combo");
  const multiplierEl = document.getElementById("multiplier");
  const hudCombo = document.getElementById("hudCombo");
  const hudTimer = document.getElementById("hudTimer");
  const hudItems = document.getElementById("hudItems");
  const titleScreen = document.getElementById("titleScreen");
  const titleBg = document.getElementById("titleBg");
  const resultScreen = document.getElementById("resultScreen");
  const resultScoreEl = document.getElementById("resultScore");
  const resultBestEl = document.getElementById("resultBest");
  const resultTitleEl = document.getElementById("resultTitle");
  const resultStats = document.getElementById("resultStats");
  const newBestEl = document.getElementById("newBest");
  const btnStart = document.getElementById("btnStart");
  const btnRetry = document.getElementById("btnRetry");
  const btnShare = document.getElementById("btnShare");
  const screenFlash = document.getElementById("screenFlash");
  const game = document.getElementById("game");

  // ==================== CONSTANTS ====================
  const GAME_DURATION = 30;
  const FISH_COUNT = 40;
  const SPAWN_INTERVAL = 800;
  const ITEM_SPAWN_INTERVAL = 4000;
  const COMBO_TIMEOUT = 3000;
  const NET_RADIUS = 200;

  const FISH_TYPES = {
    golden: { points: 5, sizeMin: 140, sizeMax: 180, speedMult: 0.85 },
    bomb:   { points: 0, sizeMin: 110, sizeMax: 150, speedMult: 1.0 },
    speed:  { points: 3, sizeMin: 110, sizeMax: 160, speedMult: 0.5 },
    normal: { points: 1, sizeMin: 110, sizeMax: 170, speedMult: 1.0 }
  };

  const ITEM_TYPES = ["freeze", "net", "x2"];
  const ITEM_ICONS = { freeze: "\u2744\uFE0F", net: "\uD83D\uDD78\uFE0F", x2: "\u2B50" };
  const ITEM_DURATIONS = { freeze: 5, net: 8, x2: 8 };

  const TITLES = [
    { min: 180, title: "EFD\u795E",               desc: "\u795E\u306E\u9818\u57DF" },
    { min: 150, title: "\u3048\u3044\u3061\u3092\u8D85\u3048\u3057\u8005",     desc: "\u751F\u307F\u306E\u89AA\u3059\u3089\u8D85\u3048\u305F" },
    { min: 130, title: "EFD\u7D76\u5BFE\u6355\u7372\u30DE\u30B7\u30FC\u30F3", desc: "\u4EBA\u9593\u3092\u3084\u3081\u305F" },
    { min: 110, title: "\u4F1D\u8AAC\u306EEFD\u30DE\u30B9\u30BF\u30FC",   desc: "\u3082\u306F\u3084\u4F1D\u8AAC" },
    { min: 90,  title: "\u6DF1\u6D77\u306E\u652F\u914D\u8005",         desc: "\u6D77\u3092\u7D71\u3079\u308B\u8005" },
    { min: 70,  title: "EFD\u306E\u5929\u6575",           desc: "EFD\u304C\u6050\u308C\u308B\u5B58\u5728" },
    { min: 55,  title: "EFD\u30B9\u30EC\u30A4\u30E4\u30FC",       desc: "\u304B\u306A\u308A\u306E\u5B9F\u529B\u8005" },
    { min: 40,  title: "\u51C4\u8155\u30AD\u30E3\u30C3\u30C1\u30E3\u30FC",       desc: "\u4E0A\u624B\u3044\uFF01" },
    { min: 25,  title: "\u4E00\u4EBA\u524D\u306EEFD\u30CF\u30F3\u30BF\u30FC", desc: "\u306A\u304B\u306A\u304B\u3084\u308B\u3058\u3083\u3093" },
    { min: 15,  title: "EFD\u898B\u7FD2\u3044",           desc: "\u57FA\u672C\u306F\u6451\u3081\u3066\u304D\u305F" },
    { min: 5,   title: "\u306B\u308F\u304B\u6F01\u5E2B",             desc: "\u307E\u3060\u307E\u3060\u3053\u308C\u304B\u3089" },
    { min: 0,   title: "EFD\u306B\u904A\u3070\u308C\u3057\u8005",   desc: "\u5168\u7136\u6355\u307E\u3048\u3089\u308C\u306A\u304B\u3063\u305F..." }
  ];

  // ==================== STATE ====================
  let score = 0;
  let timeLeft = GAME_DURATION;
  let timerInterval = null;
  let spawnInterval = null;
  let itemSpawnInterval = null;
  let itemUpdateInterval = null;
  let bestScore = parseInt(localStorage.getItem("efd_best") || "0", 10);
  let combo = 0;
  let maxCombo = 0;
  let totalCatches = 0;
  let comboTimer = null;
  let gameRunning = false;

  let activeItems = {
    freeze: { active: false, endTime: 0 },
    net:    { active: false, endTime: 0 },
    x2:     { active: false, endTime: 0 }
  };

  bestEl.textContent = bestScore;

  // ==================== AUDIO ====================
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      switch (type) {
        case "catch": {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.setValueAtTime(800, now);
          o.frequency.exponentialRampToValueAtTime(400, now + 0.1);
          g.gain.setValueAtTime(0.15, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          o.start(now); o.stop(now + 0.15);
          break;
        }
        case "golden": {
          [0, 0.06, 0.12].forEach((t, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = "sine";
            o.frequency.setValueAtTime(800 + i * 400, now + t);
            g.gain.setValueAtTime(0.12, now + t);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
            o.start(now + t); o.stop(now + t + 0.12);
          });
          break;
        }
        case "bomb": {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sawtooth";
          o.frequency.setValueAtTime(200, now);
          o.frequency.exponentialRampToValueAtTime(60, now + 0.3);
          g.gain.setValueAtTime(0.2, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          o.start(now); o.stop(now + 0.35);
          break;
        }
        case "item": {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.setValueAtTime(500, now);
          o.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
          g.gain.setValueAtTime(0.15, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          o.start(now); o.stop(now + 0.2);
          break;
        }
        case "combo": {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "triangle";
          o.frequency.setValueAtTime(600, now);
          o.frequency.setValueAtTime(1000, now + 0.05);
          g.gain.setValueAtTime(0.12, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          o.start(now); o.stop(now + 0.2);
          break;
        }
      }
    } catch (_) {}
  }

  // ==================== TITLE SCREEN BG ====================
  function spawnTitleFish() {
    titleBg.innerHTML = "";
    for (let i = 0; i < 15; i++) {
      const img = document.createElement("img");
      img.src = "efd.png";
      img.alt = "";
      img.className = "fish title-fish";

      const size = 60 + Math.random() * 100;
      const goLeft = Math.random() > 0.5;
      const baseY = 5 + Math.random() * 85;
      const dur = 7 + Math.random() * 10;
      const delay = -(Math.random() * dur);
      const wave = 12 + Math.random() * 35;
      const wave2 = 8 + Math.random() * 20;
      const rot = (Math.random() - 0.5) * 15;

      img.style.cssText = [
        `--s:${size}px`,
        `--startX:${goLeft ? "110vw" : "-20vw"}`,
        `--endX:${goLeft ? "-20vw" : "110vw"}`,
        `--baseY:${baseY}vh`,
        `--wave:${wave}px`,
        `--wave2:${wave2}px`,
        `--r:${rot}deg`,
        `--dir:${goLeft ? 1 : -1}`,
        `--o:0.12`,
        `animation-delay:${delay.toFixed(1)}s`,
        `animation-duration:${dur.toFixed(1)}s`
      ].join(";");

      titleBg.appendChild(img);
    }
  }

  spawnTitleFish();

  // ==================== GAME FLOW ====================
  btnStart.addEventListener("click", startGame);
  btnRetry.addEventListener("click", startGame);
  btnShare.addEventListener("click", shareToX);

  function startGame() {
    titleScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    hud.classList.add("visible");
    ocean.innerHTML = "";

    score = 0;
    timeLeft = GAME_DURATION;
    combo = 0;
    maxCombo = 0;
    totalCatches = 0;
    gameRunning = true;

    for (const k of ITEM_TYPES) {
      activeItems[k].active = false;
      activeItems[k].endTime = 0;
    }

    scoreEl.textContent = "0";
    timerEl.textContent = GAME_DURATION;
    bestEl.textContent = bestScore;
    comboEl.textContent = "0";
    multiplierEl.textContent = "x1";
    hudCombo.classList.remove("active", "milestone");
    hudTimer.classList.remove("urgent", "frozen");
    hudItems.innerHTML = "";
    ocean.classList.remove("net-active", "frozen");

    for (let i = 0; i < FISH_COUNT; i++) spawnFish();

    spawnInterval = setInterval(() => {
      const current = ocean.querySelectorAll(".fish:not(.caught)").length;
      if (current < FISH_COUNT) spawnFish();
    }, SPAWN_INTERVAL);

    itemSpawnInterval = setInterval(spawnItem, ITEM_SPAWN_INTERVAL);
    itemUpdateInterval = setInterval(updateItemsHUD, 100);
    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    if (activeItems.freeze.active) return;

    timeLeft--;
    timerEl.textContent = Math.max(0, timeLeft);

    if (timeLeft <= 10) hudTimer.classList.add("urgent");
    if (timeLeft <= 0) endGame();
  }

  function endGame() {
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    clearInterval(itemSpawnInterval);
    clearInterval(itemUpdateInterval);
    clearTimeout(comboTimer);
    gameRunning = false;

    for (const k of ITEM_TYPES) activeItems[k].active = false;
    ocean.classList.remove("net-active", "frozen");
    hudTimer.classList.remove("frozen");
    hud.classList.remove("visible");

    const isNewBest = score > bestScore;
    if (isNewBest) {
      bestScore = score;
      localStorage.setItem("efd_best", String(bestScore));
    }

    const titleInfo = getTitle(score);
    resultTitleEl.textContent = "\u300C" + titleInfo.title + "\u300D";
    resultScoreEl.textContent = score;
    resultBestEl.textContent = bestScore;
    resultStats.innerHTML =
      `<span>CATCH: ${totalCatches}</span>` +
      `<span>MAX COMBO: ${maxCombo}</span>`;
    newBestEl.classList.toggle("hidden", !isNewBest);

    resultScreen.classList.remove("hidden");
  }

  // ==================== DIFFICULTY ====================
  function getDifficulty() {
    if (timeLeft <= 10) {
      return { speedMult: 0.67, bombChance: 0.15, goldenChance: 0.08 };
    }
    if (timeLeft <= 20) {
      return { speedMult: 0.83, bombChance: 0.10, goldenChance: 0.05 };
    }
    return { speedMult: 1.0, bombChance: 0.08, goldenChance: 0.05 };
  }

  // ==================== SPAWN FISH ====================
  function spawnFish() {
    const diff = getDifficulty();
    const roll = Math.random();

    let fishType;
    if (roll < diff.goldenChance) {
      fishType = "golden";
    } else if (roll < diff.goldenChance + diff.bombChance) {
      fishType = "bomb";
    } else if (roll < diff.goldenChance + diff.bombChance + 0.10) {
      fishType = "speed";
    } else {
      fishType = "normal";
    }

    const info = FISH_TYPES[fishType];
    const img = document.createElement("img");
    img.src = "efd.png";
    img.alt = "";
    img.className = "fish";
    if (fishType !== "normal") img.classList.add("fish-" + fishType);
    img.dataset.type = fishType;

    const size = info.sizeMin + Math.random() * (info.sizeMax - info.sizeMin);
    const goLeft = Math.random() > 0.5;
    const baseY = 5 + Math.random() * 80;
    const baseDur = 4 + Math.random() * 7;
    const dur = baseDur * info.speedMult * diff.speedMult;
    const delay = -(Math.random() * dur);
    const wave = 15 + Math.random() * 50;
    const wave2 = 10 + Math.random() * 30;
    const rot = (Math.random() - 0.5) * 24;
    const opacity = fishType === "bomb" ? 0.92 : (0.7 + Math.random() * 0.3);

    img.style.cssText = [
      `--s:${size}px`,
      `--startX:${goLeft ? "110vw" : "-20vw"}`,
      `--endX:${goLeft ? "-20vw" : "110vw"}`,
      `--baseY:${baseY}vh`,
      `--wave:${wave}px`,
      `--wave2:${wave2}px`,
      `--r:${rot}deg`,
      `--dir:${goLeft ? 1 : -1}`,
      `--o:${opacity.toFixed(2)}`,
      `animation-delay:${delay.toFixed(1)}s`,
      `animation-duration:${dur.toFixed(1)}s`
    ].join(";");

    ocean.appendChild(img);
  }

  // ==================== SPAWN ITEM ====================
  function spawnItem() {
    if (!gameRunning) return;

    const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    const el = document.createElement("div");
    el.className = "item-bubble";
    el.dataset.itemType = type;
    el.textContent = ITEM_ICONS[type];

    const goLeft = Math.random() > 0.5;
    const baseY = 10 + Math.random() * 70;
    const dur = 5 + Math.random() * 5;

    el.style.cssText = [
      `--startX:${goLeft ? "110vw" : "-10vw"}`,
      `--endX:${goLeft ? "-10vw" : "110vw"}`,
      `--baseY:${baseY}vh`,
      `--wave:${20 + Math.random() * 30}px`,
      `--wave2:${10 + Math.random() * 20}px`,
      `--r:0deg`,
      `--dir:1`,
      `animation-delay:0s`,
      `animation-duration:${dur.toFixed(1)}s`
    ].join(";");

    ocean.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, dur * 1000 + 500);
  }

  // ==================== CLICK HANDLER ====================
  ocean.addEventListener("click", (e) => {
    if (!gameRunning) return;

    const item = e.target.closest(".item-bubble");
    if (item) {
      collectItem(item);
      return;
    }

    if (activeItems.net.active) {
      handleNetClick(e.clientX, e.clientY);
      return;
    }

    const fish = e.target.closest(".fish");
    if (fish && !fish.classList.contains("caught")) {
      processFishCatch(fish);
      return;
    }

    const click = { x: e.clientX, y: e.clientY };
    const allFish = ocean.querySelectorAll(".fish:not(.caught)");
    let nearest = null;
    let minDist = Infinity;
    for (const f of allFish) {
      const rect = f.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(click.x - cx, click.y - cy);
      const threshold = Math.max(rect.width, rect.height) * 0.8;
      if (dist < threshold && dist < minDist) {
        minDist = dist;
        nearest = f;
      }
    }
    if (nearest) processFishCatch(nearest);
  });

  // ==================== CATCH ====================
  function processFishCatch(fish) {
    if (fish.classList.contains("caught")) return;

    const fishType = fish.dataset.type || "normal";
    const rect = fish.getBoundingClientRect();
    const oceanRect = ocean.getBoundingClientRect();
    const cx = rect.left - oceanRect.left + rect.width / 2;
    const cy = rect.top - oceanRect.top + rect.height / 2;

    fish.style.animation = "none";
    fish.style.left = cx + "px";
    fish.style.top = cy + "px";
    fish.style.transform = "translate(-50%, -50%)";
    fish.style.opacity = "1";
    fish.offsetHeight;
    fish.classList.add("caught");

    if (fishType === "bomb") {
      handleBomb(cx, cy);
    } else {
      handleGoodCatch(fishType, cx, cy);
    }

    fish.addEventListener("animationend", () => fish.remove(), { once: true });
  }

  function handleGoodCatch(fishType, x, y) {
    const basePoints = FISH_TYPES[fishType].points;
    addCombo();
    totalCatches++;

    const comboMult = getComboMultiplier();
    const x2Mult = activeItems.x2.active ? 2 : 1;
    const totalPoints = Math.round(basePoints * comboMult * x2Mult);

    score += totalPoints;
    scoreEl.textContent = score;

    const colors = { normal: "#e07a3a", golden: "#ffd700", speed: "#4db8db" };
    const color = colors[fishType] || "#e07a3a";

    spawnBurst(x, y, color);
    showPointText(x, y, "+" + totalPoints, color);

    if (fishType === "golden") {
      playSound("golden");
      flashScreen("gold");
    } else {
      playSound("catch");
    }
  }

  function handleBomb(x, y) {
    timeLeft = Math.max(0, timeLeft - 5);
    timerEl.textContent = Math.max(0, timeLeft);

    resetCombo();

    spawnBurst(x, y, "#ff3344");
    showPointText(x, y, "-5s", "#ff3344");
    playSound("bomb");
    flashScreen("red");
    shakeScreen();

    if (timeLeft <= 0) endGame();
  }

  // ==================== NET AOE ====================
  function handleNetClick(clickX, clickY) {
    const oceanRect = ocean.getBoundingClientRect();
    const ox = clickX - oceanRect.left;
    const oy = clickY - oceanRect.top;

    showNetAOE(ox, oy);

    const allFish = ocean.querySelectorAll(".fish:not(.caught)");
    let caught = false;
    for (const f of allFish) {
      const rect = f.getBoundingClientRect();
      const fx = rect.left - oceanRect.left + rect.width / 2;
      const fy = rect.top - oceanRect.top + rect.height / 2;
      if (Math.hypot(ox - fx, oy - fy) <= NET_RADIUS) {
        processFishCatch(f);
        caught = true;
      }
    }

    if (caught) playSound("catch");
  }

  function showNetAOE(x, y) {
    const el = document.createElement("div");
    el.className = "net-aoe";
    el.style.left = x + "px";
    el.style.top = y + "px";
    ocean.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  // ==================== ITEMS ====================
  function collectItem(el) {
    const type = el.dataset.itemType;
    const rect = el.getBoundingClientRect();
    const oceanRect = ocean.getBoundingClientRect();
    const x = rect.left - oceanRect.left + rect.width / 2;
    const y = rect.top - oceanRect.top + rect.height / 2;

    el.remove();
    activateItem(type);
    playSound("item");
    spawnBurst(x, y, "#e07a3a");
  }

  function activateItem(type) {
    const duration = ITEM_DURATIONS[type] * 1000;
    activeItems[type].active = true;
    activeItems[type].endTime = Date.now() + duration;

    if (type === "freeze") {
      ocean.classList.add("frozen");
      hudTimer.classList.add("frozen");
      flashScreen("blue");
    } else if (type === "net") {
      ocean.classList.add("net-active");
    }

    setTimeout(() => {
      activeItems[type].active = false;
      if (type === "freeze") {
        ocean.classList.remove("frozen");
        hudTimer.classList.remove("frozen");
      }
      if (type === "net") {
        ocean.classList.remove("net-active");
      }
    }, duration);
  }

  function updateItemsHUD() {
    let html = "";
    for (const type of ITEM_TYPES) {
      if (activeItems[type].active) {
        const sec = Math.max(0, Math.ceil((activeItems[type].endTime - Date.now()) / 1000));
        html += `<div class="hud-item-active">${ITEM_ICONS[type]} ${sec}s</div>`;
      }
    }
    hudItems.innerHTML = html;
  }

  // ==================== COMBO ====================
  function addCombo() {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    comboEl.textContent = combo;
    hudCombo.classList.add("active");

    const mult = getComboMultiplier();
    multiplierEl.textContent = "x" + mult;

    if (combo > 0 && combo % 5 === 0) {
      playSound("combo");
      hudCombo.classList.add("milestone");
      setTimeout(() => hudCombo.classList.remove("milestone"), 600);
    }

    clearTimeout(comboTimer);
    comboTimer = setTimeout(resetCombo, COMBO_TIMEOUT);
  }

  function resetCombo() {
    combo = 0;
    comboEl.textContent = "0";
    multiplierEl.textContent = "x1";
    hudCombo.classList.remove("active", "milestone");
    clearTimeout(comboTimer);
  }

  function getComboMultiplier() {
    return 1 + Math.min(Math.floor(combo / 5), 4) * 0.5;
  }

  // ==================== VISUAL EFFECTS ====================
  function spawnBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div");
      p.className = "burst";
      const angle = (Math.PI * 2 / 8) * i;
      const dist = 12 + Math.random() * 10;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = color;
      p.style.setProperty("--bx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--by", Math.sin(angle) * dist + "px");
      ocean.appendChild(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }

  function showPointText(x, y, text, color) {
    const el = document.createElement("div");
    el.className = "plus-text";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = (y - 20) + "px";
    el.style.color = color;
    ocean.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  function flashScreen(type) {
    screenFlash.className = "screen-flash " + type;
    setTimeout(() => { screenFlash.className = "screen-flash"; }, 200);
  }

  function shakeScreen() {
    game.classList.remove("shake");
    game.offsetHeight;
    game.classList.add("shake");
    setTimeout(() => game.classList.remove("shake"), 400);
  }

  // ==================== TITLES ====================
  function getTitle(s) {
    for (const t of TITLES) {
      if (s >= t.min) return t;
    }
    return TITLES[TITLES.length - 1];
  }

  // ==================== X SHARE ====================
  function shareToX() {
    const titleInfo = getTitle(score);
    const text =
      "EFD CATCH! \u3067" + score + "\u70B9\u3092\u7372\u5F97\uFF01\n" +
      "\u79F0\u53F7:\u300C" + titleInfo.title + "\u300D\n" +
      "\u30A8\u30A4\u30C1\u30D5\u30A3\u30C3\u30B7\u30E5\u30C7\u30FC\u30E2\u30F3\u3092\u6355\u307E\u3048\u3088\u3046\uFF01";
    const url = window.location.href;
    const shareUrl =
      "https://x.com/intent/tweet?text=" + encodeURIComponent(text) +
      "&url=" + encodeURIComponent(url) +
      "&hashtags=EFD_CATCH";
    window.open(shareUrl, "_blank", "width=550,height=420");
  }
});
