import { h, sleep } from "../util.js";

const DONE = [
  "Sub-brain specializzati con un solo scrittore",
  "Marker Index e ricerca ibrida con qmd",
  "WhatsApp, Telegram, mail e web",
  "Permessi per ruolo e istinti pesati",
  "Grill per costruire la memoria",
  "Tutto locale su un mini PC",
];
const MILESTONES = [
  {
    when: "Dicembre 2026", title: "Documenti Office in locale", tag: "privacy assoluta",
    todos: [
      "OCR locale per i PDF scansionati: testo e tabelle diventano Markdown nel brain",
      "Word: legge e scrive i .docx",
      "PowerPoint: legge i .pptx e prepara bozze di slide",
      "Excel e gli altri strumenti Office: legge i fogli e le tabelle",
      "Nessun file esce dalla macchina, nemmeno per la conversione",
    ],
  },
  {
    when: "1-15 gennaio 2027", title: "Fast deploy one-click", tag: "pronto in minuti",
    todos: [
      "Un solo comando installa tutto",
      "Rileva la GPU e sceglie i modelli che ci stanno",
      "Una procedura guidata crea i brain e collega i canali",
      "Aggiornamenti con un clic, con ritorno alla versione prima",
    ],
  },
];

export default function roadmap(root) {
  const box = root.querySelector(".roadmap");
  const fill = h("i.rm-fill");
  const done = h("div.rm-col.done", {}, h("div.rm-when", {}, "Oggi"), h("h3", {}, "Fatto"),
    h("ul.todos", {}, DONE.map((t) => h("li", {}, h("span.box", {}), t))));
  const cols = MILESTONES.map((m, i) => h("div.rm-col", {},
    h("div.rm-when", {}, h("span.mark", {}, `M${i + 1}`), m.when),
    h("h3", {}, m.title), h("span.rm-tag", {}, m.tag),
    h("ul.todos", {}, m.todos.map((t) => h("li", {}, h("span.box", {}), t)))));
  box.append(h("div.rm-track", {}, fill, h("span.dot.d0"), h("span.dot.d1"), h("span.dot.d2")), h("div.rm-cols", {}, done, cols));

  return async () => {
    fill.style.width = "4%";
    for (const li of done.querySelectorAll("li")) { li.classList.add("checked"); await sleep(260); }
    fill.style.width = "50%";
    await sleep(700);
    cols[0].classList.add("next");
    await sleep(700);
    fill.style.width = "100%";
    cols[1].classList.add("next");
  };
}
