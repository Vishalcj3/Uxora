# 🌿 EcoTrack Dashboard

A **gamified personal carbon-footprint tracker** that turns everyday eco-habits — taking transit,
recycling, saving energy — into a game you actually want to keep playing. Log an action, watch your
**Eco Points** and **CO₂ saved** climb with animated feedback, keep your streak alive, level up from
🌱 Sprout to 🌳 Forest Guardian, and watch your footprint trend down through clean, satisfying charts.

Built as a frontend UI/UX contest submission — its signature feature is a **scroll-scrubbed hero
sequence** where your scroll position drives the animation timeline like a video scrubber.

> **Stack:** React 18 + Vite · Tailwind CSS · Framer Motion · GSAP + ScrollTrigger + Lenis · Recharts · Zustand
>
> Theme: *Organic Eco* — forest greens & moss on a soft cream base, with light & dark modes.

---

## ✨ Features

- **Scroll-scrub hero** — a pinned landing sequence (GSAP ScrollTrigger + Lenis): Earth → habit icons
  orbit in → a footprint line draws itself trending down → the Impact Score ring sweeps up → the live
  dashboard settles into place. Honors `prefers-reduced-motion`.
- **Habit logging & gamification** — 3 categories (**Transit**, **Recycling**, **Energy**) with
  quick-tap habits, each awarding Eco Points with a count-up + particle burst. Daily **streak**, a
  **level system** (Sprout → Sapling → Tree → Forest Guardian), and unlockable **badges**.
- **Carbon tracking** — every action maps to estimated **CO₂ saved (kg)** via documented per-habit
  multipliers, surfaced as the two hero numbers (Impact Score + CO₂ Saved) plus relatable equivalents.
- **Data visualization** — Impact Score ring, weekly **Trend** chart, **Category** donut, GitHub-style
  **Streak calendar** heatmap, and an analytics summary — all themed with shared color tokens.
- **Customizable dashboard** — a configurable widget layout (stats, quick-log, trend, donut, calendar,
  analytics).
- **Multi-language** — English, Hindi, Tamil and German (i18n).
- **Polished & accessible** — centralized theme tokens, WCAG-AA contrast, 60fps transform/opacity
  animation, responsive from mobile to desktop, light/dark themes.

---

## 🗂️ Structure

```
Uxora/
├─ README.md
├─ docs/
│  └─ EcoTrack_Dashboard_PRD.pdf   # product requirements / design spec
└─ ecotrack/                        # the React + Vite app
   ├─ src/
   │  ├─ components/                #   HeroScroll, Dashboard, Navbar, SettingsPanel, widgets/
   │  ├─ store/useStore.js          #   Zustand state (logs, level, theme, widgets)
   │  ├─ lib/data.js                #   habits, CO₂ multipliers, levels, derived stats
   │  ├─ hooks/useLenisScroll.js    #   smooth-scroll integration
   │  └─ i18n/                       #   language context + translations
   ├─ index.html · vite.config.js · tailwind.config.js
   └─ package.json
```

---

## 🚀 Getting Started

```bash
cd ecotrack
npm install
npm run dev      # Vite dev server
```

Then open the printed localhost URL. Build for production with `npm run build` (outputs to `dist/`).

---

## 🌍 Habit & CO₂ Model

Logged actions convert to estimated CO₂ saved using static per-habit multipliers (in
[`ecotrack/src/lib/data.js`](ecotrack/src/lib/data.js)), e.g. cycle commute `2.6 kg`, bus `2.1 kg`,
metro `1.8 kg`, skip-AC `1.6 kg`, recycle plastics `0.9 kg`. Points are `round(kg × 10) + 5`. Levels
unlock at 0 / 400 / 1200 / 2600 points (Sprout → Sapling → Tree → Forest Guardian). The app seeds 12
weeks of deterministic history so every chart is alive on first load.

See [`docs/EcoTrack_Dashboard_PRD.pdf`](docs/EcoTrack_Dashboard_PRD.pdf) for the full product spec,
theme tokens, animation system, and the scroll-scrub storyboard.

---

_A gamified carbon-footprint tracker — frontend UI/UX contest submission._
