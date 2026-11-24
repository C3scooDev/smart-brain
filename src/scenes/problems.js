import { h, sleep } from "../util.js";

const PROBLEMS = [
  ["Indicizzare è lento e sequenziale", "Un agente alla volta collega le pagine: decine di documenti richiedono ore.",
    "Riassunti a più livelli in parallelo, indice ibrido ricostruito a ogni scrittura."],
  ["Le fonti non sono verificate", "Cita un documento, ma nessuno controlla che lo abbia letto.",
    "Il codice rimanda indietro ogni risposta che cita un file mai letto. Un secondo controllo verifica che copra ogni punto."],
  ["Un solo utente", "La wiki vive sul PC di una persona. Ogni collega la ricompila da capo.",
    "Brain centrali, raggiungibili da chat e mail. Chi scrive e chi legge lavorano insieme."],
  ["Un tetto di documenti", "Oltre 200-300 documenti il grafo esplode.",
    "Albero di sintesi più ricerca ibrida: i collegamenti si trovano al momento della domanda."],
  ["Nessun permesso", "Tutti vedono tutto, o niente.",
    "Il ruolo decide quali brain leggi. Lo applica il codice, mai il prompt."],
];

export default function problems(root) {
  const box = root.querySelector(".cards");
  const cards = PROBLEMS.map(([title, bad, good], i) => {
    const card = h("button.card", { type: "button", onclick: () => card.classList.toggle("flip") },
      h("div.face.front", {}, h("span.num", {}, `0${i + 1}`), h("strong", {}, title), h("p", {}, bad)),
      h("div.face.back", {}, h("span.num", {}, "Smart Brain"), h("p", {}, good)));
    box.append(card);
    return card;
  });
  return async () => {
    for (const c of cards) { c.classList.add("shown"); await sleep(180); }
    await sleep(1800);
    for (const c of cards) { c.classList.add("flip"); await sleep(350); }
  };
}
