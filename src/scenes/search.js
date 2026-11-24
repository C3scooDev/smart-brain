import { h, sleep } from "../util.js";

const QUERY = "come chiudo la pratica di fine mese?";
const LANES = [
  { k: "lex", how: "BM25 · parole chiave", sub: "chiusura pratica fine mese", hits: ["procedura-chiusura", "fine-mese", "scadenze"] },
  { k: "vec", how: "vettori · embeddinggemma 300M", sub: "procedura mensile di chiusura", hits: ["fine-mese", "riepilogo-mensile", "procedura-chiusura"] },
  { k: "hyde", how: "risposta ipotetica → vettore", sub: "«a fine mese si controllano i movimenti aperti…»", hits: ["movimenti-aperti", "fine-mese", "riepilogo-mensile"] },
];
const FINAL = ["fine-mese", "procedura-chiusura", "riepilogo-mensile", "movimenti-aperti", "scadenze"];

export default function search(root) {
  const box = root.querySelector(".search");
  const q = h("div.q", {}, h("span.dim", {}, "query "), h("strong", {}, QUERY));
  const exp = h("div.stage", {}, h("span.model", {}, "espansione · qmd-query-expansion 1.7B"));
  const lanes = LANES.map((l) => {
    const hits = h("div.hits");
    const el = h(`div.lane.${l.k}`, {}, h("div.lane-head", {}, h("b", {}, l.k), h("span.dim", {}, l.how)), h("div.sub", {}, l.sub), hits);
    return { l, el, hits };
  });
  const fuse = h("div.stage", {}, h("span.model", {}, "fusione RRF · k = 60 · query originale × 2 · top 30"));
  const rerank = h("div.stage", {}, h("span.model", {}, "rerank · qwen3-reranker 0.6B"),
    h("div.blend", {}, ["1-3", "4-10", "11+"].map((r, i) => h("div.mix", {}, h("span.dim", {}, `pos. ${r}`),
      h("div.mixbar", {}, h("i.rrf", { style: { width: `${[75, 60, 40][i]}%` } }), h("i.rr", { style: { width: `${[25, 40, 60][i]}%` } }))))));
  const result = h("ol.result");
  box.append(q, exp, h("div.lanes", {}, lanes.map((x) => x.el)), fuse, rerank, result,
    h("p.foot", {}, "Modelli di default di qmd, tutti in locale su llama.cpp Vulkan. La ricerca parte alla prima richiesta e libera la memoria dopo 10 minuti senza uso."));

  const steps = [q, exp, ...lanes.map((x) => x.el), fuse, rerank, result];
  steps.forEach((e) => e.classList.add("wait"));

  return async () => {
    for (const e of [q, exp]) { e.classList.remove("wait"); await sleep(500); }
    lanes.forEach((x) => x.el.classList.remove("wait"));
    for (let i = 0; i < 3; i++) {
      for (const x of lanes) x.hits.append(h("span.hit", {}, x.l.hits[i]));
      await sleep(350);
    }
    fuse.classList.remove("wait"); await sleep(600);
    rerank.classList.remove("wait"); await sleep(700);
    result.classList.remove("wait");
    for (const f of FINAL) { result.append(h("li", {}, f + ".md")); await sleep(200); }
  };
}
