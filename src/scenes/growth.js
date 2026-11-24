import { h, sleep } from "../util.js";

const COLORS = { tecnico: "#7fb7e8", commerciale: "#e8b86b", amministrazione: "#9fd18b", persone: "#d996c8" };
const COMMITS = [
  ["tecnico", "wiki: serraggi modello B", "agente tecnico"],
  ["commerciale", "wiki: listino 2026", "agente commerciale"],
  ["persone", "wiki: percorso onboarding", "agente persone"],
  ["tecnico", "istinto: revisione B ogni 12 mesi (0.9)", "grill con Direzione"],
  ["amministrazione", "wiki: chiusura fine mese", "agente amministrazione"],
  ["commerciale", "istinto: Verona priorità Q1 (0.9)", "grill con Direzione"],
  ["tecnico", "fix: modello B 12 Nm da marzo", "correzione di Marco (0.9)"],
  ["commerciale", "wiki: offerta Verona", "agente commerciale"],
  ["commerciale", "istinto: sconto max 8% (0.8)", "grill con Commerciale"],
  ["persone", "wiki: turni dicembre", "agente persone"],
];

export default function growth(root) {
  const box = root.querySelector(".growth-scene");
  const log = h("div.gitlog");
  const pages = h("div.pages");
  const count = h("b", {}, "0");
  box.append(h("div.term", {}, h("div.term-bar", {}, h("i"), h("i"), h("i"), h("span", {}, "git log --oneline brains/")), log),
    h("div", {}, h("div.pages-head", {}, h("span.dim", {}, "pagine e istinti "), count), pages,
      h("div.legend.row", {}, Object.entries(COLORS).map(([k, c]) => h("span", {}, h("i", { style: { background: c } }), k)))));
  for (let i = 0; i < 40; i++) pages.append(h("i.page", { style: { background: Object.values(COLORS)[(i * 7 + (i >> 2)) % 4] } }));
  const tiles = [...pages.children];
  tiles.slice(0, 22).forEach((t) => t.classList.add("on"));
  count.textContent = "22";

  return async () => {
    let n = 22;
    for (const [brain, msg, who] of COMMITS) {
      const sha = Math.random().toString(16).slice(2, 9);
      log.prepend(h("div.commit", {}, h("span.sha", {}, sha), h("span", { style: { color: COLORS[brain] } }, ` ${brain} `), msg, h("span.dim", {}, ` · ${who}`)));
      tiles[n]?.classList.add("on", "new");
      count.textContent = String(++n);
      await sleep(700);
    }
  };
}
