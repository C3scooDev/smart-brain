import { h, sleep } from "../util.js";
import { typeLines } from "./terminal.js";

const CHOICES = [
  ["Python, solo stdlib", "Niente da installare o aggiornare sul server."],
  ["SQLite", "Coda dei lavori e conversazioni in un file, con transazioni e senza server."],
  ["Markdown + git per i brain", "Le persone li leggono. La storia dei commit è il controllo."],
  ["qmd via MCP su HTTP", "Ricerca ibrida locale. Qualsiasi client MCP la usa."],
  ["LM Studio, motore Vulkan", "API compatibile OpenAI e Anthropic, meno VRAM di ROCm."],
  ["Uno shim davanti all'LLM", "Adatta i messaggi al modello e tiene la chiave lontana dagli agenti."],
  ["Claude Code headless", "Tool, sandbox e sessioni pronti, puntati sul modello locale."],
  ["systemd, niente Docker", "Parte all'avvio, riparte se cade, log in journald."],
];
const COMPAT = ["MCP", "API OpenAI", "API Anthropic", "Claude Code", "WhatsApp", "Telegram", "Mail", "Web"];

export default function choices(root) {
  const box = root.querySelector(".choices");
  const rows = CHOICES.map(([a, b]) => h("tr", {}, h("td", {}, a), h("td.dim", {}, b)));
  const pre = h("pre.term-body");
  box.append(
    h("div.grid2", {},
      h("table.tbl", {}, h("thead", {}, h("tr", {}, h("th", {}, "Scelta"), h("th", {}, "Perché"))), h("tbody", {}, rows)),
      h("div", {},
        h("div.term", {}, h("div.term-bar", {}, h("i"), h("i"), h("i"), h("span", {}, "deploy")), pre),
        h("div.badges", {}, COMPAT.map((c) => h("span.badge", {}, c))))));
  rows.forEach((r) => r.classList.add("wait"));

  return async () => {
    const deploy = typeLines(pre, [
      { text: "$ git push server main" },
      { text: "› 3 file cambiati", cls: "dim" },
      { text: "$ systemctl --user restart smart-brain" },
      { text: "✓ attivo. Nessuna immagine da ricostruire.", cls: "ok" },
      { text: "› qmd parte alla prima domanda, si spegne dopo 10 min", cls: "dim" },
    ]);
    for (const r of rows) { r.classList.remove("wait"); await sleep(160); }
    await deploy;
  };
}
