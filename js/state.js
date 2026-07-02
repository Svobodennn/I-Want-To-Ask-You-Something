/* state.js — window.AppState: uygulama durumunun TEK kaynağı.
   SRP: yalnızca randevu seçimlerinin state'i (day/food/drink) + sıfırlama. */
(function () {
  "use strict";

  var AppState = {
    day: null,      // gösterim metni (ör. "Cumartesi, 5 Temmuz")
    dateISO: null,  // takvim daveti için makine tarihi (YYYY-MM-DD)
    food: null,
    drink: null,
    reset: function () {
      this.day = null;
      this.dateISO = null;
      this.food = null;
      this.drink = null;
    }
  };

  window.AppState = AppState;
})();
