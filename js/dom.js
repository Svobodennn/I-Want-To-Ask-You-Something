/* dom.js — window.DOM: küçük DOM yardımcıları. SRP: DOM erişim util'leri. */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function centerOf(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  window.DOM = { $: $, centerOf: centerOf, todayISO: todayISO };
})();
