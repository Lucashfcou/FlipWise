/**
 * Cartão para compartilhar o veredito: uma imagem 1080x1350 desenhada no navegador (nada vai para servidor).
 * Mostra só números do próprio app (limite de revenda e preço pedido), nunca dados em bruto do eBay.
 */
export interface ShareInput {
  product: string;
  asked: string;
  title: string;
  text: string;
  limit: string;
  limitLabel: string;
  askedLabel: string;
  footer: string;
  light: "go" | "maybe" | "stop";
}

const COLORS = { go: "#7be08a", maybe: "#f0c05a", stop: "#ef7a6e" } as const;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawShareCard(input: ShareInput): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const sans = '"Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif';
  const display = '"Anybody Variable", "Arial Narrow", system-ui, sans-serif';
  const mono = '"Spline Sans Mono", ui-monospace, Consolas, monospace';
  try {
    await Promise.all([document.fonts.load(`700 40px ${display}`), document.fonts.load(`700 40px ${sans}`), document.fonts.load(`500 40px ${mono}`)]);
  } catch {
    /* sem fontes da página: usa as de sistema */
  }

  ctx.fillStyle = "#0b2426";
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#123335";
  ctx.beginPath();
  ctx.roundRect(60, 60, 960, 1230, 36);
  ctx.fill();

  // marca
  ctx.fillStyle = "#e6eeec";
  ctx.beginPath();
  ctx.roundRect(110, 110, 64, 64, 14);
  ctx.fill();
  ctx.strokeStyle = "#0b2426";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(131, 160);
  ctx.lineTo(131, 128);
  ctx.lineTo(158, 128);
  ctx.stroke();
  ctx.strokeStyle = "#4fd1c2";
  ctx.beginPath();
  ctx.moveTo(131, 144);
  ctx.lineTo(152, 144);
  ctx.stroke();
  ctx.fillStyle = "#e6eeec";
  ctx.font = `700 44px ${display}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Flipfind", 194, 144);

  // produto e preço pedido
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#e6eeec";
  ctx.font = `700 64px ${sans}`;
  let y = 340;
  for (const l of wrap(ctx, input.product, 860).slice(0, 3)) {
    ctx.fillText(l, 110, y);
    y += 76;
  }
  ctx.fillStyle = "#9db8b5";
  ctx.font = `400 40px ${sans}`;
  ctx.fillText(`${input.askedLabel}: ${input.asked}`, 110, y + 20);

  // veredito
  const color = COLORS[input.light];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(110, 640, 860, 330, 28);
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 78px ${display}`;
  let ty = 740;
  for (const l of wrap(ctx, input.title, 780).slice(0, 2)) {
    ctx.fillText(l, 150, ty);
    ty += 88;
  }
  ctx.fillStyle = "#e6eeec";
  ctx.font = `400 38px ${sans}`;
  for (const l of wrap(ctx, input.text, 780).slice(0, 2)) {
    ctx.fillText(l, 150, ty + 10);
    ty += 50;
  }

  // limite de revenda
  ctx.fillStyle = "#9db8b5";
  ctx.font = `400 36px ${mono}`;
  ctx.fillText(input.limitLabel.toUpperCase(), 110, 1090);
  ctx.fillStyle = "#e6eeec";
  ctx.font = `500 120px ${mono}`;
  ctx.fillText(input.limit, 110, 1210);

  ctx.fillStyle = "#4fd1c2";
  ctx.font = `700 34px ${sans}`;
  ctx.textAlign = "right";
  ctx.fillText(input.footer, 970, 1230);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png"));
}

/** Abre a folha de compartilhar do aparelho com a imagem; sem suporte, baixa o PNG. */
export async function shareCard(input: ShareInput, fileName: string, shareTitle: string): Promise<"shared" | "saved"> {
  const blob = await drawShareCard(input);
  const file = new File([blob], fileName, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: shareTitle });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "saved";
}
