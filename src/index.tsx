import React from "react";
import ReactDOM from "react-dom/client";
import ChatInterface from "./ChatInterface";
import "./index.css";
import "./assets/code.css";
import * as serviceWorker from "./ServiceWorker.js";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ChatInterface />
  </React.StrictMode>
);

serviceWorker.register({
  onSuccess: () => {
    console.log("Service Worker registered successfully");
  },
  onUpdate: () => {
    console.log("New content is available; please refresh.");
  },
});
