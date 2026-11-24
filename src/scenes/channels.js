import { h, sleep } from "../util.js";

const CHANNELS = {
  whatsapp: { name: "WhatsApp", color: "#25d366" },
  telegram: { name: "Telegram", color: "#2aabee" },
  mail: { name: "Mail", color: "#d97757" },
};

const QUESTIONS = [
  { q: "Come si chiude la pratica di fine mese?", brain: "amministrazione", read: 2,
    a: "Tre passi: controlla i movimenti aperti, genera il riepilogo, invialo entro il 5.", src: ["procedura-chiusura.md", "wiki/fine-mese.md"] },
  { q: "Che coppia di serraggio per il modello B?", brain: "tecnico", read: 1,
    a: "12 Nm, in due passate. Il valore è cambiato a marzo: la versione vecchia diceva 10.", src: ["wiki/serraggi.md"] },
  { q: "Chi segue il cliente nuovo di Verona?", brain: "commerciale", read: 2,
    a: "Lo segue il commerciale di zona Nord-Est. Primo incontro fissato martedì.", src: ["wiki/zone.md", "raw/agenda-settimana.md"] },
];

export default function channels(root) {
  const box = root.querySelector(".channels");
  let channel = "whatsapp", group = false, busy = false;

  const tabs = h("div.tabs");
  const modes = h("div.tabs.small");
  const log = h("div.chat-log");
  const head = h("div.chat-head");
  const picks = h("div.picks");
  const phone = h("div.phone", {}, head, log);
  box.append(h("div.chan-top", {}, tabs, modes), h("div.chan-body", {}, phone, picks));

  const render = () => {
    const c = CHANNELS[channel];
    phone.style.setProperty("--chan", c.color);
    head.replaceChildren(h("span.dot"), h("strong", {}, group ? "Team operativo" : "Smart Brain"),
      h("span.dim", {}, group ? " · 8 membri · brain nel gruppo" : ` · ${c.name} · privato`));
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === channel));
    modes.querySelectorAll("button").forEach((b) => b.classList.toggle("on", (b.dataset.k === "g") === group));
  };
  for (const [k, c] of Object.entries(CHANNELS)) {
    tabs.append(h("button", { type: "button", "data-k": k, onclick: () => { channel = k; log.replaceChildren(); render(); } }, c.name));
  }
  modes.append(
    h("button", { type: "button", "data-k": "p", onclick: () => { group = false; log.replaceChildren(); render(); } }, "Privato"),
    h("button", { type: "button", "data-k": "g", onclick: () => { group = true; log.replaceChildren(); render(); } }, "Gruppo"));

  const bubble = (cls, ...kids) => {
    const b = h(`div.bubble.${cls}`, {}, ...kids);
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b;
  };

  async function ask(item) {
    if (busy) return;
    busy = true;
    const mail = channel === "mail";
    const text = group ? `@brain ${item.q}` : item.q;
    bubble("me", group ? h("span.who", {}, "Giulia") : null, mail ? h("span.subj", {}, "Oggetto: domanda veloce") : null, text);
    await sleep(400);
    const steps = bubble("steps");
    const t0 = performance.now();
    const timer = h("span.timer", {}, "0.0 s");
    steps.append(timer);
    const tick = setInterval(() => { timer.textContent = `${((performance.now() - t0) / 1000).toFixed(1)} s`; }, 100);
    for (const st of ["ruolo verificato", `router → brain ${item.brain}`, "qmd: lex · vec · hyde", `letti ${item.read} documenti`, "fonti verificate ✓"]) {
      steps.insertBefore(h("span.pill", {}, st), timer);
      log.scrollTop = log.scrollHeight;
      await sleep(520);
    }
    clearInterval(tick);
    timer.textContent += " · demo accelerata";
    bubble("brain", h("span.who", {}, "Smart Brain"), item.a, h("div.srcs", {}, item.src.map((f) => h("span.src", {}, f))));
    busy = false;
  }

  QUESTIONS.forEach((it) => picks.append(h("button.pick", { type: "button", onclick: () => ask(it) }, it.q)));
  render();
  return () => ask(QUESTIONS[0]);
}
