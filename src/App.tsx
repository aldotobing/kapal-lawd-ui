import React from "react";
import { Helmet } from "react-helmet";
// import logo from "./logo.svg";
import "./App.css";
import ChatInterface from "./ChatInterface"; // Import ChatInterface

function App() {
  return (
    <div className="App">
      <Helmet>
        <title>AI Chat Assistant | Kapal Lawd</title>
        <meta
          name="description"
          content="Kapal Lawd AI Chat Assistant - An intelligent AI assistant. Capable of answering questions, providing information, and generating images on demand. developed by Aldo Tobing"
        />
        <meta
          name="keywords"
          content="AI, Chat, Assistant, Kapal Lawd, Weather, Aldo Tobing, Java, Golang, PostgreSQL, DevOps, Software Engineer, Docker, Backend Developer"
        />
      </Helmet>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <ChatInterface /> {/* Render ChatInterface here */}
    </div>
  );
}

export default App;
