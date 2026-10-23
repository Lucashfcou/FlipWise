import type { Category } from "../domain/types";

/** Ícones de linha das categorias, no mesmo traço do menu inferior. */
const PATHS: Record<Category, string> = {
  console: "M7 9h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.2 2L14.5 14.5h-5L8.2 16A3 3 0 0 1 3 14v-1a4 4 0 0 1 4-4zM8 11.5v2M7 12.5h2M16 12h.01M18 13.5h.01",
  phone: "M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3zM11 18h2",
  tablet: "M6 3h12a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 6 3zM11 18h2",
  laptop: "M5 6h14v9H5zM3 19h18M10 15v1h4v-1",
  watch: "M9 7l.6-3h4.8L15 7M9 17l.6 3h4.8L15 17M8 7h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM12 10v2.5l1.5 1",
  audio: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5.5A1.5 1.5 0 0 1 4 17.5zM20 14h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5z",
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  gpu: "M3 8h18v8H3zM3 18h14M8 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  controller: "M7 8h10a4 4 0 0 1 4 4v2a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1 1.8A3 3 0 0 1 3 14v-2a4 4 0 0 1 4-4zM8 10.5v3M6.5 12h3M16 11.5h.01M17.8 13h.01",
  game: "M5 4h14v16H5zM8 4v4h8V4M8 12h8M8 15.5h5",
  shoe: "M3 17v-3.5L8 12l2-3 3 2c1.5 1 3.5 1.5 6 2.5V17zM3 17h16",
  cpu: "M7 7h10v10H7zM10 10h4v4h-4zM9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2",
  storage: "M4 15h16v4H4zM6 15l1.5-8h9L18 15M16.5 17h.01",
  monitor: "M3 5h18v11H3zM9 20h6M12 16v4",
  peripheral: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 3v6M9 9h6",
  desktop: "M6 3h12v18H6zM9 7h6M9 10h6M12 18h.01",
};

export function CategoryIcon({ category }: { category: Category }) {
  return (
    <svg className="cat-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[category]} />
    </svg>
  );
}
