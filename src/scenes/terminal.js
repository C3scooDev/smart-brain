const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Types lines into a <pre> like a terminal session; lines starting with "$" are typed, the rest appear at once.
export async function typeLines(el, lines, speed = 35) {
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.textContent = " ";
  el.append(cursor);
  for (const { text, cls } of lines) {
    const line = document.createElement("span");
    if (cls) line.className = cls;
    el.insertBefore(line, cursor);
    if (text.startsWith("$")) {
      for (const ch of text) { line.textContent += ch; await sleep(speed); }
      await sleep(300);
    } else {
      line.textContent = text;
      await sleep(250);
    }
    el.insertBefore(document.createTextNode("\n"), cursor);
  }
}
