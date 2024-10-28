import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import { Mic, Upload, ArrowUp } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import TypingIndicator from "./components/TypingIndicator";

// Types
type MessageType = "user" | "assistant";

interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

interface Language {
  code: string;
  name: string;
}

// Constants
const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "id", name: "Bahasa Indonesia" },
];

const API_URL = "https://kapal-lawd-be.aldo-tobing.workers.dev/";

const ChatInterface: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES[0]
  );
  const [isListening, setIsListening] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Effects
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Helper Functions
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createMessage = (content: string, type: MessageType): Message => ({
    id: uuidv4(),
    content,
    type,
    timestamp: new Date(),
  });

  // Message Handlers
  const addMessage = (content: string, type: MessageType) => {
    setMessages((prev) => [...prev, createMessage(content, type)]);
  };

  const updateLastAssistantMessage = (content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastAssistantMessage = newMessages
        .filter((m) => m.type === "assistant")
        .pop();

      if (lastAssistantMessage) {
        lastAssistantMessage.content = content;
      }
      return newMessages;
    });
  };

  // API Interaction
  const sendMessageToAPI = async (userInput: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a friendly assistant" },
            { role: "user", content: userInput },
          ],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("API request failed");
      }

      return response.body;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
        return null;
      }
      throw error;
    }
  };

  const processStream = async (
    stream: ReadableStream<Uint8Array>,
    onResponse: (response: string) => void
  ) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulatedResponse = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const jsonStr = line.slice(5).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.response) {
                accumulatedResponse += data.response;

                // Debounce update
                setTimeout(() => {
                  onResponse(accumulatedResponse);
                }, 100); // 100 ms delay
              }
            } catch (error) {
              console.error("Failed to parse JSON:", error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Event Handlers
  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading) return; // Ini akan mencegah masuk ke sini jika isLoading sudah true

    setInputText("");
    setIsLoading(true);
    addMessage(trimmedInput, "user");
    addMessage("", "assistant"); // Ini hanya menambah pesan assistant, jangan panggil lagi

    try {
      const stream = await sendMessageToAPI(trimmedInput);
      if (stream) {
        await processStream(stream, (response) => {
          updateLastAssistantMessage(response);
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      updateLastAssistantMessage(
        "Sorry, I encountered an error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Implement voice input logic here
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement file upload logic here
  };

  // Render
  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentLanguage={currentLanguage}
        languages={LANGUAGES}
        setCurrentLanguage={setCurrentLanguage}
      />

      <div className="flex-1 overflow-y-auto bg-[#2a2a2a] dark:bg-[#2a2a2a] chat-container">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={chatEndRef} />
      </div>

      <div className="input-area flex items-center space-x-2 bg-[#3a3a3a]">
        <button
          onClick={handleVoiceInput}
          className={`voice-button ${
            isListening ? "active" : ""
          } rounded-full p-2 transition-colors`}
        >
          <Mic size={20} />
        </button>

        <label className="upload-button cursor-pointer rounded-full bg-gray-200 dark:bg-gray-300 p-2 transition-colors">
          <Upload size={20} />
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
          />
        </label>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Type a message in ${currentLanguage.name}...`}
          className="input-field flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#4a4a4a] dark:text-white"
          disabled={isLoading}
        />

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          className={`send-button rounded-full p-2 bg-blue-500 text-white transition-colors ${
            inputText.trim() && !isLoading ? "" : "cursor-not-allowed"
          }`}
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
