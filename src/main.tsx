import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeDatabase } from "./lib/database";

async function startApplication() {
  await initializeDatabase();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

startApplication().catch((error) => {
  console.error("FretForge failed to start:", error);

  const root = document.getElementById("root");

  if (root) {
    root.textContent =
      "FretForge could not initialize its local database. Restart the app and try again.";
  }
});
