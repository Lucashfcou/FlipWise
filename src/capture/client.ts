import type { CaptureResult, CaptureStatus } from "./types";

export async function captureStatus(): Promise<CaptureStatus> {
  try {
    const res = await fetch("/api/capture/status");
    if (!res.ok) return { enabled: false };
    const data = (await res.json()) as CaptureStatus;
    return { enabled: data.enabled === true, dailyLimit: data.dailyLimit, usedToday: data.usedToday };
  } catch {
    return { enabled: false };
  }
}

/** Reduz o print antes de enviar: menos tokens, menos custo, e a imagem original nunca sai do aparelho. */
export async function shrinkImage(file: File, maxSide = 1280): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não consegui preparar a imagem.");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function readPrint(imageDataUrl: string): Promise<{ result: CaptureResult; usedToday?: number; dailyLimit?: number }> {
  const res = await fetch("/api/capture", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; result?: CaptureResult; usedToday?: number; dailyLimit?: number };
  if (!res.ok || !data.result) throw new Error(data.error ?? "A leitura falhou.");
  return { result: data.result, usedToday: data.usedToday, dailyLimit: data.dailyLimit };
}

/** Resultado de demonstração: não lê imagem nenhuma e não custa nada. */
export function demoResult(): CaptureResult {
  return {
    productId: "ps4-slim-500",
    title: "PlayStation 4 Slim 500GB preta com 1 comando",
    price: 140,
    currency: "EUR",
    condition: "B",
    conditionReason: "Sem caixa, com 1 comando e pequenos riscos (exemplo).",
    platform: "Vinted",
    includes: ["1 comando", "cabos"],
    defects: [],
    confidence: "media",
    notes: "Resultado de exemplo para testar o fluxo. Não veio de nenhum print.",
    demo: true,
  };
}
