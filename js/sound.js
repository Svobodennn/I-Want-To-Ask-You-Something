/* sound.js — window.Sound: opsiyonel ses efektleri (WebAudio ile sentezlenmiş, dosya YOK).
   Varsayılan KAPALI (davetsiz ses olmaz); kullanıcı toggle ile açar. localStorage'da saklanır.
   SRP: ses. Diğer modüller guarded `if (window.Sound) Sound.play('...')` ile çağırır (gevşek bağlı). */
(function () {
  "use strict";

  var KEY = "date-sound";
  var on = false;
  var ac = null;      // AudioContext (kullanıcı jesti sonrası oluşturulur — autoplay politikası)
  var toggleEl = null;

  function ctx() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch (e) { ac = null; }
    return ac;
  }

  function tone(freq, start, dur, type, peak) {
    var a = ctx(); if (!a) return;
    var t0 = a.currentTime + (start || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.14, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function play(name) {
    if (!on) return;
    var a = ctx(); if (!a) return;
    if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    switch (name) {
      case "pop":   tone(620, 0, 0.09, "sine", 0.12); break;
      case "flee":  tone(300, 0, 0.07, "triangle", 0.08); break;
      case "win":   tone(523, 0, 0.12, "sine", 0.13); tone(659, 0.1, 0.12, "sine", 0.13); tone(784, 0.2, 0.22, "sine", 0.14); break;
      case "chime": tone(880, 0, 0.18, "sine", 0.12); tone(1174, 0.06, 0.28, "sine", 0.1); break;
      default: tone(500, 0, 0.08, "sine", 0.1);
    }
  }

  function paint() {
    if (!toggleEl) return;
    toggleEl.textContent = on ? "🔊" : "🔇";
    toggleEl.setAttribute("aria-pressed", on ? "true" : "false");
    toggleEl.setAttribute("aria-label", on ? "Sesi kapat" : "Sesi aç");
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    if (on) { var a = ctx(); if (a && a.state === "suspended") { try { a.resume(); } catch (e) {} } play("pop"); }
    paint();
  }

  function init() {
    try {
      var saved = localStorage.getItem(KEY);
      on = (saved === null) ? true : (saved === "1"); // VARSAYILAN AÇIK (kullanıcı kapatabilir)
    } catch (e) { on = true; }
    toggleEl = document.getElementById("sound-toggle");
    if (toggleEl) toggleEl.addEventListener("click", toggle);
    // İlk kullanıcı jestinde AudioContext'i aç (autoplay politikası) — bir kez
    var unlock = function () {
      var a = ctx();
      if (a && a.state === "suspended") { try { a.resume(); } catch (e) {} }
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    paint();
  }

  window.Sound = { init: init, toggle: toggle, play: play, isOn: function () { return on; } };
})();
