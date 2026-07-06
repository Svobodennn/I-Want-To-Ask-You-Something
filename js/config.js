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
    "Bu buton çok utangaç 🙈",
    "Tamam pes etme bende 😤",
    "Kim daha inatçı göreceğiz...",
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

  /* ---------------------------------------------------------------------------
     CANLI BİLDİRİM — randevu oluşunca (özet ekranı) sana haber uçar.
     Sırlar (ntfy topic + Web3Forms key) BU DOSYADA DEĞİL — Vercel ortam
     değişkenlerinde durur (NTFY_TOPIC, WEB3FORMS_KEY) ve yalnız api/notify.js
     (serverless) okur. Tarayıcı sadece kendi domain'ine (/api/notify) POST atar.
     --------------------------------------------------------------------------- */
  var NOTIFY = {
    toName: ""                               // koda isim yazma; ?to= parametresinden gelir
  };

  window.CONFIG = {
    messages: messages,
    // Tüm nudge mesajları gösterildikten sonra teslim ol (mesaj sayısına otomatik bağlı).
    surrenderAt: messages.length - 1,
    surrenderText: "Peki... Evet o zaman :)",
    reduced: reduced,
    share: share,
    notify: NOTIFY
  };
})();
