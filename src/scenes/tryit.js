import { h, sleep } from "../util.js";

const TYPE_RULES = [
  ["temporale", /quando|scaden|mese|ieri|settiman|entro|data|trimestr/i, "#d996c8"],
  ["logica", /perch[eé]|se |regola|deve|posso|condizion|vale/i, "#e8b86b"],
  ["topologica", /dove|chi |collegat|reparto|zona|segue|responsabil/i, "#9fd18b"],
];
const BRAIN_RULES = [
  ["tecnico", /serragg|macchin|modello|guast|ferm|revision|manutenz|pezz/i],
  ["commerciale", /client|offert|prezz|scont|vendit|preventiv|ordin/i],
  ["amministrazione", /fattur|pagament|incass|cost|bilanc|chiusur|iva/i],
  ["persone", /ferie|assun|onboarding|turn|nuovo|formazion|stipend/i],
];
const HARD = /confront|riassum|analizz|tutt[ei] l[ei]|differenz|strategi/i;
const SUGGEST = [
  "Quando scade la revisione del modello B?",
  "Perché lo sconto non vale sotto 500 pezzi?",
  "Chi segue il cliente di Verona?",
  "Confronta le offerte di ottobre e riassumi le differenze",
];

function classify(q) {
  const type = TYPE_RULES.find(([, re]) => re.test(q)) ?? ["semantica", null, "#7fb7e8"];
  const brain = BRAIN_RULES.find(([, re]) => re.test(q))?.[0];
  return { type: type[0], color: type[2], brain, hard: HARD.test(q) || q.length > 90 };
}

export default function tryit(root) {
  const box = root.querySelector(".tryit");
  const input = h("input", { type: "text", placeholder: "Scrivi una domanda...", maxlength: 160, "aria-label": "Domanda" });
  const go = h("button.go", { type: "submit" }, "Chiedi →");
  const form = h("form.ask-form", { onsubmit: (e) => { e.preventDefault(); run(input.value.trim()); } }, input, go);
  const sugg = h("div.picks.row", {}, SUGGEST.map((q) => h("button.pick", { type: "button", onclick: () => { input.value = q; run(q); } }, q)));
  const trace = h("div.trace");
  box.append(form, sugg, trace, h("p.foot", {}, "Simulazione nel browser: il percorso è quello vero, la risposta no."));
  let token = 0;

  async function run(q) {
    if (!q) return;
    const my = ++token;
    const c = classify(q);
    trace.replaceChildren();
    const step = async (label, value, ms, color) => {
      if (my !== token) return false;
      const v = h("span.val", {}, "…");
      const row = h("div.trow", {}, h("span.tl", {}, label), v, h("span.tms", {}, ms ? `${ms} ms` : ""));
      if (color) row.style.setProperty("--c", color);
      trace.append(row);
      await sleep(450);
      v.textContent = value;
      row.classList.add("done");
      await sleep(250);
      return true;
    };
    const dm = 25 + (q.length % 20);
    if (!await step("decision model", c.hard ? "difficile → cloud (modo ibrido)" : "facile → modello locale", dm)) return;
    if (!await step("tipo di query", c.type, 0, c.color)) return;
    if (!c.brain) {
      await step("router", "nessun brain sicuro", 0);
      if (my === token) trace.append(h("div.bubble.brain.ask", {}, h("b", {}, "Domanda integrativa"), h("div.rec", {}, "Parli di un cliente, di una macchina, di soldi o di persone? Così scelgo il brain giusto.")));
      return;
    }
    if (!await step("router", `brain ${c.brain}`, 0)) return;
    if (!await step("ruolo", "Direzione · lettura ok", 0)) return;
    if (!await step("qmd", "lex · vec · hyde → RRF → rerank", 180 + (q.length * 3) % 120)) return;
    if (!await step("lente", `ramo ${c.type} · ${8 + q.length % 14} neuroni letti su 727`, 0, c.color)) return;
    if (!await step("verifica fonti", "2 su 2 lette ✓", 40)) return;
    if (my !== token) return;
    trace.append(h("div.bubble.brain", {}, h("span.who", {}, `Smart Brain · brain ${c.brain}`),
      `Qui arriva la risposta dal brain ${c.brain}, con le fonti citate e verificate.`,
      h("div.srcs", {}, h("span.src", {}, `wiki/${c.brain}.md`), h("span.src", {}, "raw/…"))));
  }

  return () => { input.value = SUGGEST[2]; run(SUGGEST[2]); };
}
