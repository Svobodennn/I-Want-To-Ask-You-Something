/* toast.js — window.Toast: tek, yeniden kullanılan toast bileşeni.
   SRP: alt-orta bilgi şeridi (aria-live=polite, ~2.2s auto-dismiss). */
(function () {
  "use strict";

  var timer = null;

  function show(msg) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      toast.classList.remove("show");
      timer = null;
    }, 2200);
  }

  window.Toast = { show: show };
})();
