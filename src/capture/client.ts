import type { CaptureResult, CaptureStatus } from "./types";
import { problemsFor } from "./vision";

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

export type DemoKind = "ok" | "foto" | "naobate";

/** Resultados de demonstração: não leem imagem nenhuma e não custam nada. */
export function demoResult(kind: DemoKind = "ok"): CaptureResult {
  const base = {
    productId: "ps4-slim-500" as string | null,
    title: "PlayStation 4 Slim 500GB preta com 1 comando",
    price: 140 as number | null,
    currency: "EUR",
    condition: "B" as CaptureResult["condition"],
    conditionReason: "Sem caixa, com 1 comando e pequenos riscos (exemplo).",
    platform: "Vinted" as string | null,
    includes: ["1 comando", "cabos"],
    defects: [] as string[],
    confidence: "media" as const,
    notes: "Resultado de exemplo para testar o fluxo. Não veio de nenhum print.",
    imageType: "anuncio" as CaptureResult["imageType"],
    inconsistencies: [] as string[],
    demo: true,
  };
  if (kind === "foto") {
    base.productId = null;
    base.title = "";
    base.price = null;
    base.condition = null;
    base.conditionReason = "";
    base.platform = null;
    base.includes = [];
    base.imageType = "foto_sem_texto";
    base.notes = "Exemplo: foto de um portátil sem título nem preço.";
  }
  if (kind === "naobate") {
    base.inconsistencies = ["o título diz PS4 Slim 500 GB, mas a foto mostra um PS4 Pro; a descrição fala em 1 TB"];
    // Como no uso real: foto e texto que não batem tiram a confiança.
    (base as { confidence: CaptureResult["confidence"] }).confidence = "baixa";
  }
  if (kind === "foto") (base as { confidence: CaptureResult["confidence"] }).confidence = "baixa";
  return { ...base, problems: problemsFor(base) };
}
