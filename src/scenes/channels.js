import { h, sleep } from "../util.js";

const CHANNELS = {
  whatsapp: { name: "WhatsApp", private: "Smart Brain", group: "Team operativo", sub: "online" },
  telegram: { name: "Telegram", private: "@smartbrain_bot", group: "Team operativo", sub: "bot" },
  mail: { name: "Mail", private: "brain@azienda.it", group: "Consegna Verona di domani", sub: "" },
};
const PEOPLE = { Giulia: "#e8b86b", Luca: "#7fb7e8", Sara: "#d996c8", Marco: "#9fd18b" };

const QUESTIONS = [
  { q: "Come si chiude la pratica di fine mese?", brain: "amministrazione", read: 2,
    a: "Tre passi: controlla i movimenti aperti, genera il riepilogo, invialo entro il 5.", src: ["procedura-chiusura.md", "wiki/fine-mese.md"] },
  { q: "Che coppia di serraggio per il modello B?", brain: "tecnico", read: 1,
    a: "12 Nm, in due passate. Il valore è cambiato a marzo: la versione vecchia diceva 10.", src: ["wiki/serraggi.md"] },
  { q: "Chi segue il cliente nuovo di Verona?", brain: "commerciale", read: 2,
    a: "Lo segue il commerciale di zona Nord-Est. Primo incontro fissato martedì.", src: ["wiki/zone.md", "raw/agenda-settimana.md"] },
];

// The brain sits in the group like an extra colleague: it listens, learns, answers when called, asks when unsure.
const GROUP = [
  ["msg", "Giulia", "Domani c'è la consegna di Verona. Chi carica il camion?"],
  ["msg", "Luca", "Io, ma mi serve il DDT pronto entro le 8."],
  ["msg", "Sara", "Il DDT lo preparo io stasera."],
  ["learn", "ha imparato: consegne Verona → DDT preparato da Sara la sera prima", "peso 0.6"],
  ["msg", "Giulia", "@brain quanti bancali erano l'ultima volta?", true],
  ["brain", "4 bancali, consegna del 12 novembre. Luca li aveva caricati in 40 minuti.", ["raw/consegne-nov.md"]],
  ["ask", "Una domanda per il team: il DDT va sempre preparato la sera prima per Verona, o solo questa volta?"],
  ["msg", "Sara", "Sempre, il cliente lo vuole in anticipo."],
  ["save", "istinto salvato · brain commerciale", "«Verona: DDT sempre la sera prima»", "peso 0.8 · fonte: Sara, chi lo fa"],
];

