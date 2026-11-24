import { h, sleep, countUp } from "../util.js";

const VRAM = [
  { k: "LLM · Qwen 3.6 35B-A3B", gib: 24.2, color: "#d97757" },
  { k: "voce · trascrizione", gib: 2.9, color: "#7fb7e8" },
  { k: "ricerca · qmd", gib: 4.0, color: "#9fd18b" },
];
const QUEUE = ["persona in attesa", "media (voce, foto)", "task della board", "background"];

export default function perf(root) {
  const box = root.querySelector(".perf");

  const race = h("div.panel.race", {},
    h("h3", {}, "Stessa domanda, due motori"),
    h("div.lane", {}, h("span.dim", {}, "harness completo · prompt 26-34k token"), h("div.track", {}, h("i.slow")), h("b.t1", {}, "0 s")),
    h("div.lane", {}, h("span.dim", {}, "loop piccolo · prompt corto"), h("div.track", {}, h("i.fast")), h("b.t2", {}, "0 s")),
    h("p.dim", {}, "Set di domande reali: 14 giuste su 15 in 11-82 s, invece di 89-711 s."));

  const stats = h("div.stats", {},
    [["~70", "tok/s generazione", 70, 0], ["1100", "tok/s lettura prompt", 1100, 0], ["0.6 s", "per 24 s di voce", 0.6, 1, " s"], ["15/16", "domande giuste, contro 11/16", 15, 0, "/16"]]
      .map(([, label, n, d, suf = ""]) => h("div.stat", { "data-n": n, "data-d": d, "data-s": suf }, h("b", {}, "0"), h("span.dim", {}, label))));

  const segs = VRAM.map((v) => h("i", { style: { background: v.color } }));
  const vram = h("div.panel", {},
    h("h3", {}, "Memoria GPU: tutto insieme, niente swap"),
    h("div.vram", {}, segs),
    h("div.legend", {}, VRAM.map((v) => h("span", {}, h("i", { style: { background: v.color } }), `${v.k} ${v.gib} GiB`))),
    h("p.dim", {}, h("b.vtot", {}, "0"), " / 32 GiB nel caso peggiore. Vulkan invece di ROCm: 24,2 GiB invece di 27,7. Il gestore degli swap è sceso da 200 a 60 righe."));

  const queue = h("div.panel", {}, h("h3", {}, "Una sola coda per la GPU"),
    h("ol.queue", {}, QUEUE.map((q, i) => h("li", { style: { "--i": i } }, h("span", {}, q)))),
    h("p.dim", {}, "Una richiesta di una persona passa sempre davanti al lavoro di fondo."));

  const shadow = h("div.panel", {}, h("h3", {}, "Shadow mode"),
    h("div.gauge", {}, h("i.needle"), h("span.th", {}, "soglia")),
    h("p.dim", {}, "Un modello cloud legge gli stessi dati accanto a quello locale. L'accordo misura il locale prima che vada in produzione. Costo: 0,2-0,6 $ per batch orario, 0 $ se non c'è niente di nuovo."));

  box.append(race, stats, h("div.grid2", {}, vram, h("div", {}, queue, shadow)));

  return async () => {
    const slow = race.querySelector(".slow"), fast = race.querySelector(".fast");
    const t1 = race.querySelector(".t1"), t2 = race.querySelector(".t2");
    slow.style.transition = "width 4s linear"; fast.style.transition = `width ${4 * 74 / 404}s linear`;
    slow.style.width = "100%"; fast.style.width = `${(74 / 404) * 100}%`;
    countUp(t1, 404, 4000, 0, " s"); countUp(t2, 74, 4000 * 74 / 404, 0, " s");
    for (const st of stats.children) countUp(st.querySelector("b"), +st.dataset.n, 1400, +st.dataset.d, st.dataset.s);
    for (let i = 0; i < segs.length; i++) { await sleep(500); segs[i].style.width = `${(VRAM[i].gib / 32) * 100}%`; }
    countUp(vram.querySelector(".vtot"), 31.2, 900, 1);
    shadow.querySelector(".needle").classList.add("go");
    queue.querySelector(".queue").classList.add("go");
  };
}
