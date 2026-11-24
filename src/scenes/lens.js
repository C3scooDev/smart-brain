import { h, sleep } from "../util.js";

const TYPES = [
  { k: "semantica", color: "#7fb7e8", angle: 0 },
  { k: "logica", color: "#e8b86b", angle: -0.75 },
  { k: "topologica", color: "#9fd18b", angle: 0.75 },
  { k: "temporale", color: "#d996c8", angle: 2.4 },
];
const STEP = 5;          // nodes read per frame, same for both searches
const MS_PER_NODE = 4;   // simulated reading cost

// Seeded random so every visitor sees the same brain.
function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// A radial neuron mass: 6 trunks from the centre, 3 children per node, 5 levels. Branches keep a dominant type.
function buildNet() {
  const rnd = rng(7);
  const nodes = [];
  const add = (parent, angle, depth, type) => {
    const r = depth === 0 ? 0 : 0.1 + depth * 0.17 + (rnd() - 0.5) * 0.05;
    const n = { x: Math.cos(angle) * r, y: Math.sin(angle) * r, depth, parent, kids: [], type, angle };
    nodes.push(n);
    parent?.kids.push(n);
    if (depth < 5) {
      const spread = [Math.PI * 2, 0.75, 0.38, 0.2, 0.1][depth];
      const count = depth === 0 ? 6 : 3;
      for (let i = 0; i < count; i++) {
        const a = depth === 0 ? (i / 6) * Math.PI * 2 + 0.3 : angle + (i - 1) * spread + (rnd() - 0.5) * spread * 0.5;
        const t = depth <= 1 ? TYPES[Math.floor(rnd() * 4)].k : rnd() < 0.72 ? type : TYPES[Math.floor(rnd() * 4)].k;
        add(n, a, depth + 1, t);
      }
    }
    return n;
  };
  add(null, 0, 0, "semantica");
  return nodes;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const neighbours = (n) => [...n.kids, ...(n.parent ? [n.parent] : [])];

// Plans both searches for one query type: returns the order each one reads nodes in.
function plan(nodes, type) {
  const T = TYPES.find((t) => t.k === type);
  const centre = { x: Math.cos(T.angle) * 0.55, y: Math.sin(T.angle) * 0.55 };
  const lensR = 0.16;
  const inLens = nodes.filter((n) => dist(n, centre) < lensR);
  const lensSeq = inLens.filter((n) => n.type === type).sort((a, b) => dist(a, centre) - dist(b, centre));
  const start = lensSeq[0] ?? inLens[0];

  // Target: a same-type node a few hops from the coloured branch, outside the lens, so the lens must expand.
  const hop = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const n = q.shift();
    for (const m of neighbours(n)) if (!hop.has(m)) { hop.set(m, hop.get(n) + 1); q.push(m); }
  }
  const target = nodes
    .filter((n) => n.type === type && n.depth === 5 && dist(n, centre) > lensR && hop.get(n) >= 3 && hop.get(n) <= 5)
    .sort((a, b) => hop.get(b) - hop.get(a) || dist(b, centre) - dist(a, centre))[0] ?? nodes.at(-1);

  // Lens: read the coloured nodes in the lens, then expand from the coloured branch, same type first.
  const seen = new Set(lensSeq);
  const lens = [...lensSeq];
  if (!seen.has(target)) {
    const open = [[0, start]];
    const cost = new Map([[start, 0]]);
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [c, n] = open.shift();
      if (!seen.has(n)) { seen.add(n); lens.push(n); }
      if (n === target) break;
      for (const m of neighbours(n)) {
        const nc = c + (m.type === type ? 1 : 3);
        if (nc < (cost.get(m) ?? Infinity)) { cost.set(m, nc); open.push([nc, m]); }
      }
    }
  }
  // Flat: read everything level by level from the centre until the target turns up.
  const flat = [...nodes].sort((a, b) => a.depth - b.depth || a.angle - b.angle);
  flat.length = flat.indexOf(target) + 1;
  return { centre, lensR, lens, flat, target, start, color: T.color };
}

function panel(title) {
  const canvas = h("canvas");
  const read = h("b", {}, "0"), ms = h("b", {}, "0 ms");
  const el = h("div.net", {}, h("div.net-head", {}, h("strong", {}, title)), canvas,
    h("div.net-stats", {}, h("span", {}, h("span.dim", {}, "neuroni letti "), read), h("span", {}, h("span.dim", {}, "tempo "), ms)));
  return { el, canvas, read, ms };
}

