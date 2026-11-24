import hero from "./scenes/hero.js";
import problems from "./scenes/problems.js";
import channels from "./scenes/channels.js";
import brains from "./scenes/brains.js";
import lens from "./scenes/lens.js";
import search from "./scenes/search.js";
import hungry from "./scenes/hungry.js";
import perf from "./scenes/perf.js";
import choices from "./scenes/choices.js";

const modules = { hero, problems, channels, brains, lens, search, hungry, perf, choices };
const scenes = [...document.querySelectorAll(".scene")];
const nav = document.getElementById("nav");

scenes.forEach((s, i) => {
  s.id ||= `s${i}`;
  const a = document.createElement("a");
  a.href = `#${s.id}`;
  a.title = s.dataset.title;
  a.setAttribute("aria-label", s.dataset.title);
  nav.append(a);
});
document.querySelector(".again")?.setAttribute("href", `#${scenes[0].id}`);

// Each scene module builds its DOM once and returns a play() run every time the scene comes into view.
const players = new Map();
for (const s of scenes) {
  const mod = modules[s.dataset.scene];
  if (mod) players.set(s, mod(s));
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const s = e.target;
    const first = !s.classList.contains("in");
    s.classList.add("in");
    const i = scenes.indexOf(s);
    nav.querySelectorAll("a").forEach((a, j) => a.classList.toggle("on", i === j));
    if (first) players.get(s)?.();
  }
}, { threshold: 0.35 });
scenes.forEach((s) => io.observe(s));
