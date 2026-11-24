import { h, s, sleep } from "../util.js";

const DOMAINS = {
  commerciale: { color: "#e8b86b", docs: ["listino-2026", "listino-2025", "offerta-verona", "offerta-milano", "sconti-2024", "condizioni-urgenza", "clienti-nord-est", "contratto-quadro", "agenda", "preventivi-ott", "fiere-2026", "resi"] },
  tecnico: { color: "#7fb7e8", docs: ["serraggi", "revisione-b", "fermi", "manuale-b", "manuale-c", "ricambi", "sicurezza", "collaudo", "tarature", "guasti-2025", "magazzino", "logistica-urgenze"] },
  amministrazione: { color: "#9fd18b", docs: ["fine-mese", "incassi", "fatture-scadute", "iva", "costi-trasporto", "budget-2026", "note-credito", "fornitori", "bilancio-2025", "cespiti", "banche", "sconti-contabili"] },
  persone: { color: "#d996c8", docs: ["onboarding", "turni-dic", "ferie", "formazione", "organigramma", "corsi-sicurezza", "premi", "valutazioni", "regolamento", "smart-working", "mensa", "contatti"] },
};
const QUESTION = "Il cliente di Verona può avere lo sconto dell'8% su una consegna urgente?";
const USEFUL = ["listino-2026", "offerta-verona", "condizioni-urgenza"];
const PREFILL = 1100;   // tok/s, measured prompt reading speed of the local model
const DOC_TOK = 1500, SUM_TOK = 800;

const STACKS = [
  {
    k: "rag", name: "RAG classico", how: "un indice unico · top-12 per somiglianza",
    sums: [],
    read: ["sconti-2024", "offerta-milano", "listino-2025", "offerta-verona", "sconti-contabili", "costi-trasporto", "logistica-urgenze", "clienti-nord-est", "preventivi-ott", "listino-2026", "note-credito", "fatture-scadute"],
    verdict: ["bad", "✗ Sbagliata: «sì, 10%». Usa sconti-2024, che è superato, e non trova le condizioni d'urgenza."],
  },
  {
    k: "mono", name: "Mono brain", how: "una wiki unica · sintesi di tutto il brain",
    sums: ["sintesi globale", "sintesi commerciale", "sintesi tecnico", "sintesi amministrazione"],
    read: ["listino-2025", "listino-2026", "sconti-2024", "offerta-milano", "offerta-verona", "sconti-contabili", "costi-trasporto", "logistica-urgenze", "contratto-quadro", "condizioni-urgenza", "resi", "note-credito", "clienti-nord-est", "fiere-2026", "magazzino", "fornitori"],
    verdict: ["warn", "✓ Corretta: «sì, max 8%, con supplemento d'urgenza». Ma ha letto 4 sintesi e 16 documenti di 3 domini."],
  },
  {
    k: "smart", name: "Smart Brain", how: "router → sub-brain commerciale · Marker Index #logico",
    sums: ["sintesi commerciale"],
    read: ["offerta-verona", "listino-2026", "condizioni-urgenza"],
    verdict: ["good", "✓ Corretta, fonti verificate: «sì, max 8% (istinto 0.8), più il 5% di supplemento d'urgenza»."],
  },
];

// Illustrative scaling: documents read per answer, and correct answers, as the corpus grows.
const SIZES = [50, 200, 1000, 5000];
const SCALE_READ = { rag: [12, 12, 12, 12], mono: [20, 34, 58, 95], smart: [4, 5, 6, 7] };
const SCALE_OK = { rag: [80, 71, 62, 54], mono: [92, 90, 87, 83], smart: [95, 95, 94, 94] };
const COLORS = { rag: "#7fb7e8", mono: "#8b8a84", smart: "#d97757" };

