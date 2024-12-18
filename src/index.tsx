import React from "react";
import ReactDOM from "react-dom/client";
// import ChatInterface from "./ChatInterface";
import App from "./App";
import "./index.css";
import "./assets/code.css";
import { register } from "./ServiceWorker";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  process.env.NODE_ENV === "development" ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      register();
      //console.log("Service Worker registered successfully.");
    } catch (error) {
      //console.error("Service Worker registration failed:", error);
    }
  });
}
