/* date-screen.js — window.DateScreen: tarih ekranı denetleyicisi.
   Hızlı chip'ler + (varsa) native tarih girişi, karşılıklı dışlama, "Devam et" aktifleşmesi.
   SRP: tarih seçim akışı. Bağımlılıklar: DOM, RadioGroup, AppState, Screens. */
(function () {
  "use strict";

  var input, stamp, chipsEl, btnNext;

  function pad(n) { return String(n).padStart(2, "0"); }
  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fmt(d, opts) { try { return d.toLocaleDateString("tr-TR", opts); } catch (e) { return isoOf(d); } }

  // Yaklaşan hedef günün (0=Paz..6=Cmt) tarihini döndür (hep gelecekte).
  function nextDow(target) {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var add = (target - d.getDay() + 7) % 7;
    if (add === 0) add = 7;
    d.setDate(d.getDate() + add);
    return d;
  }

  // İki hızlı chip'i gerçek yaklaşan Cumartesi/Pazar tarihleriyle doldur — asla bayat/"yalan" olmasın.
  function fillQuickChips() {
    if (!chipsEl) return;
    var chips = chipsEl.querySelectorAll(".chip");
    if (chips.length < 2) return;
    var setups = [
      { chip: chips[0], prefix: "Bu Cumartesi", emoji: "✨", d: nextDow(6) },
      { chip: chips[1], prefix: "Bu Pazar", emoji: "🌸", d: nextDow(0) }
    ];
    for (var i = 0; i < setups.length; i++) {
      var s = setups[i];
      s.chip.textContent = s.prefix + " · " + fmt(s.d, { day: "numeric", month: "short" }) + " " + s.emoji;
      s.chip.dataset.value = fmt(s.d, { weekday: "long", day: "numeric", month: "long" });
      s.chip.dataset.iso = isoOf(s.d);
    }
  }

  function setNextEnabled(on) {
    if (!btnNext) return;
    if (on) { btnNext.removeAttribute("disabled"); btnNext.classList.add("is-armed"); }
    else { btnNext.setAttribute("disabled", ""); btnNext.classList.remove("is-armed"); }
  }

  // chip seçildi → native input'u temizle (karşılıklı dışlama) + takvim tarihini sakla
  function onPicked(value, chip) {
    if (input) input.value = "";
    if (stamp) { stamp.textContent = ""; stamp.classList.remove("show"); }
    AppState.day = value;
    AppState.dateISO = (chip && chip.dataset && chip.dataset.iso) || null;
    setNextEnabled(true);
  }

  // native input değişti → chip'leri temizle (karşılıklı dışlama) + TR format
  function onInputChange() {
    if (!input) return;
    var v = input.value;
    if (!v) {
      if (stamp) { stamp.textContent = ""; stamp.classList.remove("show"); }
      var anyChip = chipsEl && chipsEl.querySelector('.chip[aria-checked="true"]');
      if (!anyChip) { AppState.day = null; AppState.dateISO = null; setNextEnabled(false); }
      return;
    }
    if (window.RadioGroup) RadioGroup.reset(chipsEl);
    var d = new Date(v + "T00:00:00");
    var pretty = v;
    try {
      pretty = d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
    } catch (err) { pretty = v; }
    if (stamp) { stamp.textContent = pretty; stamp.classList.add("show"); }
    AppState.day = pretty;
    AppState.dateISO = v;
    setNextEnabled(true);
  }

  function init() {
    input = DOM.$("date-input");
    stamp = DOM.$("date-stamp");
    chipsEl = DOM.$("date-chips");
    btnNext = DOM.$("btn-date-next");

    fillQuickChips(); // chip'lere gerçek yaklaşan tarihleri yaz (RadioGroup.setup'tan önce)

    if (input) {
      input.min = DOM.todayISO();
      input.addEventListener("change", onInputChange);
      input.addEventListener("input", onInputChange);
    }
    if (window.RadioGroup) RadioGroup.setup(chipsEl, onPicked);
    setNextEnabled(false);

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        if (btnNext.hasAttribute("disabled")) return;
        Screens.show("screen-food");
      });
    }
  }

  function reset() {
    if (window.RadioGroup) RadioGroup.reset(chipsEl);
    if (input) input.value = "";
    if (stamp) { stamp.textContent = ""; stamp.classList.remove("show"); }
    setNextEnabled(false);
  }

  window.DateScreen = { init: init, reset: reset };
})();
