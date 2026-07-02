# Sana Bişi Sorucam 💌 — "Altın Saat"

Romantik, sinematik, tek-sayfa bir "benimle date'e çıkar mısın?" deneyimi. Koyu golden-hour teması, uçuşan kalpler, kaçan "Hayır" butonu, kutlama ve "It is a date!" bilet kartı. **Framework yok, bağımlılık yok, build yok** — saf HTML/CSS/vanilla JS, offline çalışır.

**🔗 Canlı:** https://sana-bisi-sorucam.vercel.app

## Akış (5 ekran)

1. **Soru** — "Benimle date'e çıkar mısın?" · Evet / Hayır (Hayır kaçar, sonunda teslim olur)
2. **Kutlama** — konfeti + emoji patlaması
3. **Tarih** — özel tasarım takvim (native picker değil)
4. **Yemek & İçecek** — mutfak + içecek tercihi
5. **Özet** — "It is a date!" bilet kartı + geri sayım + indir/paylaş

## Özellikler

- 🗓️ **Özel tema takvim** — ay navigasyonu, TR/Pazartesi-başlangıç, geçmiş günler kapalı, klavye gezinme
- 💌 **Kişiselleştirme** — `?to=İsim` ile başlık ve bildirim ismi değişir; sekme başlığı da dinamik
- 🔗 **"Kendi davetini oluştur"** — isim gir → paylaşılabilir `?to=` linki üretir
- 📅 **Takvime Ekle** — `.ics` indirme + Google Calendar linki
- 🎟️ **Bilet** — özet kartını PNG olarak **indir** veya **paylaş** (Web Share API, mobil)
- 📲 **PWA** — "ana ekrana ekle", offline çalışır
- 🔊 **Ses efektleri** — varsayılan açık (sağ üstten kapatılır), WebAudio ile sentezlenmiş
- 💗 **Tap-to-heart** — ekrana her dokunuşta kalp uçar
- ⏳ **Geri sayım** — özette "Randevuya X gün ✨"
- 🔔 **Canlı bildirim** — biri tamamlayınca sana anında **ntfy push + e-posta** (bkz. aşağı)
- ♿ Erişilebilir (klavye, ARIA, `prefers-reduced-motion`) · mobil uyumlu

## Çalıştırma (local)

Kurulum gerekmez — `index.html`'e **çift tıkla**, tarayıcıda açılır (offline).

Ya da basit bir sunucuyla (PWA/bildirim gibi bazı özellikler `file://` yerine `http` ister):
```bash
python3 -m http.server 8000        # → http://localhost:8000
```

## Canlı bildirim kurulumu

Backend yok — özet ekranına ulaşılınca tarayıcı doğrudan servislere gönderir. `js/config.js` içindeki `CONFIG.notify`:

- **ntfy.sh (telefon push):** [ntfy](https://ntfy.sh) uygulamasını kur, `ntfyTopic`'e abone ol.
- **Web3Forms (e-posta):** [web3forms.com](https://web3forms.com)'dan ücretsiz access key al, `web3formsKey`'e yapıştır. (FormData ile gönderilir — CORS preflight'a takılmaz.)

Boş bırakılan kanal atlanır. Bildirim mesajı seçilen tarih/mutfak/içeceği içerir.

## Yayınlama

Statik site — herhangi bir statik host'a konur. Vercel'de production branch `master`'a bağlıdır:
```bash
npx vercel --prod            # ya da GitHub repo'yu Vercel'e bağla (master → prod)
```
Not: `index.html`'deki `og:image` mutlak URL'i deploy domain'ine göre ayarlanmalı (sosyal önizleme için).

## Yapı (katmanlı, SRP)

```
index.html · css/styles.css · manifest.webmanifest · sw.js
assets/           # og.png (1200x630) + icon-192/512.png
js/
  config.js                       # sabitler, mesajlar, bildirim ayarları
  state.js                        # AppState — tek state kaynağı
  dom.js · toast.js · screens.js · radiogroup.js · datepicker.js · personalize.js   # temeller/UI
  ambient.js · celebrate.js · escape.js                                            # efektler
  calendar.js · ticket.js · notify.js · sound.js · pwa.js                          # servisler
  date-screen.js · food-screen.js · summary-screen.js                              # ekran controller'ları
  builder.js · tap-hearts.js                                                       # ekstralar
  app.js                          # kompozisyon kökü (modülleri bağlar)
```

Modüller `window` namespace + `Screens.onEnter` hook'ları ile gevşek bağlıdır; bağımlılık yönü tek taraflı (controller → servis/temel). JS'ler classic script (ES module değil) — `file://` uyumu için.

## Teknik notlar

- Bağımlılık/CDN/build **yok**; iki `<canvas>` (ambient + kutlama), WebAudio, SVG grain data-URI.
- Offline (`file://` çift-tık), PWA offline shell (service worker cache-first).
- `prefers-reduced-motion` her katmanda; XSS'e karşı değerler `textContent` ile yazılır.
- Playwright ile doğrulanır (akış · mobil · bildirim/PWA).

`PLAN.md` — tasarım & teknik sözleşme (tek doğruluk kaynağı).
