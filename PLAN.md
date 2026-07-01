# PLAN — "Altın Saat" · Benimle Çıkar mısın? 💌

> Romantik, sinematik, tek-sayfa (SPA hissi) web deneyimi. Referans: `date-quiz--dont-worry-it-is-pass-fail.com`.
> **Bu dosya tek doğruluk kaynağıdır (single source of truth).** Tüm build ajanları bu sözleşmeye uyar.
> Canlı inceleme + 3-yönlü tasarım workflow'u + jüri sentezi sonucu belirlendi. Palet kararı: **KOYU SİNEMATİK**.

---

## 0. Teknik Kısıtlar (ZORUNLU)

- **Framework YOK, build step YOK, CDN/harici istek YOK.** Saf HTML + CSS + vanilla JS.
- **`file://` ile çift-tıkla offline açılır.** → JS dosyaları **classic script** olarak yüklenir (`<script src>`, `type="module"` DEĞİL, body sonunda sırayla), **ES module (`import`/`export`) KULLANMA** (file:// CORS'ta patlar). Modüller `window` üstünde global namespace ile konuşur.
- `index.html`: `<html lang="tr">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">` ZORUNLU. Favicon inline data-URI emoji (💌).
- **Google Fonts / harici font linki YOK.** Sistem-serif fallback stack kullanılır.
- Mobil uyumlu (rem/%, flex-wrap, `100dvh`), retina (`devicePixelRatio`).
- `prefers-reduced-motion: reduce` her katmanda desteklenir.
- Erişilebilir: gerçek `<button>`, `role=radio`/`radiogroup`, `aria-*`, `:focus-visible`, klavye gezinme.
- XSS güvenli: kullanıcı değerleri **`textContent`** ile yazılır (asla `innerHTML`).

---

## 1. Tema & Palet — Koyu Sinematik "Altın Saat"

CSS değişkenleri (`:root`):

| Değişken | Hex | Kullanım |
|---|---|---|
| `--night` | `#2E1526` | En koyu zemin, vignette kenarı |
| `--night-2` | `#3A1A2E` | Zemin gradient üst ucu |
| `--wine` | `#7A2E4A` | Orta ton, ghost hover, gölge |
| `--peach` | `#F4B9A6` | Sıcak glow (golden-hour ışığı) |
| `--rose` | `#C9718B` | Aksan: Hayır butonu, kalp konturu, ikincil |
| `--cream` | `#FBF3EC` | Ana metin (koyu zeminde ~11:1) |
| `--gold` | `#D9A441` | TEK cesur aksan: Evet/primary, shimmer, mühür |
| `--muted` | `#B9A0A8` | Alt metin, uppercase mikro-label, placeholder |
| `--card` | `rgba(251,243,236,0.10)` | Frosted-glass kart zemini |

**Zemin (body, tüm ekranlarda kesintisiz):** koyu plum taban `linear-gradient(160deg,#3A1A2E,#2E1526)` + iki yumuşak radial "glow" katmanı (peach sol-üst, rose sağ-alt) `#ambient` içinde yavaş yüzer (18–26s). Vignette + ~%4 film-grain overlay.

## 2. Tipografi

- **Başlık (serif):** `"Playfair Display","Fraunces","Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif` — yüksek kontrast, `letter-spacing:-0.01em`, `text-wrap:balance`, `line-height:1.1`. Anahtar başlıklarda altın **shimmer sweep**.
- **Gövde/label (sans):** `"Avenir Next","Segoe UI",system-ui,-apple-system,Helvetica,Arial,sans-serif`.
- **İmza:** italik serif.
- Uppercase mikro-label: `letter-spacing:0.14em`. Rakamlarda `font-variant-numeric: tabular-nums`.
- Modular scale (1.25), boyutlar `clamp()` ile responsive.

## 3. Arkaplan Katmanları (z-index)

```
body gradient (taban)          — en arka
#ambient .glow.g1/.g2  z:0     — yüzen peach/rose glow'lar (CSS transform float)
#bg   <canvas>         z:1     — uçuşan kalp/petal/yıldız parçacıkları (ambient.js)
#vignette              z:2     — sinematik kadraj (pointer-events:none)
#grain                 z:3     — film-grain SVG turbulence data-URI, mix-blend:overlay, ~%4 (pointer-events:none)
#stage .screen         z:4     — içerik (ekranlar)
#fx   <canvas>         z:50    — kutlama konfeti/kalp (celebrate.js, pointer-events:none)
#pulse                 z:45    — ışık pulse overlay (pointer-events:none)
#toast                 z:100   — toast (role=status, aria-live)
```

`prefers-reduced-motion`: glow float + particle + grain flicker + shimmer durur; statik kalır.

---

## 4. Ekran Akışı (5 ekran, SPA — `.screen.active` görünür)

Geçiş: `opacity` + hafif `translateY`/`scale` (aktif = `transform:none`). **Not:** `.screen`'in transform'lu atası olmamalı (kaçan buton `position:fixed` viewport'a göre konumlanır).

### Ekran 1 — `#screen-ask` (başlangıçta `.active`)
- Eyebrow: `SANA BİR SORUM VAR`
- Başlık (h1): **Benimle _çıkar mısın?_ 🥺**  (`<em>` = altın italik)
- Alt satır: `Söz veriyorum, çok ama çok güzel bir plan hazırladım.`
- Butonlar: `#btn-yes` **Evet! 💕** (altın primary) · `#btn-no` **Hayır** (rose, kaçan)
- `#nudge`: kaçışta dönen mesaj satırı (başta boş/gizli).

### Ekran 2 — `#screen-celebrate`
- Başlık (`#celebrate-title`): `Bunu duyacağımı biliyordum ♡`
- Alt: `O halde bu resmen bir randevu. Şimdi ayrıntıları birlikte kuralım.`
- Rozet: `✨ İlk adım tamam ✨`
- Mikro-label: `DEVAM ETMEK İÇİN`
- Buton `#btn-plan`: **Planı yapalım →** (~800ms gecikmeli görünür)
- Açılışta OTOMATİK büyük kutlama. Easter egg: başlığa tık → ekstra mini patlama.

### Ekran 3 — `#screen-date`
- Steps (● ○ ○, 1. aktif) · Mikro-label `ADIM 1 / 3`
- Başlık: `Ne zaman buluşalım? 🗓️`
- Alt: `Sana en uygun anı seç, gerisini ben ayarlarım.`
- `#date-chips` (radiogroup): `Bu Cuma Akşamı 🌆` · `Cumartesi ✨` · `Pazar Brunch'ı ☕` · `Sürpriz Olsun 🎁`
- Ayraç: `ya da kendi tarihini seç`
- `<input type="date" id="date-input" min="{bugün}">` (label: `Tarih seç`) + `#date-stamp` postmark (gizli, seçince belirir)
- `.back[data-back="screen-celebrate"]` ← geri · `#btn-date-next` **Devam et →** (seçim olana dek `disabled`)
- Chip ↔ date input **karşılıklı dışlar** (biri seçilince diğeri temizlenir).

### Ekran 4 — `#screen-food`
- Steps (2. aktif) · Mikro-label `ADIM 2 / 3`
- Başlık: `Masada ne olsun? 🍽️`
- Grup 1 label `#food-label`: `MUTFAK` · `#food-chips` (radiogroup): `İtalyan 🍝` · `Suşi 🍣` · `Anadolu Sofrası 🫓` · `Burger 🍔` · `Vejetaryen 🥗` · `Tatlı Ağırlıklı 🍰`
- Grup 2 label `#drink-label`: `İÇECEK` · `#drink-chips` (radiogroup): `Kırmızı Şarap 🍷` · `Şampanya 🥂` · `Kokteyl 🍸` · `Bira 🍺` · `Kahve ☕` · `Alkolsüz — Limonata 🍋`
- Not: `Alkolsüz de bir o kadar havalı, söz 🤍 · İstersen sonra değiştiririz.`
- `.back[data-back="screen-date"]` · `#btn-food-next` **Neredeyse bitti →** (iki grup da seçilene dek `disabled`)
- Alkolsüz seçilince: 🤍 parıltı + toast `İyi seçim, söz veriyorum eğlenceli olacak`.

### Ekran 5 — `#screen-summary`
- `.seal` altın mühür `♡` (basılıyor animasyonu)
- Büyük başlık (`.bigdate`, shimmer): **It is a date! 💌**
- Alt: `Randevumuz Hazır ✨`
- 3 satır (label→değer, `textContent`): `📅 TARİH — #sum-date` · `🍽️ MUTFAK — #sum-food` · `🥂 İÇECEK — #sum-drink`
- İmza (italik): `Seninle, çok yakında ♡`
- `#btn-share` **Kartı Paylaş 📤** (altın) · `#btn-restart` **Baştan Al ↺** (ghost)
- Dipnot: `ekran görüntüsü al, kaybetme bunu 😉`
- Açılışta wax-seal + kalp yağmuru. Paylaş → `navigator.share` varsa native, yoksa clipboard + toast `Kart panoya kopyalandı ♡`.

---

## 5. Kaçan "Hayır" Mekaniği (escape.js) — canlı referanstan doğrulandı

- **Masaüstü:** `pointermove` ile imleç↔buton merkezi mesafesi `Math.hypot`; `< ~120px` olunca buton kaçar. Yeni konum fareden `>150px` uzak, viewport içinde clamp (min 12px kenar payı), Evet ile çakışmaz. `position:fixed` + yaylı transition (~180ms `cubic-bezier(.34,1.56,.64,1)`).
- **KONUMLANDIRMA (kritik sertleştirme):** ilk kaçışta `#btn-no` **`document.body`'ye taşınır** (`appendChild`) → herhangi bir ata `transform/filter/backdrop-filter/will-change` alsa bile fixed daima viewport'a göre çalışır. `reset()` butonu orijinal ebeveynine (`.btn-row`) geri koyar. Ayrıca belt-and-suspenders: `#stage`, `#screen-ask`, `.btn-row` üzerinde `transform/filter/backdrop-filter/will-change/perspective/contain` KULLANILMAZ. Escape dinleyicileri `document` seviyesinde; `disable()` bunları kaldırır (navigasyon sonrası buton kaçmaya devam etmesin).
- **Mobil/touch:** `pointerdown` (pointerType==='touch') `preventDefault` → parmak değmeden güvenli rastgele konuma zıplar (tık asla tescil olmaz).
- **Her kaçışta:** `escapeCount++`; Evet `scale *= 1.06` (max ~1.6); Hayır `scale *= 0.92` (min ~0.55) + opacity düşer; `#nudge` bir sonraki mesaja döner (wobble); 3/6/9'da Evet üstünden altın **shine**.
- **12 mesaj (sırayla):** `Hayır` · `Emin misin? 🥺` · `Cidden mi ya 😭` · `Bir daha düşün 👀` · `Yakalayamazsın 😌` · `Kalbim kırılıyor 💔` · `Bu buton çok utangaç 🙈` · `Tamam pes etme bende 😤` · `Kaçmak olimpik olsa altın benim 🥇` · `Evet'e bir şans versene 🥹` · `Fareni yorma, olmayacak 🐭` · `Son teklif: EVEEET de 💍`
- **Erişilebilirlik güvenliği:** klavye focus'unda da kaçar AMA kilitlemez — **5. kaçıştan sonra sabitlenir**, metni `Peki... Evet o zaman :)` olur, tık/Enter ile Ekran 2'ye geçer. `#btn-no` `aria-label="Hayır (yakalayabilirsen)"`.
- `prefers-reduced-motion`: kaçış çalışır ama transition anında (baş dönmesi yok).

## 6. Kutlama (celebrate.js) — tek `#fx` canvas, kütüphane YOK

- `burst(x,y,count,{hearts})`: verilen noktadan İKİ dalga — (1) **kalpler** (canvas heart-path, rose+gold dolgu, döner+süzülür), (2) ince **konfeti** şeritleri (gold/cream/rose, scaleX flip). Fizik: radyal vx + vy negatif başlar, `gravity += 0.15/frame`, `vx *= 0.99`, rotasyon, life→alpha fade. rAF; dizi boşalınca canvas temizlenir ve **RAF durur**. Üst sınır ~200 parçacık.
- `fountain()`: Ekran 2 açılış — merkez-üstten fıskiye + iki yan popper + `pulse()`.
- `mini(x,y)`: küçük burst (buton tık ödülü / kopyalama).
- `rain()`: Ekran 5 kalp yağmuru.
- `pulse()`: ekran ortasından peach→gold yumuşak ışık glow (opacity 0→.5→0, 600ms) — `#pulse` overlay.
- **Ses YOK.** `prefers-reduced-motion`: yoğun düşme yerine ~20 parçacıklı tek yumuşak sparkle.

---

## 7. Dizin Yapısı

```
will-u-go-on-a-date-with-me/
├── index.html          # 5 ekranın semantik yapısı + katman elemanları + <link>/<script> sırası + inline emoji favicon
├── css/
│   └── styles.css      # palet değişkenleri, tüm stiller, animasyonlar, responsive, reduced-motion
├── js/
│   ├── config.js       # window.CONFIG (messages, surrenderAt, surrenderText, share(state), reduced)
│   ├── ambient.js      # window.Ambient (#bg particle sistemi)
│   ├── celebrate.js    # window.Celebrate (#fx konfeti/kalp + #pulse)
│   ├── escape.js       # window.Escape (kaçan Hayır mekaniği)
│   └── app.js          # state machine, ekran nav, chip grupları, tarih, özet, paylaş, restart, init
├── assets/             # (opsiyonel — şu an boş; favicon inline data-URI)
├── PLAN.md
└── README.md
```

`index.html` script yükleme sırası (body sonu, classic): `config.js` → `ambient.js` → `celebrate.js` → `escape.js` → `app.js`.

---

## 8. JS Sözleşmesi (global API — modüller `window` üstünden konuşur)

**`window.CONFIG`** (config.js):
```
{ messages: [12 string], surrenderAt: 5, surrenderText: "Peki... Evet o zaman :)",
  reduced: <bool matchMedia prefers-reduced-motion>,
  share(state) -> "It is a date! 💌\nTarih: {day} · Mutfak: {food} · İçecek: {drink}\nSeninle, çok yakında ♡" }
```

**`window.Ambient`** (ambient.js): `start()`, `stop()`, `intensify(ms)` (kutlamada geçici yoğunluk). `#bg` canvas'ı kendi yönetir; reduced'da az/yavaş.

**`window.Celebrate`** (celebrate.js): `burst(x,y,count=60,opts={hearts:true})`, `fountain()`, `mini(x,y)`, `rain()`, `pulse()`. `#fx` ve `#pulse`'ı kendi yönetir; DPR-aware; reduced'da minimal.

**`window.Escape`** (escape.js): `init({ onAccept })` — `#btn-no`/`#btn-yes`/`#nudge`'ı ID ile bulur, kaçış + scaling + mesaj + surrender'ı yönetir; surrendered iken `#btn-no` tıklanınca `onAccept()` çağırır. İlk kaçışta `#btn-no`'yu `document.body`'ye taşır (orijinal ebeveyn + placeholder referansını saklar). `disable()` — `document` dinleyicilerini kaldırır + no butonunu gizler/nötrler (Evet ile ayrılırken kaçmaya devam etmesin). `reset()` — no butonunu orijinal ebeveynine geri koyar, inline `position/left/top/transform/opacity` temizler, metni "Hayır"a, `escapeCount=0`, `#nudge` boş, yes/no scale=1, dinleyicileri yeniden ekler (restart).

**`app.js`** orchestrator:
- `state = { day:null, food:null, drink:null }`.
- `showScreen(id, {back}={})` — `.active` yönetimi + steps güncelle + ekran giriş hook'u (celebrate → forward-entry'de `Celebrate.fountain()` + `Ambient.intensify(2000)`, back-entry'de tekrar patlatma; summary → render + `Celebrate.rain()`).
- `goCelebrate()` — `Escape.disable()` + `Celebrate.burst(yesRect)` + `showScreen('screen-celebrate')`. `#btn-yes` click ve `Escape onAccept` bunu çağırır.
- `setupRadioGroup(el, onPick)` — tek seçim, roving `tabindex`, ok tuşu gezinme, `aria-checked`, ink-press (`.pressed` class kısa süre).
- Tarih: init'te `#date-input.min = bugün (YYYY-MM-DD)`; chip ↔ `#date-input` karşılıklı dışlama, TR format (`toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})`), `#date-stamp` göster, `#btn-date-next` aç.
- Food/Drink: iki grup, ikisi de seçilince `#btn-food-next` aç; alkolsüz seçilince toast + parıltı; grup dolunca label'a ✓.
- Summary: `#sum-date/food/drink` `textContent` ile doldur.
- Paylaş: `navigator.share` → yoksa `navigator.clipboard.writeText(CONFIG.share(state))` + toast + `Celebrate.mini()`. AbortError sessiz.
- Restart: state sıfırla, chip seçimleri temizle, `Escape.reset()`, `showScreen('screen-ask')`.
- Back butonları (`[data-back]`), easter egg (celebrate title), `showToast(msg)` (tek `#toast`, ~2.2s auto-dismiss, reduced'da fade).
- `DOMContentLoaded`: `Ambient.start()`, `Escape.init({onAccept:goCelebrate})`, tüm wiring, `showScreen('screen-ask')`.

---

## 9. CSS Sözleşmesi (JS'in eklediği class'lar — isimler sabit)

`.screen` / `.screen.active`, `.chip[aria-checked="true"]`, `.chip.pressed` (ink-press), `.btn.shine` (yes shine), `.nudge.wobble`, `.step.active` (progress dot), `.is-armed` (buton aktifleşti + wiggle), `#toast.show`, `#date-stamp.show`, `#pulse.go`. Buton pasifliği gerçek `disabled` attribute + stil.

## 10. Kabul Kriterleri (doğrulama Playwright ile)

1. `file://index.html` çift-tık açılır, konsol hatası yok. ✅
2. Ekran 1: Hayır butonu fareyle üstüne gelince kaçar; 5 denemeden sonra sabitlenir + "Peki... Evet o zaman :)". ✅
3. Evet → kutlama ekranı + otomatik konfeti/kalp. ✅
4. Kutlama → tarih seçimi; bir seçim yapmadan "Devam et" pasif; chip veya tarih seçince aktif. ✅
5. Tarih → yemek+içecek; iki grup da seçilene dek "Neredeyse bitti" pasif. ✅
6. Özet kartı 3 seçimi doğru gösterir; "It is a date!" görünür; Paylaş çalışır; Baştan Al ekran 1'e sıfırlar. ✅
7. Uçuşan kalpler tüm ekranlarda görünür. ✅
8. Mobil viewport'ta layout taşmaz; klavyeyle tüm akış tamamlanabilir; `prefers-reduced-motion` deneyimi bozmadan sakinleştirir. ✅

---

## 11. Plan Doğrulama & Sertleştirmeler (uygulandı)

Doğrulanan kararlar:
- **classic script / no ES module** → `file://` çift-tık için DOĞRU (module CORS'ta patlar). Body sonunda sırayla yüklenir, sync çalışır.
- **offline serif fallback** → Georgia/Palatino/Times TR glyph'leri (İ ı ş ğ ç ö ü) içerir; harici font gerekmez. `lang="tr"` + `utf-8`.
- **SVG feTurbulence grain** data-URI offline çalışır.

Sertleştirmeler:
- **Kaçan buton `position:fixed` garantisi:** ilk kaçışta `#btn-no` → `document.body` reparent; ata zincirinde `transform/filter/backdrop-filter/will-change/perspective/contain` yasak; escape dinleyicileri `document`'te, `disable()` kaldırır. (bkz. §5, §8)
- **backdrop-filter fallback:** kartlarda `@supports not (backdrop-filter: blur(1px))` altında opak-ımsı zemin (`--card` opaklığı ~0.14→görsel korunur) + blur yok. Frosted his desteklenen tarayıcıda, düz zarif kart desteklenmeyende.
- **restart tam sıfırlama:** `Escape.reset()` yes/no scale+opacity+pozisyon+metin+nudge'ı sıfırlar; app state (day/food/drink=null), chip `aria-checked=false`, date input boş, butonlar tekrar `disabled`.
- **date-input.min** app.js init'te bugüne set edilir; chip↔date karşılıklı dışlama.
- **celebrate fountain** yalnız forward-entry'de; back-nav tekrar patlatmaz.

Verdict: **APPROVED WITH CHANGES → değişiklikler uygulandı → BUILD'e hazır.**
