import { locale } from "./i18n";

const fmt = (digits: number) => (n: number) =>
  new Intl.NumberFormat(locale(), { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

const eur0 = fmt(0);
const eur2 = fmt(2);

export const money = (n: number) => eur0(n);
export const money2 = (n: number) => eur2(n);
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const today = () => new Date().toISOString().slice(0, 10);
