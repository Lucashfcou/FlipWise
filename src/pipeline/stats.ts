/** Quantil por interpolação linear (método 7, o de Excel e numpy). `sorted` tem de vir ordenado. */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export interface IqrResult {
  kept: number[];
  removed: number[];
  q1: number;
  q3: number;
  lower: number;
  upper: number;
  /** false quando há poucos valores para o IQR ter sentido (menos de 4). */
  applied: boolean;
}

/** Remove valores fora de [Q1 − 1,5·IQR, Q3 + 1,5·IQR]. */
export function iqrFilter(values: number[]): IqrResult {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length < 4) {
    return { kept: sorted, removed: [], q1: NaN, q3: NaN, lower: -Infinity, upper: Infinity, applied: false };
  }
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return {
    kept: sorted.filter((v) => v >= lower && v <= upper),
    removed: sorted.filter((v) => v < lower || v > upper),
    q1, q3, lower, upper, applied: true,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(values: number[]): { mean: number; median: number; min: number; max: number } | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return {
    mean: round2(mean),
    median: round2(quantile(sorted, 0.5)),
    min: round2(sorted[0]),
    max: round2(sorted[sorted.length - 1]),
  };
}
