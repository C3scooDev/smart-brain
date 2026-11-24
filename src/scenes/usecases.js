import { h, sleep } from "../util.js";

// kind: me | brain | steps | ask | save | lock | sys
const CASES = {
  "Direzione": {
    head: "Smart Brain · privato · ruolo Direzione",
    script: [
      ["me", "Com'è andata la settimana? Tre righe."],
      ["steps", "legge 4 brain su 4", "ask → brain commerciale", "ask → brain tecnico", "ask → brain amministrazione"],
      ["brain", "• Commerciale: 3 offerte chiuse, il cliente di Verona è in trattativa.\n• Tecnico: 2 fermi macchina, risolti in giornata.\n• Amministrazione: incassi in linea, una fattura scaduta da 40 giorni.", ["wiki/settimana-47.md", "wiki/fermi.md", "wiki/incassi.md"]],
      ["ask", "Q1 · Il cliente di Verona è una priorità per il prossimo trimestre?", "➡️ Consiglio sì: vale il 12% del previsto."],
      ["me", "Sì, massima priorità."],
      ["save", "istinto salvato · brain commerciale", "«Verona: massima priorità nel prossimo trimestre»", "peso 0.9 · fonte: Direzione"],
    ],
  },
  "Sub-brain chiede": {
    head: "brain tecnico → Direzione · privato",
    script: [
      ["sys", "Il brain tecnico ha trovato 3 buchi nella sua memoria questa settimana."],
      ["brain", "Ciao, sono il brain tecnico. Mi servono 2 minuti per chiudere 3 domande aperte. Va bene ora?"],
      ["me", "Vai."],
      ["ask", "Q1 · La revisione del modello B passa da 6 a 12 mesi?", "➡️ Consiglio sì: zero guasti negli ultimi 2 anni."],
      ["me", "Sì."],
      ["ask", "Q2 · Chi approva gli acquisti sotto 500 €?", "➡️ Consiglio: il responsabile tecnico, come nel 2025."],
      ["me", "Il responsabile tecnico, confermo."],
      ["save", "2 istinti salvati · brain tecnico", "memoria del brain: 71% → 77%", "peso 0.9 · fonte: Direzione"],
    ],
  },
  "Nuovo assunto": {
    head: "Smart Brain · privato · ruolo Stagista",
    script: [
      ["me", "Sono nuovo. Da dove parto?"],
      ["steps", "ruolo Stagista", "router → brain persone", "lente: #onboarding"],
      ["brain", "Benvenuto! Il tuo percorso di 5 giorni:\n1. sicurezza e accessi\n2. giro dei reparti\n3. affiancamento in produzione\n4-5. primo task guidato", ["wiki/onboarding.md"]],
      ["me", "Quanto guadagna il mio responsabile?"],
      ["lock", "🔒 Il brain amministrazione non è leggibile per il ruolo Stagista. Lo applica il codice, non il prompt."],
    ],
  },
  "Gruppo del team": {
    head: "Team operativo · 8 membri · gruppo",
    script: [
      ["me", "@brain che coppia di serraggio per il modello B?", "Giulia"],
      ["brain", "10 Nm, in due passate.", ["wiki/serraggi.md"]],
      ["me", "No, da marzo sono 12 Nm. Ho aggiornato io la scheda.", "Marco · resp. tecnico"],
      ["sys", "Conflitto: 10 Nm (documento) contro 12 Nm (Marco). Vince il più competente: Marco, peso 0.9."],
      ["save", "istinto aggiornato · brain tecnico", "«modello B: 12 Nm da marzo»", "peso 0.9 · la pagina wiki viene corretta con un commit"],
      ["brain", "Grazie Marco, corretto. Giulia: 12 Nm, in due passate."],
    ],
  },
};

export default function usecases(root) {
  const box = root.querySelector(".usecases");
  const tabs = h("div.tabs");
  const head = h("div.chat-head");
  const log = h("div.chat-log.tall");
  box.append(tabs, h("div.phone.wide", { style: { "--chan": "#2aabee" } }, head, log));
  let token = 0;

  async function play(name) {
    const my = ++token;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.textContent === name));
    const c = CASES[name];
    head.replaceChildren(h("span.dot"), h("strong", {}, c.head));
    log.replaceChildren();
    for (const [kind, ...rest] of c.script) {
      if (my !== token) return;
      const [a, b, d] = rest;
      let el;
      if (kind === "steps") el = h("div.bubble.steps", {}, rest.map((t) => h("span.pill", {}, t)));
      else if (kind === "ask") el = h("div.bubble.brain.ask", {}, h("b", {}, a), h("div.rec", {}, b));
      else if (kind === "save") el = h("div.bubble.save", {}, h("b", {}, a), h("div", {}, b), h("span.dim", {}, d));
      else if (kind === "lock") el = h("div.bubble.lock", {}, a);
      else if (kind === "sys") el = h("div.bubble.sys", {}, a);
      else if (kind === "brain") el = h("div.bubble.brain", {}, h("span.who", {}, "Smart Brain"), h("div.pre", {}, a), b ? h("div.srcs", {}, b.map((f) => h("span.src", {}, f))) : null);
      else el = h("div.bubble.me", {}, b ? h("span.who", {}, b) : null, a);
      log.append(el);
      log.scrollTop = log.scrollHeight;
      await sleep(kind === "me" ? 1000 : 1500);
    }
  }

  for (const name of Object.keys(CASES)) tabs.append(h("button", { type: "button", onclick: () => play(name) }, name));
  return () => play("Direzione");
}
