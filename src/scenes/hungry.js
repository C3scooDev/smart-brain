import { h, sleep } from "../util.js";

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
  const fill = side.querySelector(".fill"), pct = side.querySelector(".pct");
  fill.style.width = "62%";

  return async () => {
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
