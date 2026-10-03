let canvas: CanvasRenderingContext2D | null = null;

function toHex(color: string): string | null {
  canvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!canvas) return null;
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function colorAtTop(): string | null {
  let el = document.elementFromPoint(window.innerWidth / 2, 1);
  while (el) {
    const hex = toHex(getComputedStyle(el).backgroundColor);
    if (hex) return hex;
    el = el.parentElement;
  }
  return toHex(getComputedStyle(document.body).backgroundColor);
}

export function syncStatusBar() {
  const color = colorAtTop();
  if (!color) return;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
}
