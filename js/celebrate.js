/* celebrate.js — window.Celebrate
 * Tek #fx canvas + #pulse overlay ile kutlama efektleri (kütüphane YOK, ses YOK).
 * PLAN.md §6 / §8 / §9 sözleşmesine göre.
 * classic script — import/export YOK, window üstünde global namespace.
 */
(function () {
  'use strict';

  // ---- Palet (PLAN §1 — birebir) ----
  var GOLD = '#D9A441';
  var CREAM = '#FBF3EC';
  var ROSE = '#C9718B';
  var PEACH = '#F4B9A6';

  // ---- reduced-motion (CONFIG öncelikli, yoksa matchMedia fallback) ----
  function isReduced() {
    try {
      if (window.CONFIG && typeof window.CONFIG.reduced === 'boolean') {
        return window.CONFIG.reduced;
      }
    } catch (e) { /* CONFIG henüz yok — fallback */ }
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  var MAX_PARTICLES = 200;

  // ---- Canvas state ----
  var canvas = null;
  var ctx = null;
  var dpr = 1;
  var particles = [];
  var rafId = 0;
  var running = false;

  function ensureCanvas() {
    if (canvas) return true;
    canvas = document.getElementById('fx');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize, false);
    return true;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    // <canvas> replaced-element olduğu için #fx{inset:0} onu ESNETMEZ (intrinsic 300x150'de kalır);
    // bu yüzden clientWidth yerine viewport'u kullan + style ile render boyutunu AÇIKÇA ayarla
    // (ambient.js ile aynı kanonik desen — retina'da taşma yok, konfeti viewport koordinatında doğru).
    var w = window.innerWidth || document.documentElement.clientWidth || 360;
    var h = window.innerHeight || document.documentElement.clientHeight || 640;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    // Tüm çizim CSS-piksel koordinatında; DPR ölçeği matriste.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function viewW() { return window.innerWidth || (canvas && canvas.clientWidth) || 360; }
  function viewH() { return window.innerHeight || (canvas && canvas.clientHeight) || 640; }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  // ---- Parçacık fabrikaları ----
  // Kalp: heart-path, rose+gold dolgu, döner + süzülür.
  function makeHeart(x, y, opts) {
    var reduced = opts.reduced;
    var ang = rand(0, Math.PI * 2);
    var speed = reduced ? rand(0.4, 1.4) : rand(2, 6.5);
    return {
      kind: 'heart',
      x: x, y: y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - (reduced ? rand(0.5, 1.5) : rand(3, 7)), // yukarı doğru başla
      size: rand(9, 18),
      rot: rand(0, Math.PI * 2),
      vr: reduced ? rand(-0.02, 0.02) : rand(-0.16, 0.16),
      color: Math.random() < 0.5 ? ROSE : GOLD,
      life: 1,
      decay: reduced ? rand(0.010, 0.018) : rand(0.008, 0.016)
    };
  }

  // Konfeti şeridi: ince dikdörtgen, gold/cream/rose, scaleX flip (sallanma).
  function makeConfetti(x, y, opts) {
    var reduced = opts.reduced;
    var ang = rand(0, Math.PI * 2);
    var speed = reduced ? rand(0.4, 1.4) : rand(2.5, 7);
    return {
      kind: 'confetti',
      x: x, y: y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - (reduced ? rand(0.5, 1.5) : rand(3, 7)),
      w: rand(4, 8),
      h: rand(9, 16),
      rot: rand(0, Math.PI * 2),
      vr: reduced ? rand(-0.03, 0.03) : rand(-0.3, 0.3),
      flip: rand(0, Math.PI * 2),
      vflip: reduced ? rand(0.02, 0.06) : rand(0.12, 0.28),
      color: pick([GOLD, CREAM, ROSE]),
      life: 1,
      decay: reduced ? rand(0.010, 0.018) : rand(0.008, 0.016)
    };
  }

  // Üstten düşen kalp (rain): aşağı doğru başlar, hafif yanal.
  function makeRainHeart(opts) {
    var reduced = opts.reduced;
    return {
      kind: 'heart',
      x: rand(0, viewW()),
      y: rand(-40, -10),
      vx: rand(-0.6, 0.6),
      vy: reduced ? rand(0.6, 1.4) : rand(1.2, 3),
      size: rand(10, 20),
      rot: rand(-0.4, 0.4),
      vr: reduced ? rand(-0.02, 0.02) : rand(-0.08, 0.08),
      color: Math.random() < 0.5 ? ROSE : GOLD,
      life: 1,
      // rain: yerçekimi hafif; ekran boyu düşüş için yavaş sönüm
      decay: reduced ? rand(0.006, 0.010) : rand(0.004, 0.008),
      isRain: true
    };
  }

  function addParticles(list) {
    for (var i = 0; i < list.length; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      particles.push(list[i]);
    }
    startLoop();
  }

  // ---- Fizik + çizim ----
  function step() {
    if (!ctx) { running = false; rafId = 0; return; }
    ctx.clearRect(0, 0, viewW(), viewH());

    var alive = [];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // Fizik: gravity += 0.15/frame, drag vx*=0.99, rotasyon, life fade
      p.vy += 0.15;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.kind === 'confetti') { p.flip += p.vflip; }
      p.life -= p.decay;

      if (p.life > 0 && p.y < viewH() + 60) {
        alive.push(p);
        drawParticle(p);
      }
    }
    particles = alive;

    if (particles.length > 0) {
      rafId = requestAnimationFrame(step);
    } else {
      // Dizi boşaldı → canvas temizle ve rAF DURDUR (CPU boşa dönmesin).
      ctx.clearRect(0, 0, viewW(), viewH());
      running = false;
      rafId = 0;
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.kind === 'heart') {
      drawHeart(p.size);
    } else {
      // scaleX flip — şeridin dönüp yassılması
      var sx = Math.cos(p.flip);
      ctx.scale(sx, 1);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  // Merkezi (0,0) olan kalp path'i, ~s piksel genişlikte.
  function drawHeart(s) {
    var k = s / 16;
    ctx.beginPath();
    ctx.moveTo(0, 4 * k);
    ctx.bezierCurveTo(-8 * k, -6 * k, -16 * k, 4 * k, 0, 14 * k);
    ctx.bezierCurveTo(16 * k, 4 * k, 8 * k, -6 * k, 0, 4 * k);
    ctx.closePath();
    ctx.fill();
  }

  // ---- #pulse overlay (ışık glow, #pulse.go 600ms) ----
  var pulseEl = null;
  var pulseTimer = 0;
  function pulse() {
    if (!pulseEl) pulseEl = document.getElementById('pulse');
    if (!pulseEl) return;
    // yeniden tetiklemek için class'ı sıfırla
    pulseEl.classList.remove('go');
    // reflow ile animasyon restart
    void pulseEl.offsetWidth;
    pulseEl.classList.add('go');
    if (pulseTimer) clearTimeout(pulseTimer);
    pulseTimer = setTimeout(function () {
      if (pulseEl) pulseEl.classList.remove('go');
      pulseTimer = 0;
    }, 620);
  }

  // ---- Public API (PLAN §8 birebir) ----

  // burst(x,y,count=60,opts={hearts:true}) — İKİ dalga: kalpler + konfeti.
  function burst(x, y, count, opts) {
    if (!ensureCanvas()) return;
    if (typeof count !== 'number') count = 60;
    opts = opts || { hearts: true };
    var wantHearts = (opts.hearts !== false);
    var reduced = isReduced();

    if (reduced) {
      // Yoğun düşme yerine ~20 parçacıklı tek yumuşak sparkle.
      var list = [];
      for (var r = 0; r < 20; r++) {
        list.push(wantHearts && r % 2 === 0
          ? makeHeart(x, y, { reduced: true })
          : makeConfetti(x, y, { reduced: true }));
      }
      addParticles(list);
      return;
    }

    var hearts = wantHearts ? Math.round(count * 0.55) : 0;
    var confetti = count - hearts;
    var out = [];
    var i;
    for (i = 0; i < hearts; i++) out.push(makeHeart(x, y, { reduced: false }));
    for (i = 0; i < confetti; i++) out.push(makeConfetti(x, y, { reduced: false }));
    addParticles(out);
  }

  // fountain() — merkez-üstten fıskiye + 2 yan popper + pulse().
  function fountain() {
    if (!ensureCanvas()) { pulse(); return; }
    var w = viewW(), h = viewH();
    pulse();
    if (isReduced()) {
      burst(w / 2, h * 0.4, 20, { hearts: true });
      return;
    }
    // Merkez-üst fıskiye
    burst(w / 2, h * 0.28, 70, { hearts: true });
    // İki yan popper — biraz gecikmeli
    setTimeout(function () { burst(w * 0.14, h * 0.5, 40, { hearts: true }); }, 140);
    setTimeout(function () { burst(w * 0.86, h * 0.5, 40, { hearts: true }); }, 260);
  }

  // mini(x,y) — küçük burst (buton tık / kopyalama ödülü).
  function mini(x, y) {
    if (!ensureCanvas()) return;
    if (typeof x !== 'number') x = viewW() / 2;
    if (typeof y !== 'number') y = viewH() / 2;
    burst(x, y, isReduced() ? 12 : 24, { hearts: true });
  }

  // rain() — üstten kalp yağmuru (Ekran 5).
  function rain() {
    if (!ensureCanvas()) return;
    var reduced = isReduced();
    var total = reduced ? 20 : 90;
    var perWave = reduced ? 6 : 10;
    var waves = Math.ceil(total / perWave);
    var w = 0;
    function drop() {
      var list = [];
      for (var i = 0; i < perWave; i++) list.push(makeRainHeart({ reduced: reduced }));
      addParticles(list);
      w++;
      if (w < waves) setTimeout(drop, reduced ? 260 : 180);
    }
    drop();
  }

  window.Celebrate = {
    burst: burst,
    fountain: fountain,
    mini: mini,
    rain: rain,
    pulse: pulse
  };
})();
