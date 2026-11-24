import { h, sleep } from "../util.js";

const MARKERS = [
  { k: "topologico", color: "#9fd18b" },
  { k: "semantico", color: "#7fb7e8" },
  { k: "logico", color: "#e8b86b" },
  { k: "temporale", color: "#d996c8" },
];
const MS_PER_NODE = 4; // simulated reading cost, same for both searches

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// A radial neuron mass: 6 trunks from the centre, 3 children per node, 5 levels. Branches keep a dominant marker.
function buildNet() {
  const rnd = rng(11);
  const nodes = [];
  const add = (parent, angle, depth, type) => {
    const r = depth === 0 ? 0 : 0.1 + depth * 0.17 + (rnd() - 0.5) * 0.05;
    const n = { x: Math.cos(angle) * r, y: Math.sin(angle) * r, r, depth, parent, kids: [], type, a: Math.atan2(Math.sin(angle), Math.cos(angle)) };
    nodes.push(n);
    parent?.kids.push(n);
    if (depth < 5) {
      const spread = [Math.PI * 2, 0.75, 0.38, 0.2, 0.1][depth];
      const count = depth === 0 ? 6 : 3;
      for (let i = 0; i < count; i++) {
        const a = depth === 0 ? (i / 6) * Math.PI * 2 + 0.3 : angle + (i - 1) * spread + (rnd() - 0.5) * spread * 0.5;
        const t = depth <= 1 ? MARKERS[Math.floor(rnd() * 4)].k : rnd() < 0.72 ? type : MARKERS[Math.floor(rnd() * 4)].k;
        add(n, a, depth + 1, t);
      }
    }
    return n;
  };
  add(null, 0, 0, "semantico");
  return nodes;
}

const pathTo = (n) => { const p = []; for (; n; n = n.parent) p.unshift(n); return p; };

// For one marker: the target, the path that was useful before, and the reading order of both searches.
function plan(nodes, marker) {
  const leaves = nodes.filter((n) => n.depth === 5 && n.type === marker);
  let best = null;
  for (const t of leaves) {
    const near = nodes.filter((p) => p !== t && p.type === marker && p.depth >= 4 && angDiff(p.a, t.a) > 0.16 && angDiff(p.a, t.a) < 0.3);
    if (near.length && (!best || t.r > best.t.r)) best = { t, p: near[0] };
  }
  const { t: target, p: past } = best;
  const axis = past.a;
  const flat = [...nodes].sort((a, b) => a.depth - b.depth || a.a - b.a);
  flat.length = flat.indexOf(target) + 1;

  // Marker Index: the past path first, then a cone around it that widens until the target is inside.
  const path = pathTo(past);
  const read = [...path];
  const seen = new Set(read);
  const cones = [];
  for (let alpha = 0.04; ; alpha += 0.04) {
    const add = nodes.filter((n) => !seen.has(n) && n.type === marker && angDiff(n.a, axis) < alpha).sort((a, b) => a.r - b.r);
    for (const n of add) { seen.add(n); read.push(n); }
    cones.push({ alpha, upTo: read.length });
    if (seen.has(target)) break;
  }
  read.length = read.indexOf(target) + 1;
  return { target, past, path, axis, flat, marker: read, cones, targetPath: pathTo(target) };
}

function panel(title, sub) {
  const canvas = h("canvas");
  const stats = {
    read: h("b", {}, "0"), waste: h("b.bad", {}, "0"), area: h("b", {}, "0%"), ms: h("b", {}, "0 ms"),
  };
  const el = h("div.net", {}, h("div.net-head", {}, h("strong", {}, title), h("span.dim", {}, sub)), canvas,
    h("div.net-stats", {},
      h("span", {}, h("span.dim", {}, "letti "), stats.read),
      h("span", {}, h("span.dim", {}, "inutili "), stats.waste),
      h("span", {}, h("span.dim", {}, "area vista "), stats.area),
      h("span", {}, h("span.dim", {}, "tempo "), stats.ms)));
  return { el, canvas, stats };
}

