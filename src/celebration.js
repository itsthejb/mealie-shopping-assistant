const TICKER_TAPE_COLORS = ["#f5c542", "#ef6f6c", "#69c7b5", "#9d87d5", "#f28e4b"];

export function startCelebration(layer, document, prefersReducedMotion) {
  if (prefersReducedMotion) return;

  layer.classList.remove("celebrating");
  layer.replaceChildren();
  for (let index = 0; index < 18; index += 1) {
    const tape = document.createElement("span");
    tape.className = "ticker-tape";
    tape.style.left = `${(index * 67 + 8) % 100}%`;
    tape.style.setProperty("--tape-color", TICKER_TAPE_COLORS[index % TICKER_TAPE_COLORS.length]);
    tape.style.setProperty("--tape-width", `${7 + (index % 3) * 3}px`);
    tape.style.setProperty("--tape-height", `${18 + (index % 4) * 5}px`);
    tape.style.setProperty("--tape-delay", `${(index % 5) * 30}ms`);
    tape.style.setProperty("--start-rotation", `${(index % 2 ? 1 : -1) * (12 + (index % 4) * 11)}deg`);
    tape.style.setProperty("--middle-rotation", `${(index % 2 ? -1 : 1) * (35 + (index % 3) * 25)}deg`);
    tape.style.setProperty("--end-rotation", `${(index % 2 ? 1 : -1) * (90 + (index % 5) * 47)}deg`);
    tape.style.setProperty("--middle-drift", `${(index % 2 ? 1 : -1) * (12 + (index % 4) * 9)}px`);
    tape.style.setProperty("--end-drift", `${(index % 2 ? -1 : 1) * (30 + (index % 5) * 18)}px`);
    layer.append(tape);
  }
  void layer.offsetWidth;
  layer.classList.add("celebrating");
}
