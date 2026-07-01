/* config.js — window.CONFIG (classic script, no import/export)
   Tek doğruluk kaynağı: PLAN.md §5 & §8. Diğer modüller bu global ile konuşur. */
(function () {
  "use strict";

  // §5 — Kaçan "Hayır" mesajları (12, BİREBİR sırayla)
  var messages = [
    "Hayır",
    "Emin misin? 🥺",
    "Cidden mi ya 😭",
    "Bir daha düşün 👀",
    "Yakalayamazsın 😌",
    "Kalbim kırılıyor 💔",
    "Bu buton çok utangaç 🙈",
    "Tamam pes etme bende 😤",
    "Kaçmak olimpik olsa altın benim 🥇",
    "Evet'e bir şans versene 🥹",
    "Fareni yorma, olmayacak 🐭",
    "Son teklif: EVEEET de 💍"
  ];

  // prefers-reduced-motion (matchMedia yoksa güvenli varsayılan: false)
  var reduced = (typeof window.matchMedia === "function") &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // §8 — paylaş metni şablonu (satır sonları \n)
  function share(state) {
    state = state || {};
    return "It is a date! 💌\n" +
      "Tarih: " + state.day + " · Mutfak: " + state.food + " · İçecek: " + state.drink + "\n" +
      "Seninle, çok yakında ♡";
  }

  window.CONFIG = {
    messages: messages,
    surrenderAt: 5,
    surrenderText: "Peki... Evet o zaman :)",
    reduced: reduced,
    share: share
  };
})();
