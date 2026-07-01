/* ambient.js — window.Ambient
 * §3/§6/§8: <canvas id="bg"> arka plan particle sistemi (z:1).
 * Ucusan kalpler + petaller + minik yildizlar. Yukari suzulme (vy negatif) +
 * yatay sinus sway + rotasyon; derinlik illuzyonu (size+alpha katmanli);
 * ekran disina cikinca alttan respawn; parcacik sayisi genislige gore
 * (mobil ~16, masaustu ~36); devicePixelRatio olcekli + resize handler; rAF.
 * intensify(ms) gecici spawn/yogunluk artisi (kutlama).
 * CONFIG.reduced true ise az sayida + cok yavas/neredeyse statik.
 * Renk paleti PLAN §1 (rose/gold/cream/peach). Kendi canvas ctx yonetimi.
 * classic script, no import/export. window namespace uzerinden konusur.
 */
(function () {
  'use strict';

  // §1 palet — rose/gold/cream/peach (koyu zeminde yumusak parcaciklar)
  var PALETTE = {
    rose: '#C9718B',
    gold: '#D9A441',
    cream: '#FBF3EC',
    peach: '#F4B9A6'
  };

  // reduced hareket kontrolu: CONFIG.reduced tercih edilir, yoksa matchMedia fallback
  function isReduced() {
    if (window.CONFIG && typeof window.CONFIG.reduced === 'boolean') {
      return window.CONFIG.reduced;
    }
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  var canvas = null;
  var ctx = null;
  var dpr = 1;
  var W = 0; // CSS pixel genislik
  var H = 0; // CSS pixel yukseklik
  var particles = [];
  var rafId = null;
  var running = false;
  var lastT = 0;
  var intensifyUntil = 0; // performance.now() tabanli; > now iken yogunluk artar

  // --- yardimcilar ---
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  // Hedef parcacik sayisi: genislige gore (mobil ~16, masaustu ~36)
  function baseCount() {
    var reduced = isReduced();
    if (reduced) {
      // reduced: cok az parcacik
      return W < 640 ? 6 : 10;
    }
    return W < 640 ? 16 : 36;
  }

  // Tip dagilimi: cogunlukla kalp + petal, biraz yildiz
  function pickType() {
    var r = Math.random();
    if (r < 0.42) return 'heart';
    if (r < 0.80) return 'petal';
    return 'star';
  }

  // Bir parcacik olustur. fromBottom true ise ekranin altindan basla (respawn),
  // aksi halde ekranin herhangi bir dikey noktasindan (ilk dolum).
  function makeParticle(fromBottom) {
    var reduced = isReduced();
    // derinlik: 0 (uzak/kucuk/soluk) .. 1 (yakin/buyuk/net)
    var depth = Math.random();
    var type = pickType();

    var size;
    if (type === 'heart') size = rand(7, 16);
    else if (type === 'petal') size = rand(6, 14);
    else size = rand(1.6, 3.6); // star
    // derinlik olcekleme
    size *= 0.6 + depth * 0.7;

    var color;
    if (type === 'heart') color = Math.random() < 0.5 ? PALETTE.rose : PALETTE.gold;
    else if (type === 'petal') color = Math.random() < 0.6 ? PALETTE.peach : PALETTE.rose;
    else color = Math.random() < 0.5 ? PALETTE.cream : PALETTE.gold;

    // dikey hiz (yukari suzulme = negatif). Yakin (buyuk depth) daha hizli.
    var speed = reduced ? rand(2, 6) : rand(10, 26);
    speed *= 0.55 + depth * 0.9;

    var y;
    if (fromBottom) y = H + size + rand(0, 40);
    else y = rand(-40, H + 40);

    return {
      type: type,
      x: rand(-20, W + 20),
      y: y,
      size: size,
      depth: depth,
      color: color,
      alpha: (0.28 + depth * 0.55), // katmanli alpha (derinlik illuzyonu)
      vy: -speed, // px/sn, yukari
      // yatay sinus sway
      swayAmp: reduced ? rand(2, 8) : rand(10, 40),
      swayFreq: rand(0.15, 0.6), // rad/sn
      swayPhase: rand(0, Math.PI * 2),
      baseX: 0, // asagida set edilir (x'i baz alir)
      rot: rand(0, Math.PI * 2),
      vrot: reduced ? rand(-0.1, 0.1) : rand(-0.8, 0.8), // rad/sn
      twinkle: rand(0, Math.PI * 2) // yildiz parlama fazi
    };
  }

  function primeParticle(p) {
    p.baseX = p.x;
  }

  // --- ciziciler (kendi ctx yonetimi) ---
  function drawHeart(p) {
    var s = p.size;
    ctx.beginPath();
    // basit kalp path (birim ~ s olcekli)
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(s * 0.55, -s * 0.35, s * 1.0, s * 0.15, 0, s * 0.95);
    ctx.bezierCurveTo(-s * 1.0, s * 0.15, -s * 0.55, -s * 0.35, 0, s * 0.35);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  function drawPetal(p) {
    var s = p.size;
    ctx.beginPath();
    // yaprak/petal: iki bezier ile bademsi form
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.75, -s * 0.3, s * 0.55, s * 0.7, 0, s);
    ctx.bezierCurveTo(-s * 0.55, s * 0.7, -s * 0.75, -s * 0.3, 0, -s);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  function drawStar(p, tw) {
    var s = p.size;
    // minik dort-uclu parlama + cekirdek nokta
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
    var spike = s * (1.6 + tw * 0.8);
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    ctx.moveTo(0, -spike);
    ctx.lineTo(s * 0.18, 0);
    ctx.lineTo(0, spike);
    ctx.lineTo(-s * 0.18, 0);
    ctx.closePath();
    ctx.moveTo(-spike, 0);
    ctx.lineTo(0, s * 0.18);
    ctx.lineTo(spike, 0);
    ctx.lineTo(0, -s * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  // --- olcekleme / boyut ---
  function resize() {
    if (!canvas) return;
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
    W = window.innerWidth || document.documentElement.clientWidth || 360;
    H = window.innerHeight || document.documentElement.clientHeight || 640;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 birim = 1 CSS px

    // hedef sayiya gore parcacik havuzunu ayarla (dolum/kirpma)
    var target = baseCount();
    while (particles.length < target) {
      var np = makeParticle(false);
      primeParticle(np);
      particles.push(np);
    }
    if (particles.length > target + 24) {
      particles.length = target; // asiri buyumeyi engelle
    }
  }

  function ensureCanvas() {
    if (canvas) return true;
    canvas = document.getElementById('bg');
    if (!canvas || !canvas.getContext) return false;
    ctx = canvas.getContext('2d');
    return !!ctx;
  }

  // --- animasyon dongusu ---
  function frame(now) {
    if (!running) return;
    if (!lastT) lastT = now;
    var dt = (now - lastT) / 1000; // saniye
    lastT = now;
    if (dt > 0.1) dt = 0.1; // sekme arka plandan donunce sicramayi sinirla

    var reduced = isReduced();
    var boosting = now < intensifyUntil;
    // yogunlukta gecici artis (kutlama): sway ve hiz carpani
    var boostMul = boosting ? 1.6 : 1;

    ctx.clearRect(0, 0, W, H);

    var target = baseCount();
    var extra = boosting && !reduced ? Math.round(target * 0.6) : 0;
    var desired = target + extra;

    // eksikse alttan respawn ekle (yogunluk artisi dahil)
    while (particles.length < desired) {
      var np = makeParticle(true);
      primeParticle(np);
      particles.push(np);
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // dikey hareket (yukari)
      p.y += p.vy * dt * boostMul;
      // yatay sinus sway
      p.swayPhase += p.swayFreq * dt;
      p.x = p.baseX + Math.sin(p.swayPhase) * p.swayAmp;
      // baseX'i cok yavas surukle (dogal drift)
      p.baseX += (reduced ? 0 : Math.sin(p.swayPhase * 0.3)) * 4 * dt;
      // rotasyon
      p.rot += p.vrot * dt * boostMul;
      // yildiz parlama
      p.twinkle += dt * 2.2;

      // ekran ustunden ciktiysa: alttan respawn (fazlaysa cikar)
      if (p.y < -p.size - 30) {
        if (particles.length > desired) {
          particles.splice(i, 1);
          i--;
          continue;
        }
        var fresh = makeParticle(true);
        primeParticle(fresh);
        particles[i] = fresh;
        continue;
      }
      // yatay tasmada geri sar
      if (p.x < -40) p.baseX += W + 80;
      else if (p.x > W + 40) p.baseX -= W + 80;

      // ciz
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      var a = p.alpha;
      if (p.type === 'star') {
        // hafif parlama modulasyonu
        a *= 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(p.twinkle));
      }
      ctx.globalAlpha = a;
      if (p.type === 'heart') drawHeart(p);
      else if (p.type === 'petal') drawPetal(p);
      else drawStar(p, 0.5 + 0.5 * Math.sin(p.twinkle));
      ctx.restore();
    }

    // reduced modda neredeyse statik: yine de rAF dondur ki respawn/temizlik dogru olsun,
    // ama hizlar cok dusuk oldugu icin gorsel neredeyse durur.
    rafId = window.requestAnimationFrame(frame);
  }

  // --- public API (§8) ---
  function start() {
    if (!ensureCanvas()) return;
    if (running) return;
    resize();
    // ilk dolum garanti
    if (particles.length === 0) {
      var target = baseCount();
      for (var i = 0; i < target; i++) {
        var p = makeParticle(false);
        primeParticle(p);
        particles.push(p);
      }
    }
    running = true;
    lastT = 0;
    if (!resizeBound) {
      window.addEventListener('resize', onResize, { passive: true });
      resizeBound = true;
    }
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId != null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (ctx && W && H) ctx.clearRect(0, 0, W, H);
  }

  // gecici yogunluk artisi (ms). CONFIG.reduced'da etkisi minimaldir.
  function intensify(ms) {
    var dur = typeof ms === 'number' && ms > 0 ? ms : 2000;
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    intensifyUntil = Math.max(intensifyUntil, now + dur);
    // canli degilse ( or. reduced) yine de kisa bir spawn dalgasi ekle
    if (running && !isReduced()) {
      var boost = Math.min(10, Math.round(baseCount() * 0.4));
      for (var i = 0; i < boost; i++) {
        var p = makeParticle(true);
        primeParticle(p);
        particles.push(p);
      }
    }
  }

  var resizeBound = false;
  var resizeTimer = null;
  function onResize() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }

  window.Ambient = {
    start: start,
    stop: stop,
    intensify: intensify
  };
})();
