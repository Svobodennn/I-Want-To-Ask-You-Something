/* calendar.js — window.CalInvite: seçilen tarihten .ics ve Google Calendar linki üretir.
   Classic script, import/export YOK. Randevu = seçilen günde 19:00–22:00 (akşam yemeği). */
(function () {
  "use strict";

  function pad(n) { return String(n).padStart(2, "0"); }

  // dateISO "YYYY-MM-DD" + saat → "YYYYMMDDTHHMMSS" (floating local time)
  function stamp(dateISO, hour) {
    return dateISO.replace(/-/g, "") + "T" + pad(hour) + "0000";
  }

  // iCalendar metin kaçışı
  function esc(s) {
    return String(s == null ? "" : s).replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
  }

  function times(evt) {
    var sh = evt.startHour != null ? evt.startHour : 19;
    var dur = evt.durationH != null ? evt.durationH : 3;
    return { start: stamp(evt.dateISO, sh), end: stamp(evt.dateISO, sh + dur) };
  }

  // .ics içeriğini data: URL olarak döndür (indirilebilir)
  function ics(evt) {
    if (!evt || !evt.dateISO) return "";
    var t = times(evt);
    var body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Altin Saat//Randevu//TR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:randevu-" + evt.dateISO + "@date-creator",
      "DTSTART:" + t.start,
      "DTEND:" + t.end,
      "SUMMARY:" + esc(evt.title || "Randevu 💌"),
      "DESCRIPTION:" + esc(evt.description || ""),
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
  }

  // Google Calendar "template" linki
  function gcalUrl(evt) {
    if (!evt || !evt.dateISO) return "#";
    var t = times(evt);
    var params = [
      "action=TEMPLATE",
      "text=" + encodeURIComponent(evt.title || "Randevu 💌"),
      "dates=" + t.start + "/" + t.end,
      "details=" + encodeURIComponent(evt.description || "")
    ].join("&");
    return "https://calendar.google.com/calendar/render?" + params;
  }

  window.CalInvite = { ics: ics, gcalUrl: gcalUrl };
})();
