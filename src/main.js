import hero from "./scenes/hero.js";
import problems from "./scenes/problems.js";
import channels from "./scenes/channels.js";
import brains from "./scenes/brains.js";
import lens from "./scenes/lens.js";
import search from "./scenes/search.js";
import hungry from "./scenes/hungry.js";
import usecases from "./scenes/usecases.js";
import tryit from "./scenes/tryit.js";
import growth from "./scenes/growth.js";
import example from "./scenes/example.js";
import stack from "./scenes/stack.js";
import cost from "./scenes/cost.js";
import models from "./scenes/models.js";
import perf from "./scenes/perf.js";
import choices from "./scenes/choices.js";

const modules = { hero, problems, channels, usecases, brains, lens, example, search, tryit, hungry, growth, stack, models, cost, perf, choices };
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
document.querySelectorAll(".kicker").forEach((k, i) => { k.textContent = `${String(i + 1).padStart(2, "0")} · ${k.textContent}`; });
document.querySelector(".again")?.setAttribute("href", `#${scenes[0].id}`);

// Each scene module builds its DOM once and returns a play() run every time the scene comes into view.
const players = new Map();
for (const s of scenes) {
  const mod = modules[s.dataset.scene];
  if (mod) players.set(s, mod(s));
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    // tall scenes never reach the ratio on a phone: half a screen of them counts as in view
    if (!e.isIntersecting || (e.intersectionRatio < 0.35 && e.intersectionRect.height < innerHeight * 0.5)) continue;
    const s = e.target;
    const first = !s.classList.contains("in");
    s.classList.add("in");
    const i = scenes.indexOf(s);
    nav.querySelectorAll("a").forEach((a, j) => a.classList.toggle("on", i === j));
    if (first) players.get(s)?.();
  }
}, { threshold: [0, 0.1, 0.2, 0.35, 0.5] });
scenes.forEach((s) => io.observe(s));
