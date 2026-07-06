/* api/notify.js — Vercel Serverless Function: canlı bildirim köprüsü.
   Sırlar (NTFY_TOPIC, WEB3FORMS_KEY) Vercel ortam değişkenlerinde yaşar;
   tarayıcıya asla inmez. Site same-origin /api/notify'a POST atar, burası iletir.
   Bağımlılık yok — Node 18+ global fetch/FormData yeterli. */

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  var topic = process.env.NTFY_TOPIC || "";
  var w3fKey = process.env.WEB3FORMS_KEY || "";

  // Girdiye güvenme: tek satıra indir, kırp, 60 karakterle sınırla
  var b = (req.body && typeof req.body === "object") ? req.body : {};
  function s(v) {
    return String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, 60);
  }

  var who = s(b.toName);
  var title = "💌 Randevu oluştu!";
  var detail = (who ? who + " " : "") + "randevuyu onayladı 🎉\n" +
    "📅 " + (s(b.day) || "-") + "\n" +
    "🍽️ " + (s(b.food) || "-") + "\n" +
    "🥂 " + (s(b.drink) || "-");

  var jobs = [];

  // 1) ntfy.sh → anında telefon push
  if (topic) {
    jobs.push(fetch("https://ntfy.sh/" + encodeURIComponent(topic), {
      method: "POST",
      body: title + "\n" + detail
    }));
  }

  // 2) Web3Forms → e-posta
  if (w3fKey) {
    var fd = new FormData();
    fd.append("access_key", w3fKey);
    fd.append("subject", title);
    fd.append("from_name", "Randevu Sitesi 💌");
    fd.append("message", detail + "\n\nSeninle, çok yakında ♡");
    jobs.push(fetch("https://api.web3forms.com/submit", { method: "POST", body: fd }));
  }

  await Promise.allSettled(jobs);
  res.status(200).json({ ok: true });
};
