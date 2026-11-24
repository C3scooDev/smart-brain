import { typeLines } from "./scenes/terminal.js";

const scenes = [...document.querySelectorAll(".scene")];
const nav = document.getElementById("nav");

scenes.forEach((s, i) => {
  s.id ||= `s${i}`;
  const a = document.createElement("a");
  a.href = `#${s.id}`;
  a.title = s.dataset.title;
  nav.append(a);
});

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    const i = scenes.indexOf(e.target);
    nav.querySelectorAll("a").forEach((a, j) => a.classList.toggle("on", i === j));
  }
}, { threshold: 0.5 });
scenes.forEach((s) => io.observe(s));

typeLines(document.querySelector('[data-type="hero"]'), [
  { text: "$ brain init --local", cls: "" },
  { text: "› modello locale rilevato", cls: "dim" },
  { text: "› 3 brain caricati", cls: "dim" },
  { text: "✓ pronto", cls: "ok" },
]);
