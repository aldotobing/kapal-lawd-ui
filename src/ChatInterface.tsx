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
const isImageRequest = (input: string): boolean => {
  const keywords = [
    "make an image",
    "make a picture of",
    "a picture of",
    "create an image",
    "generate an image",
    "gambarkan",
    "gambar",
    "buatkan saya gambar",
    "tolong buatkan gambar",
    "saya butuh gambar",
    "coba gambarkan",
    "bisa bikin gambar",
    "gambar tentang",
    "gambarkan sesuatu yang",
    "bikin gambar",
    "tolong buatkan saya gambar",
  ];

  const lowerInput = input.toLowerCase();
  return keywords.some((keyword) => lowerInput.includes(keyword));
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

  const updateLastAssistantMessage = (rawContent: string) => {
    const { content } = formatMessage(rawContent);
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastAssistantMessageIndex = newMessages
        .map((m, i) => ({ ...m, index: i }))
        .filter((m) => m.type === "assistant")
        .pop();

      if (lastAssistantMessageIndex) {
        newMessages[lastAssistantMessageIndex.index].content = content;
      }
      return newMessages;
    });
  };

  const sanitizeInput = (input: any) =>
    typeof input === "string" ? input : String(input || "");

  // API Interaction
  const sendMessageToAPI = async (userInput: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userId = localStorage.getItem("user-id") || "anonymous";
    const sanitizedInput = sanitizeInput(userInput);
    const messages = [{ role: "user", content: sanitizedInput }];

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, messages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.text();
        } catch (textError) {
          console.error("Failed to read response body:", textError);
          errorBody = "Could not retrieve error details";
        }
        console.error("Error Response Status:", response.status);
        console.error("Error Response Body:", errorBody);
        throw new Error("API request failed");
      }

      return response.body; // Kembaliin body dari response untuk diproses
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
        return null;
      }
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Update fungsi processStream
  const processStream = async (
    stream: ReadableStream<Uint8Array>,
    onResponse: (response: string) => void
  ) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedResponse = "";

    try {
      let jsonStr;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          if (line.startsWith("data: ")) {
            try {
              jsonStr = line.slice(6).trim(); // Remove 'data: ' prefix

              // Check for outer [DONE] signal
              if (jsonStr === "[DONE]") break;

              const outerData = JSON.parse(jsonStr);

              // Check for inner [DONE] signal
              if (outerData.response === "data: [DONE]\n\n") {
                break;
              }

              // Parse the nested data string
              if (
                outerData.response &&
                outerData.response.startsWith("data: ")
              ) {
                const innerJsonStr = outerData.response.slice(6).trim();

                // Skip if it's a [DONE] signal
                if (innerJsonStr === "[DONE]") {
                  break;
                }

                try {
                  const innerData = JSON.parse(innerJsonStr);

                  if (innerData.response) {
                    accumulatedResponse += innerData.response;
                    onResponse(accumulatedResponse);
                  }
                } catch (innerError) {
                  // Only log if it's not a [DONE] signal
                  if (innerJsonStr !== "[DONE]") {
                    console.warn(
                      "Failed to parse inner JSON:",
                      innerJsonStr,
                      innerError
                    );
                  }
                }
              }
            } catch (error) {
              // Only log if it's not a [DONE] signal
              if (jsonStr !== "[DONE]") {
                console.warn("Failed to parse outer JSON:", line, error);
              }
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
    console.log("Trimmed Input:", trimmedInput);
    if (!trimmedInput || isLoading) return;

    setInputText("");
    setIsLoading(true);
    addMessage(trimmedInput, "user");
    addMessage("", "assistant");

    try {
      if (isImageRequest(trimmedInput)) {
        const generatedImageUrl = await sendImageRequest(trimmedInput);
        if (generatedImageUrl) {
          updateLastAssistantMessage(generatedImageUrl); // Update message terakhir
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

// Tambahin fungsi ini di dalam komponen ChatInterface
const formatMessage = (rawContent: string) => {
  if (!rawContent) return { content: "" };

  let formattedContent = rawContent;

  // Handle basic text formatting
  formattedContent = formattedContent
    // Handle paragraphs
    .split("\n\n")
    .map((para) => `<p>${para}</p>`)
    .join("");

  // Handle numbered lists
  formattedContent = formattedContent.replace(
    /(?:^|\n)(\d+)\.\s+([^\n]+)/g,
    (_, num, text) => `<li>${text.trim()}</li>`
  );

  // Wrap lists in <ol> if they exist
  if (formattedContent.includes("<li>")) {
    formattedContent = `<ol>${formattedContent}</ol>`;
  }

  // Handle inline code
  formattedContent = formattedContent.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  );

  // Handle code blocks
  formattedContent = formattedContent.replace(
    /```([\s\S]*?)```/g,
    (_, code) => `
      <pre class="code-block">
        <code>${code.trim()}</code>
      </pre>
    `
  );

  // Handle bold text
  formattedContent = formattedContent.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  // Handle italic text
  formattedContent = formattedContent.replace(/\*(.*?)\*/g, "<em>$1</em>");

  return {
    content: formattedContent,
  };
};

export default ChatInterface;
