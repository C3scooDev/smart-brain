import { h, s, sleep } from "../util.js";

const W = 1000, LEVEL_Y = [50, 185, 320, 455];
const LEVEL_NAME = ["brain", "sintesi di sintesi", "sintesi", "documento"];
const TAGS = [
  { k: "fine-mese", color: "#e8b86b", cyclic: true },
  { k: "trimestrale", color: "#7fb7e8", cyclic: true },
  { k: "onboarding", color: "#d996c8", cyclic: false },
];
const FOCUS_W = 36, CONE_STEP = 150;

// A 4-level tree, 4 children per node: 1 + 4 + 16 + 64 nodes.
function buildTree() {
  const nodes = [];
  const add = (level, i, parent) => {
    const n = 4 ** level;
    const node = { level, i, parent, x: (i + 0.5) * (W / n), y: LEVEL_Y[level], kids: [], tags: new Set() };
    nodes.push(node);
    parent?.kids.push(node);
    if (level < 3) for (let c = 0; c < 4; c++) add(level + 1, i * 4 + c, node);
    return node;
  };
  const rootNode = add(0, 0, null);
  for (const n of nodes.filter((n) => n.level === 3)) {
    const k = n.i;
    if (k % 8 === 2 || k % 8 === 5) n.tags.add("fine-mese"); // the default focus, doc 27, has it
    if (k % 16 === 9 || k % 16 === 13) n.tags.add("trimestrale");
    if (k % 21 === 4) n.tags.add("onboarding");
  }
  const lift = (n) => { for (const c of n.kids) { lift(c); c.tags.forEach((t) => n.tags.add(t)); } };
  lift(rootNode);
  return nodes;
}

export default function lens(root) {
  const box = root.querySelector(".lens");
  const nodes = buildTree();
  const leaves = nodes.filter((n) => n.level === 3);
  let focusLeaf = leaves[26], tag = null, ready = false;

  const svg = s("svg", { viewBox: `0 0 ${W} 510`, class: "tree" });
  const defs = s("defs");
  const grad = s("linearGradient", { id: "cone", x1: 0, y1: 0, x2: 0, y2: 1 });
  [[0, 0.04], [0.55, 0.22], [1, 0.06]].forEach(([o, a]) => grad.append(s("stop", { offset: o, "stop-color": "#d97757", "stop-opacity": a })));
  defs.append(grad);
  const cone = s("polygon", { fill: "url(#cone)", class: "cone" });
  const edges = s("g"), dots = s("g");
  const glass = s("g", { class: "glass" });
  glass.append(s("circle", { r: 26, fill: "none", stroke: "#ecebe6", "stroke-width": 3 }),
    s("line", { x1: 19, y1: 19, x2: 40, y2: 40, stroke: "#ecebe6", "stroke-width": 5, "stroke-linecap": "round" }));
  svg.append(defs, cone, edges, dots, glass);
  for (let l = 0; l < 4; l++) {
    const t = s("text", { x: 6, y: LEVEL_Y[l] - 16, class: "lvl" });
    t.textContent = `L${l} · ${LEVEL_NAME[l]}`;
    svg.append(t);
  }

  for (const n of nodes) {
    if (n.parent) {
      n.edge = s("line", { x1: n.parent.x, y1: n.parent.y, x2: n.x, y2: n.y, class: "edge" });
      edges.append(n.edge);
    }
    n.dot = s("circle", { cx: n.x, cy: n.y, r: [14, 10, 7, 5][n.level], class: "node" });
    if (n.level === 3) n.dot.addEventListener("click", () => { focusLeaf = n; ready = true; update(); });
    const title = s("title");
    title.textContent = n.level === 3 ? `documento ${n.i + 1} ${[...n.tags].map((t) => "#" + t).join(" ")}` : `${LEVEL_NAME[n.level]} ${n.i + 1}`;
    n.dot.append(title);
    dots.append(n.dot);
  }

  const chips = h("div.tags");
  const chipFor = (t) => h("button.tag", { type: "button", style: { "--c": t ? t.color : "#8b8a84" }, onclick: () => { tag = t; ready = true; update(); } },
    t ? `#${t.k}${t.cyclic ? " ↻" : ""}` : "nessun tag");
  [null, ...TAGS].forEach((t) => chips.append(chipFor(t)));
  const info = h("div.lens-info");
  box.append(h("div.tree-wrap", {}, svg), h("div.lens-side", {}, h("p.dim", {}, "Tocca un documento per spostare il focus. Scegli un tag per colorare uno schema."), chips, info));

  const coneW = (level, focusLevel) => FOCUS_W + CONE_STEP * Math.abs(level - focusLevel);

  function update() {
    const focus = focusLeaf.parent;
    const path = new Set();
    for (let n = focusLeaf; n; n = n.parent) path.add(n);
    const fx = focus.x;
    const pts = [0, 1, 2, 3].map((l) => [coneW(l, 2), LEVEL_Y[l]]);
    cone.setAttribute("points", [...pts.map(([w, y]) => `${fx - w},${y}`), ...pts.reverse().map(([w, y]) => `${fx + w},${y}`)].join(" "));
    cone.style.opacity = ready ? 1 : 0;
    glass.setAttribute("transform", `translate(${focus.x},${focus.y})`);
    glass.style.opacity = ready ? 1 : 0;

    for (const n of nodes) {
      const inCone = Math.max(0, 1 - Math.abs(n.x - fx) / coneW(n.level, 2));
      const has = tag && n.tags.has(tag.k);
      let k = path.has(n) ? 1 : inCone * 0.85;
      if (tag && !path.has(n)) k *= has ? 1.6 : 0.3;
      if (!ready) k = 0.5;
      n.dot.style.opacity = Math.max(0.08, Math.min(1, k)).toFixed(2);
      n.dot.style.fill = path.has(n) && ready ? "#d97757" : has ? tag.color : "#ecebe6";
      n.dot.classList.toggle("tagged", !!has);
      if (n.edge) {
        n.edge.classList.toggle("on", ready && path.has(n));
        n.edge.style.opacity = ready && path.has(n) ? 1 : Math.max(0.06, k * 0.5).toFixed(2);
      }
    }
    const inside = leaves.filter((l) => Math.abs(l.x - fx) < coneW(3, 2) && (!tag || l.tags.has(tag.k)));
    info.replaceChildren(
      h("div.row", {}, h("span.dim", {}, "strada utile"), h("code", {}, `brain › ${focus.parent.i + 1} › ${focus.i + 1} › doc ${focusLeaf.i + 1}`)),
      h("div.row", {}, h("span.dim", {}, "lente su"), h("span", {}, `sintesi ${focus.i + 1} (L2)`)),
      h("div.row", {}, h("span.dim", {}, "nel cono"), h("span", {}, `${inside.length} documenti su 64${tag ? ` con #${tag.k}` : ""}`)),
      h("div.row", {}, h("span.dim", {}, "contesto letto"), h("span.big", {}, `${Math.round((inside.length / 64) * 100)}%`)));
  }

  update();
  return async () => {
    await sleep(500);
    ready = true;
    focusLeaf = leaves[26];
    update();
    await sleep(2200);
    tag = TAGS[0];
    update();
  };
}
