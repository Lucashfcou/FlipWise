const eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export const money = (n: number) => eur.format(n);
export const money2 = (n: number) => eur2.format(n);
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const today = () => new Date().toISOString().slice(0, 10);
