# Architecture

| Path | Role |
|---|---|
| `index.html` | Page skeleton, one `<section class="scene">` per scene |
| `src/style.css` | Theme tokens, scene layout and transitions |
| `src/main.js` | Scene navigation and reveal on scroll |
| `src/scenes/` | One module per scene: hero, problems, channels, brains, lens, search, hungry, perf, choices. Each builds its DOM once and returns a `play()` run when the scene first scrolls into view |
| `src/util.js` | DOM/SVG helpers and the number counter |

| Decision | Rationale |
|---|---|
| Plain HTML/CSS/ES modules, no build | Fastest to change before a demo, deploys to any static host |
| GitHub Pages from `main` | Stays online with no server to run; a push is a deploy |
