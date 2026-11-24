import { h, sleep } from "../util.js";

// where: which modes run this role on the local machine
const MODELS = [
  { role: "Ragionamento", name: "Qwen 3.6 35B-A3B", spec: "MoE, 3B attivi · GGUF · 128k × 4 slot", stat: "24,2 GiB · 70 tok/s", cloud: "Claude / GPT via API", local: ["locale", "ibrido"] },
  { role: "Visione", name: "D1", spec: "foto e documenti · doppia lettura con accordo", stat: "~2 GiB · ~1 s a foto *", cloud: "modello cloud multimodale", local: ["locale", "ibrido"] },
  { role: "Decisioni veloci", name: "Decision model", spec: "classificatore sì/no con confidenza calibrata", stat: "~0,3B · < 50 ms *", cloud: null, local: ["locale", "ibrido", "cloud"] },
  { role: "Embedding", name: "embeddinggemma 300M", spec: "Q8_0 · vettori per qmd", stat: "~300 MB", cloud: null, local: ["locale", "ibrido", "cloud"] },
  { role: "Rerank", name: "qwen3-reranker 0.6B", spec: "Q8_0 · riordina i 30 migliori", stat: "~640 MB", cloud: null, local: ["locale", "ibrido", "cloud"] },
  { role: "Espansione query", name: "qmd-query-expansion 1.7B", spec: "Q4_K_M · scrive lex, vec, hyde", stat: "~1,1 GB", cloud: null, local: ["locale", "ibrido", "cloud"] },
  { role: "Voce", name: "Whisper offline", spec: "Vulkan · note vocali da chat", stat: "2,9 GiB · 24 s in 0,6 s", cloud: "trascrizione cloud", local: ["locale", "ibrido"] },
];

const MODES = {
  locale: "Tutto sul mini PC. Nessun dato esce, 0 € per token. 31,2 GiB su 32 nel caso peggiore.",
  ibrido: "Il decision model manda le domande facili al modello locale e quelle difficili al cloud. Indice e documenti restano a casa: al cloud vanno solo i passaggi scelti.",
  cloud: "Ragionamento e visione nel cloud, per chi non ha una GPU. Ricerca, indice e decisioni restano locali.",
};

const ROUTED = [
  ["Che coppia di serraggio per il modello B?", "locale", 31],
  ["Riassumi le 40 mail del cliente di ottobre", "cloud", 44],
  ["Chi segue il cliente di Verona?", "locale", 27],
  ["Confronta i 3 contratti e trova le differenze", "cloud", 38],
  ["Leggi l'etichetta in questa foto", "locale", 35],
];

export default function models(root) {
  const box = root.querySelector(".models");
  let mode = "locale";
  const tabs = h("div.tabs");
  const desc = h("p.mode-desc");
  const grid = h("div.model-grid");
  const cards = MODELS.map((m) => {
    const where = h("span.where");
    const name = h("strong");
    const card = h("div.model-card", {}, h("div.role", {}, m.role, where), name, h("span.dim.spec", {}, m.spec), h("span.mstat", {}, m.stat));
    grid.append(card);
    return { m, card, where, name };
  });
  const lanes = { locale: h("div.bucket", {}, h("b", {}, "locale")), cloud: h("div.bucket", {}, h("b", {}, "cloud")) };
  const router = h("div.router", {}, h("div.dm", {}, "decision model"), h("div.buckets", {}, lanes.locale, lanes.cloud));
  for (const k of Object.keys(MODES)) tabs.append(h("button", { type: "button", "data-k": k, onclick: () => set(k) }, k[0].toUpperCase() + k.slice(1)));
  box.append(tabs, desc, grid, router, h("p.foot", {}, "* valori illustrativi. Gli altri sono misurati sullo stack reale."));

  function set(k) {
    mode = k;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
    desc.textContent = MODES[k];
    for (const { m, card, where, name } of cards) {
      const local = m.local.includes(k);
      const hybridCloud = k === "ibrido" && m.cloud;
      where.textContent = local ? (hybridCloud ? "locale + cloud" : "locale") : "cloud";
      card.classList.toggle("is-cloud", !local);
      name.textContent = local ? m.name : m.cloud;
    }
    router.classList.toggle("show", k === "ibrido");
    if (k === "ibrido") route();
  }

  let routing = 0;
  async function route() {
    const my = ++routing;
    lanes.locale.querySelectorAll(".q").forEach((e) => e.remove());
    lanes.cloud.querySelectorAll(".q").forEach((e) => e.remove());
    for (const [q, where, ms] of ROUTED) {
      if (my !== routing || mode !== "ibrido") return;
      lanes[where].append(h("div.q", {}, q, h("span.ms", {}, ` ${ms} ms`)));
      await sleep(700);
    }
  }

  set("locale");
  return async () => {
    await sleep(2500);
    if (mode === "locale") set("ibrido");
  };
}
