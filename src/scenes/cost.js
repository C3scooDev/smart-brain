import { h } from "../util.js";

// Every value here is an assumption shown on the page, not a measurement.
const IN_TOK = 8000, OUT_TOK = 600;          // tokens per answer with a cloud agent
const PRICE_IN = 3, PRICE_OUT = 15;          // € per million tokens, hypothetical cloud model
const WORK_DAYS = 22;
const POWER_W = 65, KWH = 0.3;               // mini PC average draw, € per kWh
const HW = 1200, HW_MONTHS = 36;             // mini PC price, amortised

const euro = (v) => `${v.toLocaleString("it-IT", { maximumFractionDigits: 0 })} €`;

export default function cost(root) {
  const box = root.querySelector(".cost");
  const people = h("input", { type: "range", min: 5, max: 300, value: 40, step: 5, "aria-label": "Persone" });
  const asks = h("input", { type: "range", min: 2, max: 60, value: 15, step: 1, "aria-label": "Domande al giorno" });
  const pv = h("b"), av = h("b");
  const cloudV = h("b.big"), localV = h("b.big"), saveV = h("b"), qV = h("span");
  const cloudBar = h("i.cloudbar"), localBar = h("i.localbar");

  box.append(
    h("div.sliders", {},
      h("label", {}, h("span", {}, "Persone ", pv), people),
      h("label", {}, h("span", {}, "Domande al giorno a persona ", av), asks)),
    h("div.cost-out", {},
      h("div.cost-card", {}, h("span.dim", {}, "Cloud a token, al mese"), cloudV, h("div.cbar", {}, cloudBar)),
      h("div.cost-card.local", {}, h("span.dim", {}, "Smart Brain locale, al mese"), localV, h("div.cbar", {}, localBar))),
    h("p.cost-line", {}, qV, " · risparmio all'anno: ", saveV),
    h("p.foot", {}, `Stime, non preventivi. Cloud: ${IN_TOK / 1000}k token letti e ${OUT_TOK} scritti a risposta, ${PRICE_IN} €/M e ${PRICE_OUT} €/M, ${WORK_DAYS} giorni al mese. Locale: mini PC da ${euro(HW)} in ${HW_MONTHS} mesi più ${POWER_W} W a ${KWH} €/kWh. Sopra i 4 utenti in parallelo servono più slot o un secondo nodo.`));

  function update() {
    const n = +people.value, a = +asks.value;
    const q = n * a * WORK_DAYS;
    const cloud = q * (IN_TOK * PRICE_IN + OUT_TOK * PRICE_OUT) / 1e6;
    const nodes = Math.max(1, Math.ceil(n / 80));
    const local = nodes * (HW / HW_MONTHS + POWER_W * 24 * 30 / 1000 * KWH);
    pv.textContent = n; av.textContent = a;
    cloudV.textContent = euro(cloud); localV.textContent = euro(local);
    const max = Math.max(cloud, local);
    cloudBar.style.width = `${(cloud / max) * 100}%`; localBar.style.width = `${(local / max) * 100}%`;
    qV.textContent = `${q.toLocaleString("it-IT")} risposte al mese${nodes > 1 ? ` · ${nodes} nodi locali` : ""}`;
    saveV.textContent = euro(Math.max(0, (cloud - local) * 12));
  }
  people.addEventListener("input", update);
  asks.addEventListener("input", update);
  update();
  return () => {};
}
