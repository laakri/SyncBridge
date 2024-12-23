import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { router } from "./routes";

// Wait for router to be ready before mounting
async function prepare() {
  if (import.meta.env.DEV) {
    await router.load();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

prepare();
