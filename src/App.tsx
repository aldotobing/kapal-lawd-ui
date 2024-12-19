import { HelmetProvider, Helmet } from "react-helmet-async";
import { lazy, Suspense, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";

const ChatInterface = lazy(() => import("./ChatInterface"));

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

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

        {/* Show LoadingScreen while isLoading is true */}
        {isLoading && (
          <LoadingScreen
            minimumDuration={1000}
            onLoadingComplete={handleLoadingComplete}
          />
        )}

        {/* ChatInterface is always rendered but initially hidden */}
        <div
          className={`transition-opacity duration-800 ease-ios ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          <Suspense fallback={null}>
            <ChatInterface />
          </Suspense>
        </div>
      </div>
    </HelmetProvider>
  );
}

export default App;
