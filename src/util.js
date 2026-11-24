export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Creates an element: h("div.card.on", {onclick}, child, "text").
export function h(tag, attrs = {}, ...kids) {
  const [name, ...classes] = tag.split(".");
  const el = document.createElement(name || "div");
  if (classes.length) el.className = classes.join(" ");
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") Object.assign(el.style, v);
    else el.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) el.append(k);
  return el;
}

const SVG = "http://www.w3.org/2000/svg";
export function s(tag, attrs = {}) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// Counts a number up from 0 inside el.
export async function countUp(el, to, ms = 1200, decimals = 0, suffix = "") {
  const t0 = performance.now();
  return new Promise((done) => {
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = (to * (1 - (1 - k) ** 3)).toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}