export default function lens(root) {
  const box = root.querySelector(".lens");
  const nodes = buildNet();
  const left = panel("Ricerca classica", "legge a cerchi dal centro");
  const right = panel("Marker Index", "percorso utile + cono");
  const caption = h("div.caption", {}, "Scegli un marker e premi play.");
  const chips = h("div.tags");
  let marker = MARKERS[0].k, slow = true;
  MARKERS.forEach((m) => chips.append(h("button.tag", { type: "button", style: { "--c": m.color }, "data-k": m.k, onclick: () => { marker = m.k; run(); } }, `#${m.k}`)));
  const playBtn = h("button.ctrl", { type: "button", onclick: () => run() }, "▶ play");
  const slowBtn = h("button.ctrl.on", { type: "button", onclick: () => { slow = !slow; slowBtn.classList.toggle("on", slow); slowBtn.textContent = slow ? "🐢 rallentatore" : "⚡ veloce"; } }, "🐢 rallentatore");
  const bars = h("div.compare");
  box.append(
    h("div.lens-top", {}, h("span.dim", {}, "Marker della domanda:"), chips, playBtn, slowBtn),
    caption,
    h("div.nets", {}, left.el, right.el),
    bars,
    h("div.legend.row.center", {},
      h("span", {}, h("i.lg.read"), "letto e utile"), h("span", {}, h("i.lg.waste"), "letto inutilmente"),
      h("span", {}, h("i.lg.path"), "percorso utile di un task simile"), h("span", {}, h("i.lg.target"), "l'informazione")));

  function draw(cv, p, readSet, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const size = cv.clientWidth;
    if (!size) return;
    if (cv.width !== Math.round(size * dpr)) { cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); }
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    const S = size / 2.15, cx = size / 2, X = (n) => cx + n.x * S, Y = (n) => cx + n.y * S;
    const mk = MARKERS.find((m) => m.k === marker);

    // the area seen so far
    if (opts.disc) {
      g.fillStyle = "rgba(139,138,132,.12)";
      g.beginPath(); g.arc(cx, cx, opts.disc * S, 0, 7); g.fill();
    }
    if (opts.cone) {
      const R = 1.02 * S, a = opts.cone;
      const grad = g.createRadialGradient(cx, cx, 0, cx, cx, R);
      grad.addColorStop(0, "rgba(217,119,87,.45)"); grad.addColorStop(1, "rgba(217,119,87,.12)");
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(cx, cx); g.arc(cx, cx, R, p.axis - a, p.axis + a); g.closePath(); g.fill();
      g.strokeStyle = "rgba(217,119,87,.6)"; g.lineWidth = 1; g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]);
    }
    g.lineWidth = 0.6;
    g.strokeStyle = "rgba(236,235,230,.06)";
    for (const n of nodes) if (n.parent) {
      g.beginPath(); g.moveTo(X(n.parent), Y(n.parent)); g.lineTo(X(n), Y(n)); g.stroke();
    }
    const onPath = new Set(opts.path ?? []);
    const useful = new Set(p?.targetPath ?? []);
    for (const n of nodes) {
      const m = MARKERS.find((x) => x.k === n.type);
      const isRead = readSet.has(n);
      const highlight = opts.markerGlow && n.type === marker;
      let color = m.color, alpha = opts.markerGlow ? (highlight ? 0.85 : 0.1) : 0.4, r = 2;
      if (isRead) { r = 2.8; alpha = 1; color = useful.has(n) || onPath.has(n) ? mk.color : "#c05050"; }
      g.globalAlpha = alpha; g.fillStyle = color;
      g.beginPath(); g.arc(X(n), Y(n), r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    const line = (list, color, w) => {
      g.strokeStyle = color; g.lineWidth = w; g.lineCap = "round"; g.beginPath();
      list.forEach((n, i) => (i ? g.lineTo(X(n), Y(n)) : g.moveTo(X(n), Y(n)))); g.stroke();
    };
    if (opts.path) line(opts.path, "#ecebe6", 2.5);
    if (p && opts.found) {
      line(p.targetPath, "#d97757", 3);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(X(p.target), Y(p.target), 7, 0, 7); g.fill();
      g.strokeStyle = "#d97757"; g.lineWidth = 2; g.beginPath(); g.arc(X(p.target), Y(p.target), 12, 0, 7); g.stroke();
    } else if (p && opts.showTarget) {
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.setLineDash([3, 3]);
      g.beginPath(); g.arc(X(p.target), Y(p.target), 10, 0, 7); g.stroke(); g.setLineDash([]);
    }
  }

  const setStats = (P, read, waste, area) => {
    P.stats.read.textContent = read; P.stats.waste.textContent = waste;
    P.stats.area.textContent = `${Math.round(area * 100)}%`; P.stats.ms.textContent = `${read * MS_PER_NODE} ms`;
  };

  let token = 0;
  async function run() {
    const my = ++token;
    chips.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === marker));
    const p = plan(nodes, marker);
    const mk = MARKERS.find((m) => m.k === marker);
    const usefulSet = new Set(p.targetPath);
    const flatSet = new Set(), markSet = new Set();
    bars.replaceChildren();
    const say = (...t) => caption.replaceChildren(h("span", {}, ...t));
    const live = () => my === token;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const pause = (ms) => sleep(slow ? ms : ms / 3);

    say(h("b", {}, "1 · "), "La domanda arriva con il marker ", h("b", { style: { color: mk.color } }, `#${marker}`), ". Il Marker Index accende solo i neuroni con quel colore. Il cerchio tratteggiato è l'informazione da trovare.");
    draw(left.canvas, p, flatSet, { showTarget: true });
    draw(right.canvas, p, markSet, { markerGlow: true, showTarget: true });
    setStats(left, 0, 0, 0); setStats(right, 0, 0, 0);
    await pause(3200); if (!live()) return;

    say(h("b", {}, "2 · "), "Questa strada è servita per un task simile. Diventa l'asse della ricerca.");
    for (let i = 1; i <= p.path.length; i++) {
      draw(right.canvas, p, markSet, { markerGlow: true, path: p.path.slice(0, i), showTarget: true });
      await pause(450); if (!live()) return;
    }
    await pause(1200); if (!live()) return;

    say(h("b", {}, "3 · "), "Le due ricerche leggono alla stessa velocità. A sinistra si legge tutto, a cerchi dal centro. A destra il cono si apre dal percorso e legge solo il colore giusto.");
    // Same pace for both until the Marker Index finds the target, then fast-forward the classic search.
    const every = slow ? 10 : 3, forward = slow ? 5 : 10;
    let fi = 0, mi = 0, fDone = false, mDone = false, tick = 0, announced = false;
    while (!(fDone && mDone)) {
      if (!live()) return;
      tick++;
      if (mDone) {
        for (let k = 0; k < forward && fi < p.flat.length; k++) flatSet.add(p.flat[fi++]);
      } else if (tick % every === 0) {
        if (fi < p.flat.length) flatSet.add(p.flat[fi++]);
        markSet.add(p.marker[mi++]);
      }
      fDone = fi >= p.flat.length; mDone = mi >= p.marker.length;
      const cone = p.cones.find((c) => c.upTo >= mi) ?? p.cones.at(-1);
      const depth = p.flat[Math.max(0, fi - 1)].depth;
      const disc = 0.14 + depth * 0.17;
      const coneOn = mi > p.path.length;
      draw(left.canvas, p, flatSet, { disc, found: fDone, showTarget: true });
      draw(right.canvas, p, markSet, { path: p.path, cone: coneOn ? cone.alpha : 0, found: mDone, showTarget: true });
      const flatArea = nodes.filter((n) => n.r <= disc).length / nodes.length;
      const coneArea = nodes.filter((n) => angDiff(n.a, p.axis) < cone.alpha).length / nodes.length;
      const waste = (set) => [...set].filter((n) => !usefulSet.has(n)).length;
      setStats(left, flatSet.size, waste(flatSet), flatArea);
      setStats(right, markSet.size, waste(markSet), coneOn ? coneArea : 0);
      if (mDone && !fDone && !announced) {
        announced = true;
        right.el.classList.add("won");
        say(h("b", {}, "4 · "), "Il Marker Index ha trovato l'informazione. La ricerca classica sta ancora leggendo documenti inutili, in rosso. ", h("span.ff", {}, "⏩ avanti veloce"));
        await sleep(slow ? 2500 : 900);
      }
      await frame();
    }
    if (!live()) return;
    setTimeout(() => right.el.classList.remove("won"), 1500);

    const fw = [...flatSet].filter((n) => !usefulSet.has(n)).length, mw = [...markSet].filter((n) => !usefulSet.has(n)).length;
    say(h("b", {}, "5 · "), `Stessa informazione. Il Marker Index legge ${markSet.size} neuroni, la ricerca classica ${flatSet.size}.`);
    const bar = (label, a, b, suf = "") => {
      const max = Math.max(a, b, 1);
      return h("div.cmp", {}, h("span.dim", {}, label),
        h("div.cmp-row", {}, h("span", {}, "classica"), h("div.cmp-bar", {}, h("i.slow", { style: { width: `${(a / max) * 100}%` } })), h("b", {}, `${a}${suf}`)),
        h("div.cmp-row", {}, h("span", {}, "marker"), h("div.cmp-bar", {}, h("i.fast", { style: { width: `${(b / max) * 100}%` } })), h("b.acc", {}, `${b}${suf}`)));
    };
    bars.replaceChildren(
      bar("documenti letti inutilmente", fw, mw),
      bar("tempo di ricerca", flatSet.size * MS_PER_NODE, markSet.size * MS_PER_NODE, " ms"),
      h("div.cmp.big", {}, h("b.x", {}, `×${Math.round(flatSet.size / markSet.size)}`), h("span.dim", {}, "più veloce · simulazione sullo stesso brain, stesso costo per neurone")));
  }

  requestAnimationFrame(() => { draw(left.canvas, null, new Set()); draw(right.canvas, null, new Set()); });
  return () => run();
}
