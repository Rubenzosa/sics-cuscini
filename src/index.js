import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { authReady } from "./firebase/config";

const root = ReactDOM.createRoot(document.getElementById("root"));

const schermata = (titolo, testo) => (
  <div style={{
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 12,
    fontFamily: "system-ui, sans-serif", color: "#31445c", background: "#e8ecf3",
    padding: 24, textAlign: "center"
  }}>
    <div style={{ fontSize: 18, fontWeight: 600 }}>{titolo}</div>
    <div style={{ fontSize: 14, maxWidth: 420, lineHeight: 1.5 }}>{testo}</div>
  </div>
);

root.render(schermata("Connessione in corso", "Autenticazione al database."));

// L'app parte solo quando l'utente anonimo esiste: senza token le letture
// Firestore verrebbero rifiutate dalle regole (permission-denied).
authReady
  .then(() => {
    root.render(<React.StrictMode><App /></React.StrictMode>);
  })
  .catch((err) => {
    console.error("Autenticazione anonima fallita:", err);
    const dettaglio = err?.code === "auth/operation-not-allowed"
      ? "Il metodo di accesso Anonimo non e' abilitato nella console Firebase (Authentication > Sign-in method > Anonimo)."
      : `Codice errore: ${err?.code || "sconosciuto"}.`;
    root.render(schermata("Impossibile accedere al database", dettaglio));
  });
