/* app.js — orchestrator (state machine, ekran nav, chip grupları, tarih, özet, paylaş, restart, init)
   PLAN §8. Classic script, import/export YOK, window namespace ile konuşur.
   Diğer modüller: window.CONFIG, window.Ambient, window.Celebrate, window.Escape (opsiyonel guard'lı). */
(function () {
  "use strict";

  var state = { day: null, food: null, drink: null };

  var toastTimer = null;
  var notified = false;         // randevu bildirimi bir kez gitsin (restart'ta sıfırlanır)

  /* --- yardımcılar --- */

  function $(id) {
    return document.getElementById(id);
  }

  function centerRectOf(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  /* --- ekran navigasyonu --- */

  // hangi ekranda hangi step aktif (● ○ ○). date=0, food=1, summary=2
  var STEP_FOR = {
    "screen-date": 0,
    "screen-food": 1,
    "screen-summary": 2
  };

  function updateSteps(id) {
    var idx = STEP_FOR.hasOwnProperty(id) ? STEP_FOR[id] : -1;
    // Her ekranda kendi .step öğeleri olabilir; tüm .step'leri güncelle.
    var steps = document.querySelectorAll(".step");
    // Steps ekran-ekran gruplandığından, aynı ekrandaki step grubunu sırayla işaretle.
    // Basit ve sağlam yaklaşım: aktif ekranın içindeki .step'leri bul.
    var screen = $(id);
    var localSteps = screen ? screen.querySelectorAll(".step") : [];
    if (localSteps.length) {
      for (var i = 0; i < localSteps.length; i++) {
        if (i === idx) localSteps[i].classList.add("active");
        else localSteps[i].classList.remove("active");
      }
    } else {
      // fallback: global .step listesi
      for (var j = 0; j < steps.length; j++) {
        steps[j].classList.remove("active");
      }
    }
  }

  function showScreen(id, opts) {
    opts = opts || {};
    var back = !!opts.back;

    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
    }
    var target = $(id);
    if (target) target.classList.add("active");

    updateSteps(id);

    // ekran giriş hook'ları
    if (id === "screen-celebrate") {
      if (!back) {
        if (window.Celebrate && typeof Celebrate.fountain === "function") {
          Celebrate.fountain();
        }
        if (window.Ambient && typeof Ambient.intensify === "function") {
          Ambient.intensify(2000);
        }
      }
    } else if (id === "screen-summary") {
      renderSummary();
      if (window.Celebrate && typeof Celebrate.rain === "function") {
        Celebrate.rain();
      }
      if (!notified) { notified = true; sendNotifications(); }
    }
  }

  function goCelebrate() {
    if (window.Escape && typeof Escape.disable === "function") {
      Escape.disable();
    }
    if (window.Celebrate && typeof Celebrate.burst === "function") {
      var c = centerRectOf($("btn-yes"));
      Celebrate.burst(c.x, c.y);
    }
    showScreen("screen-celebrate");
  }

  /* --- radiogroup (chip) --- */

  function setupRadioGroup(groupEl, onPick) {
    if (!groupEl) return;
    var chips = Array.prototype.slice.call(groupEl.querySelectorAll(".chip"));
    if (!chips.length) return;

    // roving tabindex başlangıcı: seçili varsa o, yoksa ilk chip tabbable
    function refreshTabindex() {
      var checkedIdx = -1;
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute("aria-checked") === "true") {
          checkedIdx = i;
          break;
        }
      }
      var focusIdx = checkedIdx >= 0 ? checkedIdx : 0;
      for (var j = 0; j < chips.length; j++) {
        chips[j].setAttribute("tabindex", j === focusIdx ? "0" : "-1");
      }
    }

    function select(chip) {
      for (var i = 0; i < chips.length; i++) {
        chips[i].setAttribute("aria-checked", chips[i] === chip ? "true" : "false");
      }
      // ink-press
      chip.classList.add("pressed");
      window.setTimeout(function () {
        chip.classList.remove("pressed");
      }, 420);
      refreshTabindex();
      if (typeof onPick === "function") onPick(chip.dataset.value, chip);
    }

    function focusChip(idx) {
      var i = ((idx % chips.length) + chips.length) % chips.length;
      for (var k = 0; k < chips.length; k++) {
        chips[k].setAttribute("tabindex", k === i ? "0" : "-1");
      }
      chips[i].focus();
    }

    chips.forEach(function (chip, index) {
      if (!chip.hasAttribute("role")) chip.setAttribute("role", "radio");
      if (!chip.hasAttribute("aria-checked")) chip.setAttribute("aria-checked", "false");

      chip.addEventListener("click", function () {
        select(chip);
      });

      chip.addEventListener("keydown", function (e) {
        var key = e.key;
        if (key === "ArrowRight" || key === "ArrowDown") {
          e.preventDefault();
          focusChip(index + 1);
        } else if (key === "ArrowLeft" || key === "ArrowUp") {
          e.preventDefault();
          focusChip(index - 1);
        } else if (key === " " || key === "Enter" || key === "Spacebar") {
          e.preventDefault();
          select(chip);
        } else if (key === "Home") {
          e.preventDefault();
          focusChip(0);
        } else if (key === "End") {
          e.preventDefault();
          focusChip(chips.length - 1);
        }
      });
    });

    refreshTabindex();
  }

  /* --- Tarih ekranı --- */

  var dateInput, dateStamp, dateChipsEl, btnDateNext;

  function setDateNextEnabled(on) {
    if (!btnDateNext) return;
    if (on) {
      btnDateNext.removeAttribute("disabled");
      btnDateNext.classList.add("is-armed");
    } else {
      btnDateNext.setAttribute("disabled", "");
      btnDateNext.classList.remove("is-armed");
    }
  }

  function clearDateChips() {
    if (!dateChipsEl) return;
    var chips = dateChipsEl.querySelectorAll(".chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute("aria-checked", "false");
    }
    // ilk chip tabbable geri gelsin
    if (chips.length) {
      for (var j = 0; j < chips.length; j++) {
        chips[j].setAttribute("tabindex", j === 0 ? "0" : "-1");
      }
    }
  }

  function onDatePicked(value) {
    // chip seçildi → date input temizle (karşılıklı dışlama)
    if (dateInput) dateInput.value = "";
    if (dateStamp) { dateStamp.textContent = ""; dateStamp.classList.remove("show"); }
    state.day = value;
    setDateNextEnabled(true);
  }

  function onDateInputChange() {
    if (!dateInput) return;
    var v = dateInput.value;
    if (!v) {
      // temizlendi
      if (dateStamp) {
        dateStamp.textContent = "";
        dateStamp.classList.remove("show");
      }
      // hiç seçim yoksa next kapansın (chip de yoksa)
      var anyChip = dateChipsEl && dateChipsEl.querySelector('.chip[aria-checked="true"]');
      if (!anyChip) {
        state.day = null;
        setDateNextEnabled(false);
      }
      return;
    }
    // date input seçildi → chip'leri temizle (karşılıklı dışlama)
    clearDateChips();
    // TR format
    var d = new Date(v + "T00:00:00");
    var pretty = v;
    try {
      pretty = d.toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      });
    } catch (err) {
      pretty = v;
    }
    if (dateStamp) {
      dateStamp.textContent = pretty;
      dateStamp.classList.add("show");
    }
    state.day = pretty;
    setDateNextEnabled(true);
  }

  /* --- Food/Drink ekranı --- */

  var btnFoodNext, foodLabel, drinkLabel;

  function setFoodNextEnabled(on) {
    if (!btnFoodNext) return;
    if (on) {
      btnFoodNext.removeAttribute("disabled");
      btnFoodNext.classList.add("is-armed");
    } else {
      btnFoodNext.setAttribute("disabled", "");
      btnFoodNext.classList.remove("is-armed");
    }
  }

  function markLabelDone(labelEl) {
    if (!labelEl) return;
    if (labelEl.textContent.indexOf("✓") === -1) {
      labelEl.textContent = labelEl.textContent.replace(/\s*✓\s*$/, "") + " ✓";
    }
  }

  function maybeEnableFoodNext() {
    if (state.food && state.drink) setFoodNextEnabled(true);
    else setFoodNextEnabled(false);
  }

  var NONALC_DRINK = "Alkolsüz — Limonata 🍋";

  function onFoodPicked(value) {
    state.food = value;
    markLabelDone(foodLabel);
    maybeEnableFoodNext();
  }

  function onDrinkPicked(value, chip) {
    state.drink = value;
    markLabelDone(drinkLabel);
    maybeEnableFoodNext();

    // alkolsüz seçilince: parıltı + toast
    var isNonAlc = value === NONALC_DRINK || /Limonata/i.test(value || "");
    if (isNonAlc) {
      showToast("İyi seçim, söz veriyorum eğlenceli olacak");
      if (chip) {
        chip.classList.add("shine");
        window.setTimeout(function () {
          chip.classList.remove("shine");
        }, 900);
      }
      if (window.Celebrate && typeof Celebrate.mini === "function") {
        var c = centerRectOf(chip);
        Celebrate.mini(c.x, c.y);
      }
    }
  }

  /* --- Özet --- */

  function renderSummary() {
    var sd = $("sum-date");
    var sf = $("sum-food");
    var dr = $("sum-drink");
    if (sd) sd.textContent = state.day != null ? state.day : "";
    if (sf) sf.textContent = state.food != null ? state.food : "";
    if (dr) dr.textContent = state.drink != null ? state.drink : "";
  }

  /* --- Canlı bildirim: randevu oluşunca (özet ekranı) sana haber uçur --- */
  function sendNotifications() {
    var cfg = (window.CONFIG && CONFIG.notify) || {};
    var who = cfg.toName ? (cfg.toName + " ") : "";
    var title = "💌 Randevu oluştu!";
    var detail = who + "randevuyu onayladı 🎉\n" +
      "📅 " + (state.day || "-") + "\n" +
      "🍽️ " + (state.food || "-") + "\n" +
      "🥂 " + (state.drink || "-");

    // 1) ntfy.sh → anında telefon push (basit POST, custom header yok → CORS preflight yok)
    if (cfg.ntfyTopic) {
      try {
        fetch("https://ntfy.sh/" + encodeURIComponent(cfg.ntfyTopic), {
          method: "POST",
          body: title + "\n" + detail
        }).catch(function () {});
      } catch (e) {}
    }

    // 2) Web3Forms → e-posta (access key public-safe; e-posta adresini gizler)
    if (cfg.web3formsKey) {
      try {
        fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            access_key: cfg.web3formsKey,
            subject: title,
            from_name: "Randevu Sitesi 💌",
            message: detail + "\n\nSeninle, çok yakında ♡"
          })
        }).catch(function () {});
      } catch (e) {}
    }
  }

  /* --- Bilet indirme (özet kartını PNG olarak; offline, kütüphane YOK) --- */

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // Metni maxW'ye sığana kadar font boyutunu küçült.
  function fitFont(g, text, maxW, weight, startPx, family) {
    var px = startPx;
    do {
      g.font = weight + " " + px + "px " + family;
      if (g.measureText(text).width <= maxW) break;
      px -= 2;
    } while (px > 14);
    return px;
  }

  function downloadTicket() {
    var W = 1080, H = 1350;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");
    if (!g) { showToast("İndirilemedi, ekran görüntüsü al 😉"); return; }

    var SERIF = 'Georgia, "Times New Roman", serif';
    var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    var cx = W / 2;

    // 1) Golden-hour zemin: koyu plum + iki radial glow + vignette
    g.fillStyle = "#2E1526"; g.fillRect(0, 0, W, H);
    var gl1 = g.createRadialGradient(W * 0.2, H * 0.14, 0, W * 0.2, H * 0.14, W * 0.95);
    gl1.addColorStop(0, "rgba(244,185,166,0.42)"); gl1.addColorStop(0.55, "rgba(244,185,166,0)");
    g.fillStyle = gl1; g.fillRect(0, 0, W, H);
    var gl2 = g.createRadialGradient(W * 0.82, H * 0.9, 0, W * 0.82, H * 0.9, W * 0.95);
    gl2.addColorStop(0, "rgba(201,113,139,0.4)"); gl2.addColorStop(0.55, "rgba(201,113,139,0)");
    g.fillStyle = gl2; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(cx, H * 0.42, H * 0.24, cx, H * 0.5, H * 0.8);
    vg.addColorStop(0, "rgba(46,21,38,0)"); vg.addColorStop(1, "rgba(46,21,38,0.62)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);

    g.textAlign = "center"; g.textBaseline = "middle";

    // 2) Altın mühür + ♡
    var sealY = 216, sealR = 82;
    var sg = g.createRadialGradient(cx - 26, sealY - 26, 8, cx, sealY, sealR);
    sg.addColorStop(0, "#F0C56A"); sg.addColorStop(0.55, "#D9A441"); sg.addColorStop(1, "#A9731F");
    g.beginPath(); g.arc(cx, sealY, sealR, 0, Math.PI * 2); g.fillStyle = sg; g.fill();
    g.fillStyle = "#3a220a"; g.font = "66px " + SERIF; g.fillText("♡", cx, sealY + 4);

    // 3) Başlık
    g.fillStyle = "#FBF3EC";
    var tPx = fitFont(g, "It is a date! 💌", W - 140, "700", 96, SERIF);
    g.font = "700 " + tPx + "px " + SERIF;
    g.fillText("It is a date! 💌", cx, 392);

    // 4) Alt başlık
    g.fillStyle = "rgba(251,243,236,0.82)";
    g.font = "40px " + SANS;
    g.fillText("Randevumuz Hazır ✨", cx, 476);

    // 5) Satırlar (label sol · değer sağ)
    var rows = [
      { label: "📅  TARİH", value: state.day || "—" },
      { label: "🍽️  MUTFAK", value: state.food || "—" },
      { label: "🥂  İÇECEK", value: state.drink || "—" }
    ];
    var rowW = 880, rowH = 130, rowX = (W - rowW) / 2, gap = 30, startY = 566;
    for (var i = 0; i < rows.length; i++) {
      var ry = startY + i * (rowH + gap);
      roundRect(g, rowX, ry, rowW, rowH, 26);
      g.fillStyle = "rgba(251,243,236,0.06)"; g.fill();
      g.lineWidth = 2; g.strokeStyle = "rgba(251,243,236,0.16)"; g.stroke();
      g.textAlign = "left"; g.textBaseline = "middle";
      g.fillStyle = "#B9A0A8"; g.font = "600 34px " + SANS;
      g.fillText(rows[i].label, rowX + 42, ry + rowH / 2);
      g.textAlign = "right"; g.fillStyle = "#FBF3EC";
      var vPx = fitFont(g, rows[i].value, rowW - 300, "600", 42, SANS);
      g.font = "600 " + vPx + "px " + SANS;
      g.fillText(rows[i].value, rowX + rowW - 42, ry + rowH / 2);
    }

    // 6) İmza + 7) footer
    g.textAlign = "center"; g.fillStyle = "rgba(233,190,180,0.95)";
    g.font = "italic 46px " + SERIF;
    g.fillText("Seninle, çok yakında ♡", cx, startY + 3 * (rowH + gap) + 46);
    g.fillStyle = "rgba(185,160,168,0.72)"; g.font = "28px " + SANS;
    g.fillText("· bu senin biletin ·", cx, H - 66);

    // 8) PNG olarak indir
    try {
      var a = document.createElement("a");
      a.download = "randevu-bileti.png";
      a.href = cv.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Biletin indirildi ♡");
      if (window.Celebrate && typeof Celebrate.mini === "function") Celebrate.mini();
    } catch (err) {
      showToast("İndirilemedi, ekran görüntüsü al 😉");
    }
  }

  /* --- Restart --- */

  function resetAllChips() {
    var chips = document.querySelectorAll(".chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute("aria-checked", "false");
    }
    // her grupta ilk chip tabbable
    var groups = document.querySelectorAll('[role="radiogroup"]');
    for (var g = 0; g < groups.length; g++) {
      var gc = groups[g].querySelectorAll(".chip");
      for (var k = 0; k < gc.length; k++) {
        gc[k].setAttribute("tabindex", k === 0 ? "0" : "-1");
      }
    }
  }

  function resetLabels() {
    if (foodLabel) foodLabel.textContent = foodLabel.textContent.replace(/\s*✓\s*$/, "");
    if (drinkLabel) drinkLabel.textContent = drinkLabel.textContent.replace(/\s*✓\s*$/, "");
  }

  function doRestart() {
    state.day = null;
    state.food = null;
    state.drink = null;
    notified = false;

    resetAllChips();
    resetLabels();

    if (dateInput) dateInput.value = "";
    if (dateStamp) {
      dateStamp.textContent = "";
      dateStamp.classList.remove("show");
    }

    setDateNextEnabled(false);
    setFoodNextEnabled(false);

    if (window.Escape && typeof Escape.reset === "function") {
      Escape.reset();
    }

    showScreen("screen-ask");
  }

  /* --- Toast --- */

  function showToast(msg) {
    var toast = $("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
      toastTimer = null;
    }, 2200);
  }

  /* --- Wiring --- */

  function wireBackButtons() {
    var backs = document.querySelectorAll("[data-back]");
    for (var i = 0; i < backs.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var dest = btn.getAttribute("data-back");
          if (dest) showScreen(dest, { back: true });
        });
      })(backs[i]);
    }
  }

  function init() {
    // referanslar
    dateInput = $("date-input");
    dateStamp = $("date-stamp");
    dateChipsEl = $("date-chips");
    btnDateNext = $("btn-date-next");
    btnFoodNext = $("btn-food-next");
    foodLabel = $("food-label");
    drinkLabel = $("drink-label");

    // Ambient başlat
    if (window.Ambient && typeof Ambient.start === "function") {
      Ambient.start();
    }

    // Escape mekaniği
    if (window.Escape && typeof Escape.init === "function") {
      Escape.init({ onAccept: goCelebrate });
    }

    // Evet butonu
    var btnYes = $("btn-yes");
    if (btnYes) {
      btnYes.addEventListener("click", goCelebrate);
    }

    // Planı yapalım → tarih ekranı
    var btnPlan = $("btn-plan");
    if (btnPlan) {
      btnPlan.addEventListener("click", function () {
        showScreen("screen-date");
      });
    }

    // Tarih: min bugün + karşılıklı dışlama
    if (dateInput) {
      dateInput.min = todayISO();
      dateInput.addEventListener("change", onDateInputChange);
      dateInput.addEventListener("input", onDateInputChange);
    }
    setupRadioGroup(dateChipsEl, onDatePicked);

    // Food / Drink iki bağımsız grup
    setupRadioGroup($("food-chips"), onFoodPicked);
    setupRadioGroup($("drink-chips"), onDrinkPicked);

    // Next butonları başlangıçta pasif
    setDateNextEnabled(false);
    setFoodNextEnabled(false);

    var btnDateNextEl = btnDateNext;
    if (btnDateNextEl) {
      btnDateNextEl.addEventListener("click", function () {
        if (btnDateNextEl.hasAttribute("disabled")) return;
        showScreen("screen-food");
      });
    }
    if (btnFoodNext) {
      btnFoodNext.addEventListener("click", function () {
        if (btnFoodNext.hasAttribute("disabled")) return;
        showScreen("screen-summary");
      });
    }

    // Paylaş / Baştan Al
    var btnDownload = $("btn-download");
    if (btnDownload) btnDownload.addEventListener("click", downloadTicket);
    var btnRestart = $("btn-restart");
    if (btnRestart) btnRestart.addEventListener("click", doRestart);

    // Easter egg: kutlama başlığına tık → mini patlama
    var celebrateTitle = $("celebrate-title");
    if (celebrateTitle) {
      celebrateTitle.addEventListener("click", function () {
        if (window.Celebrate && typeof Celebrate.mini === "function") {
          var c = centerRectOf(celebrateTitle);
          Celebrate.mini(c.x, c.y);
        }
      });
    }

    // Back butonları
    wireBackButtons();

    // Başlangıç ekranı
    showScreen("screen-ask");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // global namespace (debug/entegrasyon için)
  window.App = {
    showScreen: showScreen,
    goCelebrate: goCelebrate,
    renderSummary: renderSummary,
    showToast: showToast,
    state: state
  };
})();