export default function channels(root) {
  const box = root.querySelector(".channels");
  let channel = "whatsapp", group = false, token = 0;

  const tabs = h("div.tabs");
  const modes = h("div.tabs.small");
  const log = h("div.chat-log");
  const head = h("div.chat-head");
  const picks = h("div.picks");
  const side = h("div.chan-side", {}, picks);
  const phone = h("div.phone.ch", {}, head, log);
  box.append(h("div.chan-top", {}, tabs, modes), h("div.chan-body", {}, phone, side));

  const now = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const meta = (mine) => h("span.meta", {}, now(), mine && channel === "whatsapp" ? h("span.ticks", {}, " ✓✓") : null);
  const post = (el) => { log.append(el); log.scrollTop = log.scrollHeight; return el; };

  // One message, drawn in the style of the current channel.
  function message({ who, text, mine, brain, src, ask }) {
    if (channel === "mail") {
      const from = brain ? "Smart Brain <brain@azienda.it>" : `${who ?? "Giulia"} <${(who ?? "giulia").toLowerCase()}@azienda.it>`;
      return post(h(`div.mail${brain ? ".from-brain" : ""}${ask ? ".ask" : ""}`, {},
        h("div.mail-head", {}, h("b", {}, from), h("span.dim", {}, now())),
        h("div.mail-to.dim", {}, group ? "A: team-operativo@azienda.it · Cc: brain@azienda.it" : `A: ${brain ? "giulia@azienda.it" : "brain@azienda.it"}`),
        h("div.mail-body", {}, text),
        src ? h("div.mail-att", {}, src.map((f) => h("span.src", {}, `📎 ${f}`))) : null,
        brain ? h("div.sig.dim", {}, "— Smart Brain · risponde dai documenti, cita le fonti") : null));
    }
    const cls = brain ? "brain" : mine ? "me" : "other";
    const el = h(`div.bubble.${cls}${ask ? ".ask" : ""}`, {},
      who && !mine ? h("span.who", { style: { color: PEOPLE[who] ?? "var(--accent)" } }, who) : brain ? h("span.who", {}, "Smart Brain") : null,
      h("div.pre", {}, text),
      src ? h("div.srcs", {}, src.map((f) => h("span.src", {}, f))) : null,
      meta(mine));
    if (brain && channel === "telegram") {
      el.append(h("div.kbd", {}, h("span", {}, "📄 Apri fonti"), h("span", {}, "👍"), h("span", {}, "👎")));
    }
    return post(el);
  }

  async function thinking(steps, my) {
    const box = post(channel === "mail" ? h("div.mail-wait.dim", {}, "Smart Brain sta preparando la risposta…") : h("div.bubble.steps"));
    const timer = h("span.timer", {}, "0.0 s");
    const t0 = performance.now();
    const tick = setInterval(() => { timer.textContent = `${((performance.now() - t0) / 1000).toFixed(1)} s`; }, 100);
    if (channel !== "mail") box.append(timer);
    for (const st of steps) {
      if (my !== token) break;
      if (channel !== "mail") box.insertBefore(h("span.pill", {}, st), timer);
      log.scrollTop = log.scrollHeight;
      await sleep(480);
    }
    clearInterval(tick);
    if (channel === "mail") box.remove(); else timer.textContent += " · demo accelerata";
  }

  async function ask(item) {
    const my = ++token;
    log.replaceChildren();
    message({ text: item.q, mine: true, who: "Giulia" });
    await sleep(450);
    await thinking(["ruolo verificato", `router → brain ${item.brain}`, "qmd + Marker Index", `letti ${item.read} documenti`, "fonti verificate ✓"], my);
    if (my !== token) return;
    message({ brain: true, text: item.a, src: item.src });
  }

  async function playGroup() {
    const my = ++token;
    log.replaceChildren();
    for (const [kind, a, b, c] of GROUP) {
      if (my !== token) return;
      if (kind === "msg") message({ who: a, text: b, mine: a === "Giulia" && channel !== "mail" });
      else if (kind === "learn") post(h("div.learn", {}, "📌 Smart Brain ", a, h("span.dim", {}, ` · ${b}`)));
      else if (kind === "brain") { await thinking(["brain commerciale", "qmd + Marker Index"], my); message({ brain: true, text: a, src: b }); }
      else if (kind === "ask") message({ brain: true, ask: true, text: a });
      else if (kind === "save") post(h("div.bubble.save", {}, h("b", {}, a), h("div", {}, b), h("span.dim", {}, c)));
      await sleep(kind === "learn" ? 1600 : 1300);
    }
  }

  function render() {
    const c = CHANNELS[channel];
    phone.className = `phone ch ch-${channel}`;
    head.replaceChildren(
      h("span.avatar", {}, group ? "👥" : "🧠"),
      h("div", {}, h("strong", {}, group ? c.group : c.private),
        h("div.dim.small", {}, group ? (channel === "mail" ? "Giulia, Luca, Sara · Cc: Smart Brain" : "Giulia, Luca, Sara, Smart Brain") : c.sub)));
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === channel));
    modes.querySelectorAll("button").forEach((b) => b.classList.toggle("on", (b.dataset.k === "g") === group));
    picks.replaceChildren(...(group
      ? [h("p.dim", {}, "Nel gruppo il brain è un collega in più. Ascolta, impara in silenzio, risponde quando lo chiami e fa domande se qualcosa non torna."),
        h("button.pick", { type: "button", onclick: playGroup }, "↻ Rivedi la conversazione")]
      : [h("p.dim", {}, "Tocca una domanda:"), ...QUESTIONS.map((it) => h("button.pick", { type: "button", onclick: () => ask(it) }, it.q))]));
    group ? playGroup() : ask(QUESTIONS[0]);
  }
  for (const [k, c] of Object.entries(CHANNELS)) {
    tabs.append(h("button", { type: "button", "data-k": k, onclick: () => { channel = k; render(); } }, c.name));
  }
  modes.append(
    h("button", { type: "button", "data-k": "p", onclick: () => { group = false; render(); } }, "Privato"),
    h("button", { type: "button", "data-k": "g", onclick: () => { group = true; render(); } }, "Gruppo"));

  return () => render();
}