export default function lens(root) {
  const box = root.querySelector(".lens");
  const nodes = buildNet();
  const left = panel("Ricerca piatta");
  const right = panel("Lente + ramo colorato");
  const verdict = h("div.verdict");
  const chips = h("div.tags");
  TYPES.forEach((t) => chips.append(h("button.tag", { type: "button", style: { "--c": t.color }, onclick: () => run(t.k) }, `query ${t.k}`)));
  box.append(h("div.lens-top", {}, h("span.dim", {}, "Tipo di query:"), chips), h("div.nets", {}, left.el, right.el), verdict);

  let token = 0;
  function draw(p, cv, readSet, lensState, done) {
    const dpr = window.devicePixelRatio || 1;
    const size = cv.clientWidth;
    if (cv.width !== size * dpr) { cv.width = size * dpr; cv.height = size * dpr; }
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    const S = size / 2.15, X = (n) => size / 2 + n.x * S, Y = (n) => size / 2 + n.y * S;
    g.lineWidth = 0.6;
    for (const n of nodes) if (n.parent) {
      g.strokeStyle = readSet.has(n) ? "rgba(217,119,87,.55)" : "rgba(236,235,230,.07)";
      g.beginPath(); g.moveTo(X(n.parent), Y(n.parent)); g.lineTo(X(n), Y(n)); g.stroke();
    }
    for (const n of nodes) {
      const t = TYPES.find((t) => t.k === n.type);
      const on = readSet.has(n);
      g.globalAlpha = on ? 1 : 0.28;
      g.fillStyle = t.color;
      g.beginPath(); g.arc(X(n), Y(n), on ? 3 : 1.8, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (lensState) {
      const { cx, cy, r } = lensState;
      g.strokeStyle = "#ecebe6"; g.lineWidth = 2.5;
      g.beginPath(); g.arc(size / 2 + cx * S, size / 2 + cy * S, r * S, 0, 7); g.stroke();
      const hx = size / 2 + (cx + r * 0.72) * S, hy = size / 2 + (cy + r * 0.72) * S;
      g.lineWidth = 5; g.lineCap = "round";
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + 18, hy + 18); g.stroke();
    }
    if (done) {
      g.strokeStyle = "#d97757"; g.lineWidth = 2.5;
      g.beginPath();
      for (let n = p.target; n; n = n.parent) n === p.target ? g.moveTo(X(n), Y(n)) : g.lineTo(X(n), Y(n));
      g.stroke();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(X(p.target), Y(p.target), 6, 0, 7); g.fill();
    }
  }

  async function run(type) {
    const my = ++token;
    chips.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.textContent.endsWith(type)));
    const p = plan(nodes, type);
    verdict.replaceChildren(h("span.dim", {}, `Cerco un'informazione ${type}...`));
    const flatSet = new Set(), lensSet = new Set();
    let fi = 0, li = 0, frame = 0, lensDone = false, flatDone = false;
    const MOVE = 35;
    await new Promise((resolve) => {
      const tick = () => {
        if (my !== token) return resolve();
        frame++;
        for (let k = 0; k < STEP && fi < p.flat.length; k++) flatSet.add(p.flat[fi++]);
        const t = Math.min(1, frame / MOVE);
        let lensState = { cx: p.centre.x * t, cy: p.centre.y * t, r: p.lensR };
        if (t >= 1) {
          for (let k = 0; k < STEP && li < p.lens.length; k++) lensSet.add(p.lens[li++]);
          const reach = Math.max(p.lensR, ...[...lensSet].map((n) => dist(n, p.centre) + 0.03));
          lensState = { cx: p.centre.x, cy: p.centre.y, r: reach };
        }
        lensDone = li >= p.lens.length; flatDone = fi >= p.flat.length;
        draw(p, left.canvas, flatSet, null, flatDone);
        draw(p, right.canvas, lensSet, lensState, lensDone);
        left.read.textContent = flatSet.size; left.ms.textContent = `${flatSet.size * MS_PER_NODE} ms`;
        right.read.textContent = lensSet.size; right.ms.textContent = `${(lensSet.size + MOVE / STEP) * MS_PER_NODE | 0} ms`;
        if (lensDone && flatDone) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (my !== token) return;
    const x = (p.flat.length / (p.lens.length + MOVE / STEP)).toFixed(1);
    verdict.replaceChildren(
      h("span", {}, h("b.big", {}, `×${x}`), " più veloce. "),
      h("span.dim", {}, `La lente legge ${p.lens.length} neuroni su ${nodes.length}, la ricerca piatta ${p.flat.length}. Simulazione sullo stesso brain, stesso costo per neurone.`));
  }

  requestAnimationFrame(() => { draw(null, left.canvas, new Set(), null, false); draw(null, right.canvas, new Set(), null, false); });
  return async () => {
    await run("semantica");
    await sleep(1500);
    if (token === 1) await run("topologica");
  };
}
