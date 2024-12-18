import { HelmetProvider, Helmet } from "react-helmet-async";
import { lazy, Suspense } from "react";
import "./assets/App.css";
import LoadingScreen from "./components/LoadingScreen";
const ChatInterface = lazy(() => import("./ChatInterface"));

function App() {
  return (
    <HelmetProvider>
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
        {}
        <Suspense fallback={<LoadingScreen />}>
          <ChatInterface />
        </Suspense>
      </div>
    </HelmetProvider>
  );
}

export default App;
