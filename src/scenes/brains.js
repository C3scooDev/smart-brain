import { h, sleep } from "../util.js";

const BRAINS = [
  { k: "tecnico", icon: "⚙", color: "#7fb7e8" },
  { k: "commerciale", icon: "◆", color: "#e8b86b" },
  { k: "amministrazione", icon: "▤", color: "#9fd18b" },
  { k: "persone", icon: "●", color: "#d996c8" },
];

// weight = how much an instinct taught by this person counts in that brain; missing brain = cannot read it
const PEOPLE = [
  { name: "Direzione", w: { tecnico: 0.5, commerciale: 0.7, amministrazione: 0.7, persone: 0.8 } },
  { name: "Resp. tecnico", w: { tecnico: 0.9, commerciale: 0.3 } },
  { name: "Commerciale", w: { commerciale: 0.8, amministrazione: 0.3 } },
  { name: "Amministrazione", w: { amministrazione: 0.9, persone: 0.4 } },
  { name: "Stagista", w: { tecnico: 0.2 } },
];

export default function brains(root) {
  const box = root.querySelector(".brains");
  const people = h("div.people");
  const grid = h("div.brain-grid");
  const note = h("p.note");
  box.append(people, h("div", {}, grid, note));

  const cells = BRAINS.map((b) => {
    const bar = h("i");
    const val = h("span.w");
    const cell = h("div.brain", { style: { "--c": b.color } },
      h("div.brain-icon", {}, b.icon), h("strong", {}, b.k),
      h("span.dim.writer", {}, `scrive: agente ${b.k}`),
      h("div.weight", {}, h("span.dim", {}, "peso istinti"), h("div.bar", {}, bar), val),
      h("span.lock", {}, "🔒 non leggibile"));
    grid.append(cell);
    return { b, cell, bar, val };
  });

  const buttons = PEOPLE.map((p) => {
    const btn = h("button.person", { type: "button", onclick: () => { auto = false; pick(p); } }, p.name);
    people.append(btn);
    return btn;
  });

  let auto = true;
  function pick(p) {
    buttons.forEach((b, i) => b.classList.toggle("on", PEOPLE[i] === p));
    for (const { b, cell, bar, val } of cells) {
      const w = p.w[b.k];
      cell.classList.toggle("off", w == null);
      bar.style.width = `${(w ?? 0) * 100}%`;
      val.textContent = w == null ? "" : w.toFixed(1);
    }
    const top = Object.entries(p.w).sort((a, b) => b[1] - a[1])[0];
    note.textContent = `${p.name} legge ${Object.keys(p.w).length} brain su 4. Quello che insegna su «${top[0]}» vale ${top[1].toFixed(1)}: chi è competente pesa di più.`;
  }

  return async () => {
    for (const p of PEOPLE) {
      if (!auto) return;
      pick(p);
      await sleep(1600);
    }
    if (auto) pick(PEOPLE[1]);
  };
}
