import { h, s, sleep, countUp } from "../util.js";

// Brain coverage (% of the questions it answers from its own memory), day by day.
const WITHOUT = [20, 27, 32, 36, 39, 42, 44, 46, 47, 48, 49];
const WITH = [20, 38, 52, 63, 71, 77, 81, 84, 86, 88, 89];

function chart() {
  const W = 520, H = 220, P = 30;
  const X = (i) => P + (i / (WITH.length - 1)) * (W - P * 2), Y = (v) => H - P - (v / 100) * (H - P * 1.6);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "growth" });
  for (const v of [25, 50, 75, 100]) {
    svg.append(s("line", { x1: P, x2: W - P, y1: Y(v), y2: Y(v), class: "grid" }));
    const t = s("text", { x: 2, y: Y(v) + 4, class: "axis" }); t.textContent = `${v}%`; svg.append(t);
  }
  const line = (data, cls) => {
    const el = s("polyline", { points: data.map((v, i) => `${X(i)},${Y(v)}`).join(" "), class: cls, pathLength: 1 });
    svg.append(el);
    return el;
  };
  const a = line(WITHOUT, "l-without"), b = line(WITH, "l-with");
  const ta = s("text", { x: X(10) - 4, y: Y(49) + 18, class: "lab dim", "text-anchor": "end" }); ta.textContent = "senza grill";
  const tb = s("text", { x: X(10) - 4, y: Y(89) - 10, class: "lab acc", "text-anchor": "end" }); tb.textContent = "con grill";
  const xl = s("text", { x: W / 2, y: H - 6, class: "axis", "text-anchor": "middle" }); xl.textContent = "giorni di uso";
  svg.append(ta, tb, xl);
  return { svg, lines: [a, b] };
}

const SCRIPT = [
  ["me", "Preparami l'offerta per il cliente di Verona."],
  ["brain", "Ho trovato il listino e l'offerta simile di marzo. Mi manca un pezzo:"],
  ["ask", "Q1 · Lo sconto volume vale anche sopra 500 pezzi?", "➡️ Consiglio sì, come nell'offerta di marzo."],
  ["me", "Sì, ma massimo 8%."],
  ["save", "istinto salvato · brain commerciale", "«sconto volume max 8% sopra 500 pezzi»", "peso 0.8 · fonte: Commerciale, competente"],
  ["brain", "Bozza pronta. Cito il listino e l'offerta di marzo. Ti faccio altre 2 domande per completare il brain?"],
  ["ask", "Q2 · Il cliente paga a 60 giorni come gli altri della zona?", "➡️ Consiglio sì: 9 clienti su 10 nella zona."],
];

export default function hungry(root) {
  const box = root.querySelector(".hungry");
  const log = h("div.chat-log.tall");
  const side = h("div.grill", {},
    h("strong", {}, "Skill «grill me»"),
    h("ol", {},
      h("li", {}, "Trova il buco nella memoria mentre lavora."),
      h("li", {}, "Fa domande numerate, ognuna con la risposta consigliata."),
      h("li", {}, "Salva la risposta come istinto, con il peso di chi la dà."),
      h("li", {}, "Un istinto confermato sale, uno smentito scende.")),
    h("div.meter", {}, h("span.dim", {}, "memoria del brain"), h("div.bar", {}, h("i.fill")), h("span.pct", {}, "62%")));
  box.append(h("div.phone", { style: { "--chan": "#25d366" } }, h("div.chat-head", {}, h("span.dot"), h("strong", {}, "Smart Brain"), h("span.dim", {}, " · task in corso")), log), side);
  const g = chart();
  const kpis = [["domande senza risposta", 31, 9, "%"], ["giorni per arrivare all'80%", 21, 6, ""], ["istinti salvati a settimana", 4, 23, ""]]
    .map(([label, from, to, suf]) => ({ el: h("div.kpi", {}, h("span.dim", {}, label), h("span", {}, h("s.dim", {}, `${from}${suf}`), " → ", h("b", {}, `0${suf}`))), to, suf }));
  box.append(h("div.growth-box", {}, h("div", {}, h("h3", {}, "Quanto risponde il brain dalla sua memoria"), g.svg, h("p.foot", {}, "Valori illustrativi.")), h("div.kpis", {}, kpis.map((k) => k.el))));
  const fill = side.querySelector(".fill"), pct = side.querySelector(".pct");
  fill.style.width = "62%";

  return async () => {
    g.lines.forEach((l) => l.classList.add("draw"));
    kpis.forEach((k) => countUp(k.el.querySelector("b"), k.to, 1800, 0, k.suf));
    let mem = 62;
    for (const [kind, a, b, c] of SCRIPT) {
      const el = kind === "save"
        ? h("div.bubble.save", {}, h("b", {}, a), h("div", {}, b), h("span.dim", {}, c))
        : kind === "ask"
          ? h("div.bubble.brain.ask", {}, h("b", {}, a), h("div.rec", {}, b))
          : h(`div.bubble.${kind}`, {}, a);
      log.append(el);
      log.scrollTop = log.scrollHeight;
      if (kind === "save") { mem = 71; fill.style.width = `${mem}%`; pct.textContent = `${mem}%`; }
      await sleep(kind === "me" ? 900 : 1300);
    }
  };
}
