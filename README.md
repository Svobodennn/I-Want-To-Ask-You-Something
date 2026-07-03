# I Want To Ask You Something 💌

> 🇹🇷 Türkçe README için: [README.tr.md](README.tr.md)

A romantic, cinematic, single-page **"will you go on a date with me?"** experience. Dark golden-hour theme, floating hearts, a "No" button that runs away (and eventually gives up), a celebration burst and an "It is a date!" ticket card. **No framework, no dependencies, no build** — pure HTML/CSS/vanilla JS, works offline.

**🔗 Live demo (in Turkish):** https://sana-bisi-sorucam.vercel.app — original title: *"Sana Bişi Sorucam"*

## The flow (5 screens)

1. **The question** — "Will you go on a date with me?" · Yes / No (the No button escapes… then surrenders)
2. **Celebration** — confetti + emoji burst
3. **Date** — custom-designed calendar (not the native picker)
4. **Food & drinks** — cuisine + drink preferences
5. **Summary** — "It is a date!" ticket card + countdown + download/share

## Features

- 🗓️ **Custom themed calendar** — month navigation, Monday-first, past days disabled, keyboard navigation
- 💌 **Personalization** — `?to=Name` customizes the headline, tab title and notifications
- 🔗 **"Create your own invite"** — enter a name → get a shareable `?to=` link
- 📅 **Add to calendar** — `.ics` download + Google Calendar link
- 🎟️ **Ticket** — **download** the summary card as PNG or **share** it (Web Share API, mobile)
- 📲 **PWA** — add to home screen, works offline
- 🔊 **Sound effects** — on by default (toggle top-right), synthesized with WebAudio
- 💗 **Tap-to-heart** — hearts fly on every tap
- ⏳ **Countdown** — "X days until the date ✨" on the summary
- 🔔 **Live notifications** — instant **ntfy push + email** the moment someone completes the flow (no backend — see below)
- ♿ Accessible (keyboard, ARIA, `prefers-reduced-motion`) · mobile-friendly

## Run locally

No install needed — **double-click `index.html`** and it opens in the browser (offline).

Or use a simple server (some features like PWA/notifications prefer `http` over `file://`):
```bash
python3 -m http.server 8000        # → http://localhost:8000
```

## Notification setup

There is no backend — when the summary screen is reached, the browser posts directly to the services. Configure `CONFIG.notify` in `js/config.js`:

- **ntfy.sh (phone push):** install the [ntfy](https://ntfy.sh) app and subscribe to your `ntfyTopic`.
- **Web3Forms (email):** grab a free access key from [web3forms.com](https://web3forms.com) and paste it into `web3formsKey`. (Sent as FormData — skips the CORS preflight.)

Empty channels are skipped. The notification includes the chosen date/cuisine/drink.

## Deploy

Static site — host it anywhere. On Vercel, production tracks the `master` branch:
```bash
npx vercel --prod            # or connect the GitHub repo to Vercel (master → prod)
```
Note: set the absolute `og:image` URL in `index.html` to your deploy domain (for social previews).

## Architecture (layered, SRP)

```
index.html · css/styles.css · manifest.webmanifest · sw.js
assets/           # og.png (1200x630) + icon-192/512.png
js/
  config.js                       # constants, copy, notification settings
  state.js                        # AppState — single source of truth
  dom.js · toast.js · screens.js · radiogroup.js · datepicker.js · personalize.js   # foundations/UI
  ambient.js · celebrate.js · escape.js                                             # effects
  calendar.js · ticket.js · notify.js · sound.js · pwa.js                           # services
  date-screen.js · food-screen.js · summary-screen.js                               # screen controllers
  builder.js · tap-hearts.js                                                        # extras
  app.js                          # composition root (wires the modules)
```

Modules are loosely coupled via a `window` namespace + `Screens.onEnter` hooks; the dependency direction is one-way (controllers → services/foundations). Plain classic scripts (no ES modules) — for `file://` compatibility.

## Tech notes

- Zero dependencies/CDN/build; two `<canvas>` layers (ambient + celebration), WebAudio, SVG grain data-URI.
- Offline-first: double-click `file://` works; PWA offline shell (cache-first service worker).
- `prefers-reduced-motion` respected at every layer; values are rendered with `textContent` (XSS-safe).
- Verified with Playwright (flow · mobile · notifications/PWA).

`PLAN.md` — design & technical contract (source of truth, in Turkish).
