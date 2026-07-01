/* escape.js — Kaçan "Hayır" mekaniği (PLAN.md §5 / §8)
 * window.Escape = { init({onAccept}), disable(), reset() }
 * Classic script, global namespace, no import/export. */
(function () {
  "use strict";

  // --- Ayarlanabilir eşikler (PLAN §5) ---
  var TRIGGER_MARGIN = 34;  // imleç butonun KENARINA bu kadar yaklaşınca kaç (row'u değil butonu hedefler)
  var FLEE_COOLDOWN = 260;  // iki kaçış arası min süre (ms) — mesajlar bir anda tükenmesin
  var FLEE_MIN_DIST = 150;  // yeni konum fareden > 150px uzak
  var EDGE_PAD = 12;        // viewport kenar payı (clamp)
  var YES_SCALE_STEP = 1.06, YES_SCALE_MAX = 1.6;
  var NO_SCALE_STEP = 0.97, NO_SCALE_MIN = 0.7;  // daha az küçülsün (surrender ~10 kaçış)
  var SPRING = "transform 180ms cubic-bezier(.34,1.56,.64,1), left 180ms cubic-bezier(.34,1.56,.64,1), top 180ms cubic-bezier(.34,1.56,.64,1), opacity 180ms ease";
  var SHINE_MS = 700;
  var WOBBLE_MS = 500;

  // --- Durum ---
  var btnNo = null, btnYes = null, nudge = null;
  var onAcceptCb = null;
  var escapeCount = 0;
  var surrendered = false;
  var reparented = false;       // #btn-no document.body'ye taşındı mı
  var origParent = null;        // orijinal ebeveyn (.btn-row)
  var placeholder = null;       // reset'te aynı konuma geri koymak için
  var lastMouse = { x: -9999, y: -9999 };
  var lastFleeAt = 0;           // son kaçış zaman damgası (cooldown)
  var yesScale = 1, noScale = 1;
  var shineTimer = null, wobbleTimer = null;
  var listening = false;

  function reduced() {
    // CONFIG hazırsa onu kullan; değilse canlı sorgula (defansif)
    if (window.CONFIG && typeof window.CONFIG.reduced === "boolean") return window.CONFIG.reduced;
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }

  function messages() {
    return (window.CONFIG && window.CONFIG.messages) || [];
  }
  function surrenderAt() {
    return (window.CONFIG && typeof window.CONFIG.surrenderAt === "number") ? window.CONFIG.surrenderAt : 5;
  }
  function surrenderText() {
    return (window.CONFIG && window.CONFIG.surrenderText) || "Peki... Evet o zaman :)";
  }

  // --- Yardımcılar ---
  function centerOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, rect: r };
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function vw() { return window.innerWidth || document.documentElement.clientWidth; }
  function vh() { return window.innerHeight || document.documentElement.clientHeight; }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  // İmlecin butonun KENARINA olan mesafesi (buton içindeyse 0). Merkez-yarıçap yerine bunu
  // kullanmak, tetikleme alanını butona sarar; row'un tamamını kapsamaz.
  function edgeDist(px, py) {
    if (!btnNo) return Infinity;
    var r = btnNo.getBoundingClientRect();
    var dx = Math.max(r.left - px, 0, px - r.right);
    var dy = Math.max(r.top - py, 0, py - r.bottom);
    return Math.hypot(dx, dy);
  }

  // #btn-no'yu ilk kaçışta document.body'ye taşı, fixed konumlandırmaya hazırla.
  function ensureReparented() {
    if (reparented || !btnNo) return;
    origParent = btnNo.parentNode;
    // Aynı akış konumunu koruyacak görünmez placeholder
    placeholder = document.createComment("btn-no-placeholder");
    if (origParent) origParent.insertBefore(placeholder, btnNo);

    var r = btnNo.getBoundingClientRect();
    document.body.appendChild(btnNo);
    btnNo.style.position = "fixed";
    btnNo.style.margin = "0";
    btnNo.style.zIndex = "60"; // #stage(4)/#pulse(45)/#fx(50) üstünde, #toast(100) altında
    btnNo.style.left = Math.round(r.left) + "px";
    btnNo.style.top = Math.round(r.top) + "px";
    btnNo.style.transition = reduced() ? "none" : SPRING;
    reparented = true;
  }

  // Fareden uzak, viewport içinde, Evet ile çakışmayan yeni konum bul.
  function pickNewPosition(fromX, fromY) {
    var w = btnNo.offsetWidth || 100;
    var h = btnNo.offsetHeight || 44;
    var maxLeft = Math.max(EDGE_PAD, vw() - w - EDGE_PAD);
    var maxTop = Math.max(EDGE_PAD, vh() - h - EDGE_PAD);
    var yesRect = btnYes ? btnYes.getBoundingClientRect() : null;

    var best = null, bestDist = -1;
    for (var i = 0; i < 24; i++) {
      var left = EDGE_PAD + Math.random() * (maxLeft - EDGE_PAD);
      var top = EDGE_PAD + Math.random() * (maxTop - EDGE_PAD);
      var cx = left + w / 2, cy = top + h / 2;
      var dist = Math.hypot(cx - fromX, cy - fromY);

      // Evet butonu ile çakışma kontrolü
      var overlaps = false;
      if (yesRect) {
        var cand = { left: left, top: top, right: left + w, bottom: top + h };
        overlaps = rectsOverlap(cand, yesRect);
      }
      if (overlaps) continue;

      if (dist >= FLEE_MIN_DIST) {
        return { left: left, top: top }; // yeterince uzak + çakışmasız → hemen dön
      }
      // Değilse en uzak adayı sakla (fallback)
      if (dist > bestDist) { bestDist = dist; best = { left: left, top: top }; }
    }
    // Hiçbir deneme ideal değilse en iyi (en uzak, çakışmasız) adayı kullan
    if (best) return best;
    // Son çare (24 adayın hepsi Evet ile çakıştıysa — pratikte imkansız): Evet'in ters köşesi
    var fLeft = EDGE_PAD, fTop = EDGE_PAD;
    if (yesRect) {
      var yesCx = yesRect.left + yesRect.width / 2;
      var yesCy = yesRect.top + yesRect.height / 2;
      fLeft = (yesCx < vw() / 2) ? maxLeft : EDGE_PAD;
      fTop = (yesCy < vh() / 2) ? maxTop : EDGE_PAD;
    }
    return { left: fLeft, top: fTop };
  }

  function applyScales() {
    if (btnYes) btnYes.style.transform = "scale(" + yesScale.toFixed(3) + ")";
    if (btnNo) {
      // fixed konum inline left/top ile yönetilir; ölçek transform ile
      btnNo.style.transform = "scale(" + noScale.toFixed(3) + ")";
    }
  }

  function showNudge() {
    if (!nudge) return;
    var msgs = messages();
    var idx = Math.min(escapeCount, msgs.length - 1, 11);
    if (idx < 0) idx = 0;
    if (msgs.length) nudge.textContent = msgs[idx];
    if (!reduced()) {
      nudge.classList.remove("wobble");
      // reflow ile animasyonu yeniden tetikle
      void nudge.offsetWidth;
      nudge.classList.add("wobble");
      if (wobbleTimer) clearTimeout(wobbleTimer);
      wobbleTimer = setTimeout(function () {
        if (nudge) nudge.classList.remove("wobble");
      }, WOBBLE_MS);
    }
  }

  function maybeShine() {
    if (!btnYes || reduced()) return;
    if (escapeCount === 3 || escapeCount === 6 || escapeCount === 9) {
      btnYes.classList.remove("shine");
      void btnYes.offsetWidth;
      btnYes.classList.add("shine");
      if (shineTimer) clearTimeout(shineTimer);
      shineTimer = setTimeout(function () {
        if (btnYes) btnYes.classList.remove("shine");
      }, SHINE_MS);
    }
  }

  function enterSurrender() {
    surrendered = true;
    if (btnNo) {
      btnNo.textContent = surrenderText();
      btnNo.setAttribute("aria-label", surrenderText());
      // Sabitlenir: artık kaçmaz. Görünür ve tıklanabilir kalsın.
      btnNo.style.transition = reduced() ? "none" : SPRING;
    }
  }

  // Tek kaçış adımı
  function flee(fromX, fromY) {
    if (surrendered || !btnNo) return;
    lastFleeAt = now();
    ensureReparented();

    var pos = pickNewPosition(fromX, fromY);
    btnNo.style.transition = reduced() ? "none" : SPRING;
    btnNo.style.left = Math.round(pos.left) + "px";
    btnNo.style.top = Math.round(pos.top) + "px";

    escapeCount++;

    // Ölçekler
    yesScale = Math.min(YES_SCALE_MAX, yesScale * YES_SCALE_STEP);
    noScale = Math.max(NO_SCALE_MIN, noScale * NO_SCALE_STEP);
    applyScales();

    // Opaklık hafifçe düşür (okunur kalsın)
    var op = Math.max(0.72, 1 - escapeCount * 0.03);
    btnNo.style.opacity = String(op);

    showNudge();
    maybeShine();

    if (escapeCount >= surrenderAt()) {
      enterSurrender();
    }
  }

  // --- Dinleyiciler ---
  function onPointerMove(e) {
    if (surrendered || !btnNo) return;
    // Sadece fare/pen; touch pointermove'da kaçma (touch pointerdown ele alır)
    if (e.pointerType === "touch") return;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    // Evet'in üstündeyken Hayır kaçmasın — Evet daima rahatça tıklanabilir kalsın.
    if (btnYes && (e.target === btnYes || (btnYes.contains && btnYes.contains(e.target)))) return;
    // Cooldown: çok hızlı ard arda kaçmasın (mesajlar bir anda tükenmesin, buton mouse'tan kaçabilsin).
    if (now() - lastFleeAt < FLEE_COOLDOWN) return;
    // Butonun KENARINA yaklaşınca kaç (row'un tamamını değil).
    if (edgeDist(e.clientX, e.clientY) < TRIGGER_MARGIN) {
      flee(e.clientX, e.clientY);
    }
  }

  function onPointerDown(e) {
    if (!btnNo) return;
    // Mobil/touch: parmak değmeden zıpla, tık tescil olmasın
    if (e.pointerType === "touch") {
      if (surrendered) return; // sabitlendiyse normal tık akışına bırak
      // SADECE Hayır'a (ya da çok yakınına) dokunulunca kaç.
      // Aksi halde ekranın başka yerine (örn. Evet'e) yapılan dokunuşu preventDefault ile bloklamayalım.
      var onNo = (e.target === btnNo) || (btnNo.contains && btnNo.contains(e.target));
      var near = edgeDist(e.clientX || 0, e.clientY || 0) < TRIGGER_MARGIN;
      if (!onNo && !near) return;
      // preventDefault → tık/synthetic click tescil olmaz (buton her koşulda yakalanmasın)
      if (typeof e.preventDefault === "function") e.preventDefault();
      // Cooldown içindeyse tık yine bloklanır ama tekrar kaçış saymayalım.
      if (now() - lastFleeAt < FLEE_COOLDOWN) return;
      flee(e.clientX, e.clientY);
    }
  }

  // Klavye erişilebilirliği: Hayır'a klavye ile odaklanılırsa ekranda ZIPLATMA (yönelim bozucu / WCAG 2.4.7).
  // Onun yerine doğrudan teslim ol → klavye kullanıcısına net, kilitlenmeyen bir kabul yolu ver.
  // (Fare kullanıcısı zaten hover'da kaçtığı için Hayır'a fare ile odaklanamaz.)
  function onNoFocus() {
    if (surrendered || !btnNo) return;
    var kb = true; // :focus-visible desteklenmiyorsa klavye varsay (güvenli/erişilebilir taraf)
    try { if (btnNo.matches) kb = btnNo.matches(":focus-visible"); } catch (e) { kb = true; }
    if (kb) enterSurrender();
  }

  // Sabitlenince tık/Enter ile kabul
  function onNoActivate(e) {
    if (!surrendered) {
      // Sabit değilken tık gerçekleşmemeli; güvenlik için kaçır
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      flee(lastMouse.x, lastMouse.y);
      return;
    }
    if (typeof onAcceptCb === "function") onAcceptCb();
  }

  function onNoKeydown(e) {
    if (!surrendered) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (typeof onAcceptCb === "function") onAcceptCb();
    }
  }

  function addListeners() {
    if (listening) return;
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: false });
    if (btnNo) {
      btnNo.addEventListener("focus", onNoFocus);
      btnNo.addEventListener("click", onNoActivate);
      btnNo.addEventListener("keydown", onNoKeydown);
    }
    listening = true;
  }

  function removeListeners() {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerdown", onPointerDown);
    if (btnNo) {
      btnNo.removeEventListener("focus", onNoFocus);
      btnNo.removeEventListener("click", onNoActivate);
      btnNo.removeEventListener("keydown", onNoKeydown);
    }
    listening = false;
  }

  // --- Public API (PLAN §8) ---
  var Escape = {
    init: function (opts) {
      opts = opts || {};
      onAcceptCb = opts.onAccept || null;

      btnNo = document.getElementById("btn-no");
      btnYes = document.getElementById("btn-yes");
      nudge = document.getElementById("nudge");
      if (!btnNo) return; // defensif: yoksa sessiz çık

      btnNo.setAttribute("aria-label", "Hayır (yakalayabilirsen)");
      addListeners();
    },

    // Navigasyon sonrası kaçmaya devam etmesin: dinleyicileri kaldır + gizle.
    disable: function () {
      removeListeners();
      if (btnNo) {
        btnNo.style.pointerEvents = "none";
        btnNo.style.opacity = "0";
        btnNo.style.visibility = "hidden";
      }
    },

    // Baştan al: orijinal ebeveyne geri koy, tüm inline stilleri temizle.
    reset: function () {
      if (shineTimer) { clearTimeout(shineTimer); shineTimer = null; }
      if (wobbleTimer) { clearTimeout(wobbleTimer); wobbleTimer = null; }

      // Orijinal ebeveynine geri koy
      if (btnNo && reparented && origParent) {
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.insertBefore(btnNo, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        } else {
          origParent.appendChild(btnNo);
        }
      }
      reparented = false;
      origParent = null;
      placeholder = null;

      // Inline stilleri temizle
      if (btnNo) {
        btnNo.style.position = "";
        btnNo.style.left = "";
        btnNo.style.top = "";
        btnNo.style.transform = "";
        btnNo.style.opacity = "";
        btnNo.style.transition = "";
        btnNo.style.margin = "";
        btnNo.style.zIndex = "";
        btnNo.style.pointerEvents = "";
        btnNo.style.visibility = "";
        btnNo.textContent = "Hayır";
        btnNo.setAttribute("aria-label", "Hayır (yakalayabilirsen)");
        btnNo.classList.remove("shine");
      }
      if (btnYes) {
        btnYes.style.transform = "";
        btnYes.classList.remove("shine");
      }
      if (nudge) {
        nudge.textContent = "";
        nudge.classList.remove("wobble");
      }

      escapeCount = 0;
      surrendered = false;
      yesScale = 1;
      noScale = 1;
      lastFleeAt = 0;
      lastMouse.x = -9999;
      lastMouse.y = -9999;

      // Dinleyicileri yeniden ekle (init tekrar çağrılmadan)
      addListeners();
    }
  };

  window.Escape = Escape;
})();
