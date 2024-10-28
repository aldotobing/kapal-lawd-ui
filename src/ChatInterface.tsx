import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import { Upload, ArrowUp } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Types
type MessageType = "user" | "assistant";

interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  isImage?: boolean;
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
const IMAGE_API_URL = "https://image-gen.aldo-tobing.workers.dev/";

// Function to check if the input is a request for an image
const isImageRequest = (input: string) => {
  const lowerInput = input.toLowerCase();
  return (
    lowerInput.includes("make an image") ||
    lowerInput.includes("make a picture of") ||
    lowerInput.includes("a picture of") ||
    lowerInput.includes("buatkan saya gambar") ||
    lowerInput.includes("create an image") ||
    lowerInput.includes("generate an image") ||
    lowerInput.includes("gambarkan") ||
    lowerInput.includes("gambar") ||
    lowerInput.includes("tolong buatkan gambar") ||
    lowerInput.includes("saya butuh gambar") ||
    lowerInput.includes("coba gambarkan") ||
    lowerInput.includes("bisa bikin gambar") ||
    lowerInput.includes("gambar tentang") ||
    lowerInput.includes("gambarkan sesuatu yang") ||
    lowerInput.includes("bikin gambar") ||
    lowerInput.includes("tolong buatkan saya gambar") ||
    lowerInput.includes("buatkan saya gambar")
  );
};

// Function to send image request to API
const sendImageRequest = async (prompt: string) => {
  try {
    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error("Image generation failed");
    }

    // Asumsikan response berupa blob (gambar)
    const blob = await response.blob(); // Ambil response sebagai blob
    const imageUrl = URL.createObjectURL(blob); // Buat URL untuk gambar

    return imageUrl; // Kembalikan URL gambar
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

const ChatInterface: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES[0]
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  //   const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Cek apakah user-id sudah ada di localStorage
    let userId = localStorage.getItem("user-id");
    if (!userId) {
      userId = uuidv4(); // Generate UUID
      localStorage.setItem("user-id", userId); // Simpan ke localStorage
    }
  }, []);

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

  const createMessage = (
    content: string,
    type: MessageType,
    isImage: boolean = false
  ): Message => ({
    id: uuidv4(),
    content,
    type,
    timestamp: new Date(),
    isImage,
  });

  // Message Handlers
  const addMessage = (
    content: string,
    type: MessageType,
    isImage: boolean = false
  ) => {
    setMessages((prev) => [...prev, createMessage(content, type, isImage)]);
  };

  const updateLastAssistantMessage = (
    content: string,
    isImage: boolean = false
  ) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastAssistantMessage = newMessages
        .filter((m) => m.type === "assistant")
        .pop();

      if (lastAssistantMessage) {
        lastAssistantMessage.content = content;
        lastAssistantMessage.isImage = isImage;
      }
      return newMessages;
    });
  };

  // API Interaction
  const sendMessageToAPI = async (userInput: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userId = localStorage.getItem("user-id") || "anonymous"; // Ambil user-id dari localStorage

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId, // Kirim user-id di header
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a friendly virtual assistant with customer care-level emotions. You are very philosophical and wise in giving advice, and you understand both Indonesian and English. Developed by Aldo Tobing, your name is Kapal Lawd. Your goal is to make conversations feel natural, engaging, and comfortable. You can also be a comforting friend for sharing feelings, with a mature understanding of emotions that puts users at ease. Always respond in a friendly manner, so the bond remains chill. You are Indonesian and understand its social cultures. Always maintain context from previous messages and refer to past interactions when appropriate.",
            },
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
    let accumulatedResponse = ""; // Deklarasi tetap di sini.

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

                // Hindari penggunaan timeout langsung dalam loop, gunakan async queue.
                await Promise.resolve(); // Menunggu agar event loop tidak tersendat.
                onResponse(accumulatedResponse); // Update UI dengan respons terbaru.
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
    if (!trimmedInput || isLoading) return;

    setInputText("");
    setIsLoading(true);
    addMessage(trimmedInput, "user");
    addMessage("", "assistant");

    try {
      if (isImageRequest(trimmedInput)) {
        const generatedImageUrl = await sendImageRequest(trimmedInput);
        if (generatedImageUrl) {
          updateLastAssistantMessage(generatedImageUrl, true); // Update message terakhir
          setImageUrl(generatedImageUrl); // Set imageUrl
        } else {
          updateLastAssistantMessage("Sorry, I couldn't generate the image.");
        }
      } else {
        const stream = await sendMessageToAPI(trimmedInput);
        if (stream) {
          await processStream(stream, (response) => {
            updateLastAssistantMessage(response);
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      updateLastAssistantMessage(
        "Sorry, an error occurred while sending the message. Please try again."
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

  //   const handleVoiceInput = () => {
  //     setIsListening(!isListening);
  //     // Implement voice input logic here
  //   };

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
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Generated"
            className="mt-4 ml-10 w-150 h-150 object-cover"
          />
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input-area flex items-center space-x-2 bg-[#3a3a3a]">
        {/* <button
          onClick={handleVoiceInput}
          className={`voice-button ${
            isListening ? "active" : ""
          } rounded-full p-2 transition-colors`}
        >
          <Mic size={20} />
        </button> */}

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
          placeholder={`Apa yang bisa saya bantu?`}
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
