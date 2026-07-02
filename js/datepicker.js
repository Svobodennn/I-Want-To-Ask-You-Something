/* datepicker.js — window.DatePicker: tema uyumlu, erişilebilir inline takvim bileşeni.
   Native date input yerine güzel bir ay-ızgarası. Kütüphane YOK, TR locale, Pazartesi-başlangıç.
   SRP: tarih seçimi UI bileşeni. DatePicker.create(container, {minISO, onSelect}) → { reset }. */
(function () {
  "use strict";

  var MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var WD = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]; // Pazartesi-başlangıç

  function pad(n) { return String(n).padStart(2, "0"); }
  function iso(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function navBtn(txt, cls, label) {
    var b = document.createElement("button");
    b.type = "button"; b.className = cls; b.textContent = txt;
    b.setAttribute("aria-label", label);
    return b;
  }

  function create(container, opts) {
    opts = opts || {};
    var onSelect = opts.onSelect || function () {};
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var min = null;
    if (opts.minISO) { var mp = opts.minISO.split("-"); min = new Date(+mp[0], +mp[1] - 1, +mp[2]); min.setHours(0, 0, 0, 0); }

    var view = { y: today.getFullYear(), m: today.getMonth() };
    var selISO = null;

    // --- DOM iskeleti ---
    container.classList.add("cal");
    container.innerHTML = "";
    var head = el("div", "cal-head");
    var prev = navBtn("‹", "cal-nav", "Önceki ay");
    var title = el("div", "cal-title"); title.setAttribute("aria-live", "polite");
    var next = navBtn("›", "cal-nav", "Sonraki ay");
    head.append(prev, title, next);

    var wd = el("div", "cal-wd");
    WD.forEach(function (w) { var s = el("div", "cal-wd-c"); s.textContent = w; wd.append(s); });

    var grid = el("div", "cal-grid");
    grid.setAttribute("role", "grid");
    container.append(head, wd, grid);

    var todayISO = iso(today.getFullYear(), today.getMonth(), today.getDate());

    function beforeMin(date) { return min && date < min; }

    function render() {
      title.textContent = MONTHS[view.m] + " " + view.y;
      // Geçmiş aya gitmeyi engelle (min ayındaysak)
      prev.disabled = !!(min && (view.y < min.getFullYear() ||
        (view.y === min.getFullYear() && view.m <= min.getMonth())));

      grid.innerHTML = "";
      var startDow = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Pazartesi-başlangıç ofseti
      var days = new Date(view.y, view.m + 1, 0).getDate();
      var i;
      for (i = 0; i < startDow; i++) grid.append(el("div", "cal-day empty"));

      for (var d = 1; d <= days; d++) {
        var cIso = iso(view.y, view.m, d);
        var cDate = new Date(view.y, view.m, d);
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cal-day";
        cell.textContent = d;
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", cDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }));
        if (beforeMin(cDate)) { cell.disabled = true; cell.classList.add("disabled"); }
        if (cIso === todayISO) cell.classList.add("today");
        if (cIso === selISO) { cell.classList.add("sel"); cell.setAttribute("aria-selected", "true"); }
        cell.tabIndex = (cIso === (selISO || todayISO)) ? 0 : -1;
        (function (isoStr, dateObj) {
          cell.addEventListener("click", function () { pick(isoStr, dateObj); });
        })(cIso, cDate);
        grid.append(cell);
      }
    }

    function pick(isoStr, dateObj) {
      selISO = isoStr;
      if (window.Sound) Sound.play("pop");
      render();
      onSelect(isoStr, dateObj.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }));
    }

    // Klavye: ok tuşları ile günler arası gezinme (roving focus)
    grid.addEventListener("keydown", function (e) {
      var cells = Array.prototype.slice.call(grid.querySelectorAll(".cal-day:not(.empty)"));
      var idx = cells.indexOf(document.activeElement);
      if (idx < 0) return;
      var delta = 0;
      if (e.key === "ArrowRight") delta = 1;
      else if (e.key === "ArrowLeft") delta = -1;
      else if (e.key === "ArrowDown") delta = 7;
      else if (e.key === "ArrowUp") delta = -7;
      else return;
      e.preventDefault();
      var t = idx + delta;
      while (t >= 0 && t < cells.length && cells[t].disabled) t += (delta > 0 ? 1 : -1);
      if (t >= 0 && t < cells.length && !cells[t].disabled) {
        cells[idx].tabIndex = -1; cells[t].tabIndex = 0; cells[t].focus();
      }
    });

    prev.addEventListener("click", function () { if (view.m === 0) { view.m = 11; view.y--; } else view.m--; render(); });
    next.addEventListener("click", function () { if (view.m === 11) { view.m = 0; view.y++; } else view.m++; render(); });

    render();

    return {
      reset: function () {
        selISO = null;
        view.y = today.getFullYear(); view.m = today.getMonth();
        render();
      }
    };
  }

  window.DatePicker = { create: create };
})();
