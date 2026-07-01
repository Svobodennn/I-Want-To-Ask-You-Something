/* screens.js — window.Screens: ekran navigasyonu, adım noktaları ve giriş hook'ları.
   SRP: yalnızca ekran yönlendirme (routing). İş mantığı yok — controller'lar onEnter ile bağlanır. */
(function () {
  "use strict";

  // hangi ekranda hangi adım noktası aktif (● ○ ○)
  var STEP_FOR = { "screen-date": 0, "screen-food": 1, "screen-summary": 2 };
  var enterHooks = {}; // id -> [fn(opts)]

  function updateSteps(id) {
    var idx = STEP_FOR.hasOwnProperty(id) ? STEP_FOR[id] : -1;
    var screen = document.getElementById(id);
    var steps = screen ? screen.querySelectorAll(".step") : [];
    for (var i = 0; i < steps.length; i++) {
      if (i === idx) steps[i].classList.add("active");
      else steps[i].classList.remove("active");
    }
  }

  function show(id, opts) {
    opts = opts || {};
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove("active");
    var target = document.getElementById(id);
    if (target) target.classList.add("active");
    updateSteps(id);
    var hooks = enterHooks[id] || [];
    for (var h = 0; h < hooks.length; h++) hooks[h](opts);
  }

  // Bir ekrana girince çalışacak callback kaydet (controller'lar kullanır).
  function onEnter(id, fn) {
    if (!enterHooks[id]) enterHooks[id] = [];
    enterHooks[id].push(fn);
  }

  // [data-back] butonlarını bağla → geri navigasyon.
  function wireBack() {
    var backs = document.querySelectorAll("[data-back]");
    for (var i = 0; i < backs.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var dest = btn.getAttribute("data-back");
          if (dest) show(dest, { back: true });
        });
      })(backs[i]);
    }
  }

  window.Screens = { show: show, onEnter: onEnter, wireBack: wireBack };
})();
