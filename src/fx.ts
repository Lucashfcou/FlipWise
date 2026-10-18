import { useEffect } from "react";
import type { DependencyList, RefObject } from "react";

/**
 * Movimento da interface. Portado do jogo do PAS (Sentido UnB): Web Animations API, sem biblioteca.
 * Tudo é opcional: com "reduzir movimento" ou se algo falhar, a página segue a funcionar.
 * Só ficaram as animações sóbrias (entrada em escada, salto curto, dígitos que rolam);
 * confete, faíscas e o círculo de cor que cobre o ecrã ficaram de fora de propósito.
 */
const RM = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
const on = () => !(RM?.matches ?? true);

const OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

/** Filhos sobem um a um (troca de ecrã, listas). */
export function stagger(els: Element[], y = 12, step = 45, start = 0) {
  if (!els.length || !on()) return;
  safe(() =>
    els.forEach((el, i) =>
      el.animate({ opacity: [0, 1], transform: [`translateY(${y}px)`, "none"] }, { duration: 480, delay: start + i * step, easing: OUT, fill: "backwards" }),
    ),
  );
}

/** Salto curto: item que mudou de estado ou acabou de ser escolhido. */
export function pop(el: Element | null, scale = 1.04) {
  if (!el || !on()) return;
  safe(() => el.animate({ transform: [`scale(${scale})`, "scale(0.99)", "scale(1)"] }, { duration: 340, easing: SPRING }));
}

/** Contador rolante: cada dígito é uma coluna que desliza até ao valor. */
export function roll(el: HTMLElement | null, text: string) {
  if (!el) return;
  if (!on()) {
    el.textContent = text;
    return;
  }
  safe(() => {
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const digits = [...text].filter((c) => /\d/.test(c));
    let di = 0;
    for (const ch of text) {
      if (!/\d/.test(ch)) {
        const s = document.createElement("span");
        s.setAttribute("aria-hidden", "true");
        s.textContent = ch;
        el.appendChild(s);
        continue;
      }
      const wrap = document.createElement("span");
      wrap.className = "fx-d";
      wrap.setAttribute("aria-hidden", "true");
      const col = document.createElement("span");
      col.className = "fx-col";
      for (let n = 0; n < 10; n++) {
        const cell = document.createElement("span");
        cell.textContent = String(n);
        col.appendChild(cell);
      }
      wrap.appendChild(col);
      el.appendChild(wrap);
      const target = Number(digits[di]);
      col.animate({ transform: ["translateY(0)", `translateY(${-target * 10}%)`] }, { duration: 450 + di * 80, easing: OUT, fill: "forwards" });
      di++;
    }
  });
}

/** Corre `fn` depois de cada alteração das dependências, quando o elemento já existe. */
export function useFx(ref: RefObject<HTMLElement | null>, fn: (root: HTMLElement) => void, deps: DependencyList) {
  useEffect(() => {
    if (ref.current) fn(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
