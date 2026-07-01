/* food-screen.js — window.FoodScreen: yemek + içecek ekranı denetleyicisi.
   İki bağımsız tek-seçim grubu, ikisi de dolunca "Neredeyse bitti" aktifleşir, grup dolunca ✓.
   SRP: yemek/içecek seçim akışı. Bağımlılıklar: DOM, RadioGroup, AppState, Screens, Toast, Celebrate. */
(function () {
  "use strict";

  var btnNext, foodLabel, drinkLabel;
  var NONALC_DRINK = "Alkolsüz — Limonata 🍋";

  function setNextEnabled(on) {
    if (!btnNext) return;
    if (on) { btnNext.removeAttribute("disabled"); btnNext.classList.add("is-armed"); }
    else { btnNext.setAttribute("disabled", ""); btnNext.classList.remove("is-armed"); }
  }

  function markLabelDone(labelEl) {
    if (!labelEl) return;
    if (labelEl.textContent.indexOf("✓") === -1) {
      labelEl.textContent = labelEl.textContent.replace(/\s*✓\s*$/, "") + " ✓";
    }
  }

  function maybeEnable() {
    setNextEnabled(!!(AppState.food && AppState.drink));
  }

  function onFoodPicked(value) {
    AppState.food = value;
    markLabelDone(foodLabel);
    maybeEnable();
  }

  function onDrinkPicked(value, chip) {
    AppState.drink = value;
    markLabelDone(drinkLabel);
    maybeEnable();

    var isNonAlc = value === NONALC_DRINK || /Limonata/i.test(value || "");
    if (isNonAlc) {
      if (window.Toast) Toast.show("İyi seçim, söz veriyorum eğlenceli olacak");
      if (chip) {
        chip.classList.add("shine");
        window.setTimeout(function () { chip.classList.remove("shine"); }, 900);
      }
      if (window.Celebrate && typeof Celebrate.mini === "function") {
        var c = DOM.centerOf(chip);
        Celebrate.mini(c.x, c.y);
      }
    }
  }

  function init() {
    btnNext = DOM.$("btn-food-next");
    foodLabel = DOM.$("food-label");
    drinkLabel = DOM.$("drink-label");

    if (window.RadioGroup) {
      RadioGroup.setup(DOM.$("food-chips"), onFoodPicked);
      RadioGroup.setup(DOM.$("drink-chips"), onDrinkPicked);
    }
    setNextEnabled(false);

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        if (btnNext.hasAttribute("disabled")) return;
        Screens.show("screen-summary");
      });
    }
  }

  function reset() {
    if (window.RadioGroup) {
      RadioGroup.reset(DOM.$("food-chips"));
      RadioGroup.reset(DOM.$("drink-chips"));
    }
    if (foodLabel) foodLabel.textContent = foodLabel.textContent.replace(/\s*✓\s*$/, "");
    if (drinkLabel) drinkLabel.textContent = drinkLabel.textContent.replace(/\s*✓\s*$/, "");
    setNextEnabled(false);
  }

  window.FoodScreen = { init: init, reset: reset };
})();
