import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import { Mic, Upload, ArrowUp } from "lucide-react"; // ArrowUp untuk tombol kirim

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot" | "bot-temp";
  timestamp: Date;
  username: string;
}

interface Language {
  code: string;
  name: string;
}

const ChatInterface: React.FC = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>({
    code: "en",
    name: "English",
  });
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref buat autoscroll

  const languages: Language[] = [
    { code: "en", name: "English" },
    { code: "id", name: "Bahasa Indonesia" },
  ];

  // Scroll otomatis setiap kali pesan berubah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      username: "User",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const stream = await fetchBotResponse(newMessage.text);
      await processStream(stream);
    } catch (error) {
      console.error("Error fetching bot response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Something went wrong, please try again.",
          sender: "bot",
          timestamp: new Date(),
          username: "AI Assistant",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const fetchBotResponse = async (userInput: string) => {
    const response = await fetch(
      "https://kapal-lawd-be.aldo-tobing.workers.dev/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a friendly assistant" },
            { role: "user", content: userInput },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch bot response");
    }

    return response.body;
  };

  const processStream = async (stream: ReadableStream<Uint8Array> | null) => {
    if (!stream) return;

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let botResponse = "";

    const tempMessageId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempMessageId,
        text: "",
        sender: "bot-temp",
        timestamp: new Date(),
        username: "AI Assistant",
      },
    ]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const messages = chunk.split("\n");

      messages.forEach((message) => {
        if (message.startsWith("data:")) {
          const jsonStr = message.slice(5).trim();

          if (jsonStr === "[DONE]") {
            return;
          }

          try {
            const data = JSON.parse(jsonStr);
            if (data.response) {
              botResponse += data.response;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempMessageId ? { ...msg, text: botResponse } : msg
                )
              );
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      });
    }

    setMessages((prev) => [
      ...prev.filter((msg) => msg.id !== tempMessageId),
      {
        id: Date.now().toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
        username: "AI Assistant",
      },
    ]);
  };

  const handleVoiceInput = () => setIsListening(!isListening);

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentLanguage={currentLanguage}
        languages={languages}
        setCurrentLanguage={setCurrentLanguage}
      />
      <MessageList
        messages={messages}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        className="chat-container"
      />
      <div className="input-area flex flex-wrap items-center gap-2 p-2 bg-white rounded-md">
        <button
          onClick={handleVoiceInput}
          className={`voice-button ${
            isListening ? "active" : ""
          } flex-shrink-0`}
        >
          <Mic size={20} />
        </button>
        <label className="upload-button flex-shrink-0">
          <Upload size={20} />
          <input type="file" className="hidden" />
        </label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="input-field flex-grow min-w-[150px] md:min-w-[200px] text-base"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="send-button flex-shrink-0"
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;
