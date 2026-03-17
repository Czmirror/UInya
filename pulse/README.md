# Pulse

**Pulse** is a lightweight real-time animation preview tool for game UI assets created with [UInya](https://github.com/Czmirror/UInya).

Load SVG assets exported from UInya and preview animated states — hover, active, pulse effects — directly in the browser.

---

## Features

- Load SVG / PNG assets from UInya exports
- Preview pulsing / glow / bounce animations in real time
- Adjust animation speed, easing, and color
- Export animated GIF or Lottie JSON for use in games and web apps
- No backend required — runs entirely in the browser

---

## Tech Stack

| Role | Technology |
|------|-----------|
| Framework | SvelteKit (`@sveltejs/adapter-static`) |
| Language | TypeScript |
| Animation | Web Animations API / CSS keyframes |
| Build | Vite |
| Hosting | GitHub Pages |

---

## Getting Started

```bash
cd pulse
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Usage

1. Export an SVG asset from UInya
2. Open Pulse and load the SVG file
3. Select an animation preset (pulse, bounce, glow, shake, etc.)
4. Adjust timing and colors in the sidebar
5. Export as animated GIF or Lottie JSON

---

## Roadmap

- [ ] SVG / PNG file loader
- [ ] Built-in animation presets (pulse, glow, bounce, shake)
- [ ] Animation parameter editor (speed, easing, scale)
- [ ] Animated GIF export
- [ ] Lottie JSON export
- [ ] UInya template gallery integration

---

## License

MIT License
