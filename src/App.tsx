import { HelmetProvider, Helmet } from "react-helmet-async";
import { lazy, Suspense, useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";

const ChatInterface = lazy(() => import("./ChatInterface"));

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false); // Berhenti loading setelah 4500ms
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

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
        {isLoading ? (
          <LoadingScreen minimumDuration={5000} />
        ) : (
          // Suspense will wrap the ChatInterface and display LoadingScreen as a fallback until it's ready
          <Suspense fallback={<LoadingScreen minimumDuration={0} />}>
            <ChatInterface />
          </Suspense>
        )}
      </div>
    </HelmetProvider>
  );
}

export default App;
