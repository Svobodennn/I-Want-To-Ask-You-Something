# Benimle Çıkar mısın? 💌 — "Altın Saat"

Romantik, sinematik, tek-sayfa bir "benimle çıkar mısın?" deneyimi. Pembe/altın golden-hour teması, uçuşan kalpler, kaçan "Hayır" butonu, kutlama ve "It's a date!" özet kartı.

## Çalıştırma

Kurulum gerekmez. `index.html` dosyasına **çift tıkla** — tarayıcıda açılır. İnternet gerektirmez (offline).

İstersen basit bir sunucuyla da açabilirsin:
```bash
python3 -m http.server 8000    # sonra http://localhost:8000
```

## Akış

1. **Soru** — "Benimle çıkar mısın?" · Evet / Hayır (Hayır kaçar)
2. **Kutlama** — konfeti + kalp patlaması
3. **Tarih** — buluşma günü seçimi
4. **Yemek & İçecek** — mutfak + içecek/alkol tercihi
5. **Özet** — "It is a date!" davetiye kartı + paylaş

## Yapı

- `index.html` — ekran yapısı
- `css/styles.css` — tüm stiller + animasyonlar
- `js/config.js` · `ambient.js` · `celebrate.js` · `escape.js` · `app.js` — vanilla JS modülleri
- `PLAN.md` — tasarım & teknik sözleşme (tek doğruluk kaynağı)

Framework yok, bağımlılık yok, build yok. Saf HTML/CSS/JS.