const TABLE = [
  ["Documenti letti per risposta", "12, fissi", "cresce con il brain", "pochi, solo il sub-brain giusto"],
  ["Fonti verificate", "no", "a volte", "sì, nel codice"],
  ["Documenti superati", "li confonde", "li trova, a fatica", "un solo scrittore li aggiorna"],
  ["Permessi", "no", "tutto o niente", "per ruolo e per brain"],
  ["Più utenti", "sì", "si contraddicono", "sì, con il peso di chi è competente"],
  ["Impara dalle persone", "no", "no", "sì, con il grill e gli istinti"],
  ["Indice da rifare dopo una modifica", "tutto", "tutto", "solo il sub-brain toccato"],
];

function lineChart(title, series, yMax, suffix = "") {
  const W = 420, H = 210, P = 34;
  const X = (i) => P + (i / (SIZES.length - 1)) * (W - P * 1.6), Y = (v) => H - P - (v / yMax) * (H - P * 1.7);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "growth" });
  for (const v of [0, yMax / 2, yMax]) {
    svg.append(s("line", { x1: P, x2: W - P * 0.6, y1: Y(v), y2: Y(v), class: "grid" }));
    const t = s("text", { x: 2, y: Y(v) + 4, class: "axis" }); t.textContent = `${v}${suffix}`; svg.append(t);
  }
  SIZES.forEach((n, i) => { const t = s("text", { x: X(i), y: H - 8, class: "axis", "text-anchor": "middle" }); t.textContent = n; svg.append(t); });
  const lines = Object.entries(series).map(([k, data]) => {
    const el = s("polyline", { points: data.map((v, i) => `${X(i)},${Y(v)}`).join(" "), pathLength: 1, style: `stroke:${COLORS[k]}` });
    svg.append(el);
    return el;
  });
  return { el: h("div.chart", {}, h("h3", {}, title), svg, h("span.dim.small", {}, "documenti nel corpus →")), lines };
}

