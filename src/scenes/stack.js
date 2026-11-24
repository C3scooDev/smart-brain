import { h, sleep } from "../util.js";

const FLOW = [
  ["Canale", "WhatsApp · Telegram · Mail · Web"],
  ["Ingresso", "chi sei · ruolo · registro richieste"],
  ["Conversazione", "il messaggio entra nel suo thread · SQLite"],
  ["Router", "LLM locale: sceglie il dominio tra quelli del ruolo"],
  ["Manager di dominio", "un agente per sub-brain"],
  ["Loop di tool", "qmd · Marker Index · lettura a finestre"],
  ["Verifica", "ogni fonte citata è stata letta? copre ogni punto?"],
  ["Risposta", "stesso canale · salvata nel thread"],
];
const SIDE = [
  ["Coda GPU unica", "persona in attesa > media > task > background"],
  ["Brain in git", "Markdown · un solo scrittore · ogni modifica è un commit"],
  ["Ask tra manager", "un livello · nessun ciclo · entro i permessi di chi chiede"],
  ["Shadow mode", "un modello cloud misura il locale prima del via"],
];

export default function stack(root) {
  const box = root.querySelector(".stack-flow");
  const steps = FLOW.map(([t, d], i) => h("div.flow-step", { style: { "--i": i } }, h("span.fnum", {}, String(i + 1)), h("div", {}, h("strong", {}, t), h("span.dim.small", {}, d))));
  const sides = SIDE.map(([t, d]) => h("div.flow-side", {}, h("strong", {}, t), h("span.dim.small", {}, d)));
  const dot = h("div.packet", {}, "✉");
  const col = h("div.flow-col", {}, steps, dot);
  box.append(col, h("div.flow-sides", {}, h("span.dim.small", {}, "Sempre attivi"), sides));

  return async () => {
    for (;;) {
      for (let i = 0; i < steps.length; i++) {
        steps.forEach((s, j) => s.classList.toggle("hot", j === i));
        steps.forEach((s, j) => s.classList.toggle("past", j < i));
        dot.style.top = `${steps[i].offsetTop + steps[i].offsetHeight / 2 - 14}px`;
        if (i === 4 || i === 5) sides[i === 4 ? 2 : 0].classList.add("hot");
        else sides.forEach((s) => s.classList.remove("hot"));
        if (i === 7) sides[1].classList.add("hot");
        await sleep(1100);
      }
      await sleep(1200);
      steps.forEach((s) => s.classList.remove("hot", "past"));
      sides.forEach((s) => s.classList.remove("hot"));
    }
  };
}
