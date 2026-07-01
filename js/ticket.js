/* ticket.js — window.Ticket: özet kartını canvas'a çizip PNG olarak indirir.
   Offline, kütüphane YOK. SRP: bilet görseli üretimi + indirme.
   Bağımlılıklar: window.AppState (değerler), window.Toast (bildirim), window.Celebrate (mini burst). */
(function () {
  "use strict";

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // Metni maxW'ye sığana kadar font boyutunu küçült.
  function fitFont(g, text, maxW, weight, startPx, family) {
    var px = startPx;
    do {
      g.font = weight + " " + px + "px " + family;
      if (g.measureText(text).width <= maxW) break;
      px -= 2;
    } while (px > 14);
    return px;
  }

  function toast(msg) { if (window.Toast) Toast.show(msg); }

  function download() {
    var state = window.AppState || {};
    var W = 1080, H = 1350;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");
    if (!g) { toast("İndirilemedi, ekran görüntüsü al 😉"); return; }

    var SERIF = 'Georgia, "Times New Roman", serif';
    var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    var cx = W / 2;

    // 1) Golden-hour zemin: koyu plum + iki radial glow + vignette
    g.fillStyle = "#2E1526"; g.fillRect(0, 0, W, H);
    var gl1 = g.createRadialGradient(W * 0.2, H * 0.14, 0, W * 0.2, H * 0.14, W * 0.95);
    gl1.addColorStop(0, "rgba(244,185,166,0.42)"); gl1.addColorStop(0.55, "rgba(244,185,166,0)");
    g.fillStyle = gl1; g.fillRect(0, 0, W, H);
    var gl2 = g.createRadialGradient(W * 0.82, H * 0.9, 0, W * 0.82, H * 0.9, W * 0.95);
    gl2.addColorStop(0, "rgba(201,113,139,0.4)"); gl2.addColorStop(0.55, "rgba(201,113,139,0)");
    g.fillStyle = gl2; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(cx, H * 0.42, H * 0.24, cx, H * 0.5, H * 0.8);
    vg.addColorStop(0, "rgba(46,21,38,0)"); vg.addColorStop(1, "rgba(46,21,38,0.62)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);

    g.textAlign = "center"; g.textBaseline = "middle";

    // 2) Altın mühür + ♡
    var sealY = 216, sealR = 82;
    var sg = g.createRadialGradient(cx - 26, sealY - 26, 8, cx, sealY, sealR);
    sg.addColorStop(0, "#F0C56A"); sg.addColorStop(0.55, "#D9A441"); sg.addColorStop(1, "#A9731F");
    g.beginPath(); g.arc(cx, sealY, sealR, 0, Math.PI * 2); g.fillStyle = sg; g.fill();
    g.fillStyle = "#3a220a"; g.font = "66px " + SERIF; g.fillText("♡", cx, sealY + 4);

    // 3) Başlık
    g.fillStyle = "#FBF3EC";
    var tPx = fitFont(g, "It is a date! 💌", W - 140, "700", 96, SERIF);
    g.font = "700 " + tPx + "px " + SERIF;
    g.fillText("It is a date! 💌", cx, 392);

    // 4) Alt başlık
    g.fillStyle = "rgba(251,243,236,0.82)";
    g.font = "40px " + SANS;
    g.fillText("Randevumuz Hazır ✨", cx, 476);

    // 5) Satırlar (label sol · değer sağ)
    var rows = [
      { label: "📅  TARİH", value: state.day || "—" },
      { label: "🍽️  MUTFAK", value: state.food || "—" },
      { label: "🥂  İÇECEK", value: state.drink || "—" }
    ];
    var rowW = 880, rowH = 130, rowX = (W - rowW) / 2, gap = 30, startY = 566;
    for (var i = 0; i < rows.length; i++) {
      var ry = startY + i * (rowH + gap);
      roundRect(g, rowX, ry, rowW, rowH, 26);
      g.fillStyle = "rgba(251,243,236,0.06)"; g.fill();
      g.lineWidth = 2; g.strokeStyle = "rgba(251,243,236,0.16)"; g.stroke();
      g.textAlign = "left"; g.textBaseline = "middle";
      g.fillStyle = "#B9A0A8"; g.font = "600 34px " + SANS;
      g.fillText(rows[i].label, rowX + 42, ry + rowH / 2);
      g.textAlign = "right"; g.fillStyle = "#FBF3EC";
      var vPx = fitFont(g, rows[i].value, rowW - 300, "600", 42, SANS);
      g.font = "600 " + vPx + "px " + SANS;
      g.fillText(rows[i].value, rowX + rowW - 42, ry + rowH / 2);
    }

    // 6) İmza + 7) footer
    g.textAlign = "center"; g.fillStyle = "rgba(233,190,180,0.95)";
    g.font = "italic 46px " + SERIF;
    g.fillText("Seninle, çok yakında ♡", cx, startY + 3 * (rowH + gap) + 46);
    g.fillStyle = "rgba(185,160,168,0.72)"; g.font = "28px " + SANS;
    g.fillText("· bu senin biletin ·", cx, H - 66);

    // 8) PNG olarak indir
    try {
      var a = document.createElement("a");
      a.download = "randevu-bileti.png";
      a.href = cv.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("Biletin indirildi ♡");
      if (window.Celebrate && typeof Celebrate.mini === "function") Celebrate.mini();
    } catch (err) {
      toast("İndirilemedi, ekran görüntüsü al 😉");
    }
  }

  window.Ticket = { download: download };
})();
