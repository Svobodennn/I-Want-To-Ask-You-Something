/* summary-screen.js — window.SummaryScreen: özet ekranı denetleyicisi.
   Ekrana girince seçimleri doldurur, kalp yağmuru + (bir kez) canlı bildirim tetikler,
   "Bileti İndir" butonunu bağlar. SRP: özet ekranı.
   Bağımlılıklar: DOM, AppState, Screens, Celebrate, Notify, Ticket. */
(function () {
  "use strict";

  var notified = false;

  function render() {
    var sd = DOM.$("sum-date");
    var sf = DOM.$("sum-food");
    var dr = DOM.$("sum-drink");
    if (sd) sd.textContent = AppState.day != null ? AppState.day : "";
    if (sf) sf.textContent = AppState.food != null ? AppState.food : "";
    if (dr) dr.textContent = AppState.drink != null ? AppState.drink : "";
  }

  function buildEvent() {
    return {
      dateISO: AppState.dateISO,
      title: "Randevu 💌",
      description: "Mutfak: " + (AppState.food || "-") + " · İçecek: " + (AppState.drink || "-") + "\nSeninle, çok yakında ♡"
    };
  }

  // Takvime Ekle linklerini (ekrana girince) doldur; tarih yoksa gizle.
  function updateCalendar() {
    var ics = DOM.$("cal-ics"), gcal = DOM.$("cal-gcal");
    if (AppState.dateISO && window.CalInvite) {
      var ev = buildEvent();
      if (ics) { ics.href = CalInvite.ics(ev); ics.removeAttribute("hidden"); }
      if (gcal) { gcal.href = CalInvite.gcalUrl(ev); gcal.removeAttribute("hidden"); }
    } else {
      if (ics) ics.setAttribute("hidden", "");
      if (gcal) gcal.setAttribute("hidden", "");
    }
  }

  function onEnter() {
    render();
    updateCalendar();
    if (window.Celebrate && typeof Celebrate.rain === "function") Celebrate.rain();
    if (!notified) {
      notified = true;
      if (window.Notify && typeof Notify.send === "function") Notify.send();
    }
  }

  function init() {
    Screens.onEnter("screen-summary", onEnter);
    var btnDownload = DOM.$("btn-download");
    if (btnDownload && window.Ticket) btnDownload.addEventListener("click", Ticket.download);
  }

  function reset() {
    notified = false;
  }

  window.SummaryScreen = { init: init, render: render, reset: reset };
})();
