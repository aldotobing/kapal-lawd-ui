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
          <title>Kapal Lawd GPT</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#000000" />
          <meta name="msapplication-navbutton-color" content="#000000" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <link rel="apple-touch-icon" href="/logo192.png" />
          <link rel="manifest" href="/manifest.json" />

          <meta
            name="description"
            content="Kapal Lawd AI Chat Assistant - An intelligent AI assistant. Capable of answering questions, providing information, and generating images on demand. developed by Aldo Tobing"
          />
          <meta
            name="keywords"
            content="AI, Chat, Assistant, Kapal Lawd, Aldo Tobing, Weather, Java, Golang, PostgreSQL, DevOps, Software Engineer, Docker, Backend Developer, Kapal Lawd AI, Kapal Lawd GPT"
          />
          <meta name="author" content="Aldo Tobing" />

          <meta property="og:title" content="Kapal Lawd AI" />
          <meta
            property="og:description"
            content="Kapal Lawd AI Chat Assistant - An intelligent AI assistant. Capable of answering questions, providing information, and generating images on demand. developed by Aldo Tobing"
          />
          <meta
            property="og:image"
            content="https://ai.aldotobing.online/logo192.png"
          />
          <meta property="og:url" content="https://ai.aldotobing.online/" />
          <meta property="og:type" content="website" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Kapal Lawd - AI" />
          <meta
            name="twitter:description"
            content="Kapal Lawd AI Chat Assistant - An intelligent AI assistant. Capable of answering questions, providing information, and generating images on demand. developed by Aldo Tobing"
          />
          <meta
            name="twitter:image"
            content="https://ai.aldotobing.online/logo192.jpg"
          />
          <meta name="twitter:url" content="https://ai.aldotobing.online/" />

          <link rel="canonical" href="https://ai.aldotobing.online/" />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
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
