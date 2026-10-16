import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppProvider } from "./state";
import "@fontsource-variable/anybody/wdth.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/spline-sans-mono/400.css";
import "@fontsource/spline-sans-mono/500.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
