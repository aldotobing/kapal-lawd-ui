import React from "react";
import ReactDOM from "react-dom/client";
import ChatInterface from "./ChatInterface"; // Import the ChatInterface component
import "./index.css"; // Optional: For any global CSS styles
import "./assets/code.css"; // Optional: For any global CSS styles

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ChatInterface />
  </React.StrictMode>
);
