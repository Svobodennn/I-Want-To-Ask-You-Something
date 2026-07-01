/* state.js — window.AppState: uygulama durumunun TEK kaynağı.
   SRP: yalnızca randevu seçimlerinin state'i (day/food/drink) + sıfırlama. */
(function () {
  "use strict";

  var AppState = {
    day: null,
    food: null,
    drink: null,
    reset: function () {
      this.day = null;
      this.food = null;
      this.drink = null;
    }
  };

  window.AppState = AppState;
})();
