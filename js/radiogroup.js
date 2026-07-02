/* radiogroup.js — window.RadioGroup: erişilebilir tek-seçim chip grubu bileşeni.
   Roving tabindex, ok/Home/End tuşları, aria-checked, ink-press animasyonu.
   SRP: yeniden kullanılabilir radiogroup davranışı (tarih/yemek/içecek gruplarınca kullanılır). */
(function () {
  "use strict";

  function setup(groupEl, onPick) {
    if (!groupEl) return;
    var chips = Array.prototype.slice.call(groupEl.querySelectorAll(".chip"));
    if (!chips.length) return;

    function refreshTabindex() {
      var checkedIdx = -1;
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute("aria-checked") === "true") { checkedIdx = i; break; }
      }
      var focusIdx = checkedIdx >= 0 ? checkedIdx : 0;
      for (var j = 0; j < chips.length; j++) chips[j].setAttribute("tabindex", j === focusIdx ? "0" : "-1");
    }

    function select(chip) {
      for (var i = 0; i < chips.length; i++) {
        chips[i].setAttribute("aria-checked", chips[i] === chip ? "true" : "false");
      }
      chip.classList.add("pressed");
      if (window.Sound) Sound.play("pop");
      window.setTimeout(function () { chip.classList.remove("pressed"); }, 420);
      refreshTabindex();
      if (typeof onPick === "function") onPick(chip.dataset.value, chip);
    }

    function focusChip(idx) {
      var i = ((idx % chips.length) + chips.length) % chips.length;
      for (var k = 0; k < chips.length; k++) chips[k].setAttribute("tabindex", k === i ? "0" : "-1");
      chips[i].focus();
    }

    chips.forEach(function (chip, index) {
      if (!chip.hasAttribute("role")) chip.setAttribute("role", "radio");
      if (!chip.hasAttribute("aria-checked")) chip.setAttribute("aria-checked", "false");

      chip.addEventListener("click", function () { select(chip); });
      chip.addEventListener("keydown", function (e) {
        var key = e.key;
        if (key === "ArrowRight" || key === "ArrowDown") { e.preventDefault(); focusChip(index + 1); }
        else if (key === "ArrowLeft" || key === "ArrowUp") { e.preventDefault(); focusChip(index - 1); }
        else if (key === " " || key === "Enter" || key === "Spacebar") { e.preventDefault(); select(chip); }
        else if (key === "Home") { e.preventDefault(); focusChip(0); }
        else if (key === "End") { e.preventDefault(); focusChip(chips.length - 1); }
      });
    });

    refreshTabindex();
  }

  // Grubu sıfırla: tüm seçimleri kaldır, ilk chip'i tabbable yap.
  function reset(groupEl) {
    if (!groupEl) return;
    var chips = groupEl.querySelectorAll(".chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute("aria-checked", "false");
      chips[i].setAttribute("tabindex", i === 0 ? "0" : "-1");
    }
  }

  window.RadioGroup = { setup: setup, reset: reset };
})();
