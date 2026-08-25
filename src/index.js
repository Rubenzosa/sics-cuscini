import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

// ═══ Splash di apertura: resta visibile almeno DURATA_SPLASH ms ═══
const DURATA_SPLASH = 2600;   // logo pienamente visibile
const DURATA_FADE   = 600;    // deve combaciare con la transition in index.html

(function chiudiSplash() {
  const splash = document.getElementById("sics-splash");
  if (!splash) return;
  const attesa = Math.max(0, DURATA_SPLASH - performance.now());
  setTimeout(() => {
    splash.classList.add("sics-splash-out");
    setTimeout(() => splash.remove(), DURATA_FADE);
  }, attesa);
})();