export default function example(root) {
  const box = root.querySelector(".example");
  const all = Object.entries(DOMAINS).flatMap(([d, v]) => v.docs.map((n) => ({ n, d })));

  const cols = STACKS.map((st) => {
    const tiles = new Map();
    const grid = h("div.docgrid", {}, all.map(({ n, d }) => {
      const t = h("span.doc", { style: { "--c": DOMAINS[d].color }, title: `${d}/${n}.md` });
      tiles.set(n, t);
      return t;
    }));
    const sums = h("div.sums");
    const stats = { seen: h("b", {}, "0"), useful: h("b", {}, "0/3"), conf: h("b.conf", {}, "–"), sec: h("b", {}, "0 s") };
    const verdict = h("div.verdict-box");
    const el = h(`div.stack.${st.k}`, {},
      h("div.stack-head", {}, h("strong", {}, st.name), h("span.dim.small", {}, st.how)),
      sums, grid,
      h("div.stack-stats", {},
        h("span", {}, h("span.dim", {}, "visti "), stats.seen),
        h("span", {}, h("span.dim", {}, "utili "), stats.useful),
        h("span", {}, h("span.dim", {}, "tempo "), stats.sec)),
      h("div.confbox", {}, h("span.dim", {}, "tasso di confusione"), stats.conf),
      verdict);
    return { st, el, tiles, sums, stats, verdict };
  });

  const readChart = lineChart("Documenti letti per risposta", SCALE_READ, 100);
  const okChart = lineChart("Risposte corrette", SCALE_OK, 100, "%");
  const legend = h("div.legend.row.center", {}, STACKS.map((st) => h("span", {}, h("i", { style: { background: COLORS[st.k] } }), st.name)));
  const table = h("table.tbl.cmp-table", {},
    h("thead", {}, h("tr", {}, h("th", {}, ""), ...STACKS.map((st) => h("th", {}, st.name)))),
    h("tbody", {}, TABLE.map(([a, ...v]) => h("tr", {}, h("td", {}, a), ...v.map((x, i) => h(`td${i === 2 ? ".win" : ".dim"}`, {}, x))))));
  const why = h("div.why", {}, h("h3", {}, "Perché tanti sub-brain battono un mega brain"),
    h("ol", {},
      h("li", {}, "Il router sceglie il dominio prima di cercare: la ricerca parte da 12 documenti, non da 48 o da 5000."),
      h("li", {}, "Un solo agente scrive ogni sub-brain: quando un documento è superato, lo aggiorna lui. Niente versioni in conflitto."),
      h("li", {}, "Ogni sub-brain ha i suoi esperti: un istinto pesa di più se arriva da chi è competente in quel dominio."),
      h("li", {}, "Permessi e reindicizzazione sono per sub-brain: una modifica non tocca il resto.")));
  const playBtn = h("button.ctrl", { type: "button", onclick: () => run() }, "▶ rigioca");

  box.append(
    h("div.question", {}, h("span.dim", {}, "La domanda · "), h("strong", {}, QUESTION), playBtn),
    h("p.dim.small.center", {}, `Corpus finto: 48 documenti in 4 domini. Il percorso utile è di 3 documenti: ${USEFUL.join(" → ")}.`),
    h("div.stacks", {}, cols.map((c) => c.el)),
    h("p.foot", {}, "Tasso di confusione = documenti visti ÷ documenti del percorso utile (3). Più è vicino a 1, meno il modello si perde. Tempo = token letti ÷ 1100 tok/s, la velocità misurata del modello locale."),
    h("div.charts", {}, readChart.el, okChart.el), legend,
    h("p.foot", {}, "Grafici illustrativi: come cambiano le tre architetture quando il corpus cresce."),
    h("div.grid2", {}, h("div", {}, table), why));

  let token = 0;
  async function run() {
    const my = ++token;
    for (const c of cols) {
      c.tiles.forEach((t) => t.classList.remove("seen", "ok"));
      c.sums.replaceChildren(); c.verdict.replaceChildren(); c.el.classList.remove("done");
      c.stats.seen.textContent = "0"; c.stats.useful.textContent = "0/3"; c.stats.conf.textContent = "–"; c.stats.sec.textContent = "0 s";
    }
    readChart.lines.concat(okChart.lines).forEach((l) => l.classList.remove("draw"));
    const queues = cols.map((c) => [...c.st.sums.map((n) => ({ sum: n })), ...c.st.read.map((n) => ({ doc: n }))]);
    const state = cols.map(() => ({ seen: 0, ok: 0, tok: 0 }));
    for (let step = 0; queues.some((q) => q.length); step++) {
      if (my !== token) return;
      cols.forEach((c, i) => {
        const item = queues[i].shift();
        if (!item) {
          if (!c.el.classList.contains("done")) finish(c, state[i]);
          return;
        }
        const st = state[i];
        st.seen++;
        if (item.sum) { st.tok += SUM_TOK; c.sums.append(h("span.sum", {}, `📑 ${item.sum}`)); }
        else {
          st.tok += DOC_TOK;
          const ok = USEFUL.includes(item.doc);
          c.tiles.get(item.doc).classList.add("seen", ...(ok ? ["ok"] : []));
          if (ok) st.ok++;
        }
        c.stats.seen.textContent = st.seen;
        c.stats.useful.textContent = `${st.ok}/3`;
        c.stats.sec.textContent = `${(st.tok / PREFILL).toFixed(1)} s`;
        c.stats.conf.textContent = (st.seen / USEFUL.length).toFixed(1);
      });
      await sleep(420);
    }
    cols.forEach((c, i) => { if (!c.el.classList.contains("done")) finish(c, state[i]); });
    await sleep(600);
    readChart.lines.concat(okChart.lines).forEach((l) => l.classList.add("draw"));
  }
  function finish(c, st) {
    c.el.classList.add("done");
    c.verdict.className = `verdict-box ${c.st.verdict[0]}`;
    c.verdict.textContent = c.st.verdict[1];
    c.stats.conf.classList.toggle("low", st.seen / USEFUL.length < 2);
  }

  return () => run();
}
