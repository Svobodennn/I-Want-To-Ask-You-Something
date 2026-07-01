/* date-screen.js — window.DateScreen: tarih ekranı denetleyicisi.
   Hızlı chip'ler + (varsa) native tarih girişi, karşılıklı dışlama, "Devam et" aktifleşmesi.
   SRP: tarih seçim akışı. Bağımlılıklar: DOM, RadioGroup, AppState, Screens. */
(function () {
  "use strict";

  var input, stamp, chipsEl, btnNext;

  function setNextEnabled(on) {
    if (!btnNext) return;
    if (on) { btnNext.removeAttribute("disabled"); btnNext.classList.add("is-armed"); }
    else { btnNext.setAttribute("disabled", ""); btnNext.classList.remove("is-armed"); }
  }

  // chip seçildi → native input'u temizle (karşılıklı dışlama)
  function onPicked(value) {
    if (input) input.value = "";
    if (stamp) { stamp.textContent = ""; stamp.classList.remove("show"); }
    AppState.day = value;
    setNextEnabled(true);
  }

  // native input değişti → chip'leri temizle (karşılıklı dışlama) + TR format
  function onInputChange() {
    if (!input) return;
    var v = input.value;
    if (!v) {
      if (stamp) { stamp.textContent = ""; stamp.classList.remove("show"); }
      var anyChip = chipsEl && chipsEl.querySelector('.chip[aria-checked="true"]');
      if (!anyChip) { AppState.day = null; setNextEnabled(false); }
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
    setNextEnabled(true);
  }

  function init() {
    input = DOM.$("date-input");
    stamp = DOM.$("date-stamp");
    chipsEl = DOM.$("date-chips");
    btnNext = DOM.$("btn-date-next");

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
