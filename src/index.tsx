import React from "react";
import ReactDOM from "react-dom/client";
import ChatInterface from "./ChatInterface";
import "./index.css";
import "./assets/code.css";
import { register } from "./ServiceWorker";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ChatInterface />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    register();
  });
}
