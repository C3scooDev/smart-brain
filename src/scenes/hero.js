import { typeLines } from "./terminal.js";

export default function hero(root) {
  const pre = root.querySelector(".term-body");
  return () => typeLines(pre, [
    { text: "$ smart-brain status" },
    { text: "› modello locale   qwen3.6-35b-a3b · vulkan · 70 tok/s", cls: "dim" },
    { text: "› ricerca          qmd · lex + vec + hyde · rerank", cls: "dim" },
    { text: "› brain            tecnico · commerciale · amministrazione · persone", cls: "dim" },
    { text: "› canali           whatsapp · telegram · mail", cls: "dim" },
    { text: "✓ pronto. Nessun dato esce da qui.", cls: "ok" },
  ]);
}
