import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
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
  imageUrl?: string;
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
const TRANSLATE_API_URL = "https://ai.aldo-tobing.workers.dev/";
const REACT_APP_WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
    main: string;
  }>;
  wind: {
    speed: number;
  };
}
interface WeatherContext {
  location: string;
  data: WeatherData | null;
  lastUpdated: Date;
}

// Function to check if the input is a request for an image
const isImageRequest = (input: string): boolean => {
  const keywords = [
    "make an image",
    "make a picture of",
    "make me a picture of",
    "make me an image of",
    "a picture of",
    "create an image",
    "generate an image",
    "gambarkan",
    "buatkan saya gambar",
    "buatkan gambar",
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

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

// Function to send translation request
const translatePrompt = async (content: string): Promise<string> => {
  try {
    const response = await fetch(TRANSLATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Please process the following message as follows: If the message is in Indonesian, translate it to English. If the message is already in English, improve its clarity and quality without providing any explanations or justifications. Return only the modified message: ${content}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data = await response.json();

    // Ambil isi dari response tanpa parsing
    if (data && data[0] && data[0].response && data[0].response.response) {
      return data[0].response.response; // Kembalikan string yang dihasilkan
    } else {
      console.error("Translation API did not return expected structure", data);
      return content; // Kembaliin konten asli jika gagal
    }
  } catch (error) {
    console.error("Error during translation:", error);
    return content; // Kembaliin konten asli jika ada error
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
  const userId = useRef(localStorage.getItem("user-id") || uuidv4());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherContext, setWeatherContext] = useState<WeatherContext | null>(
    null
  );

  const extractWeatherIntent = (
    input: string
  ): { isWeather: boolean; location?: string } => {
    const weatherPatterns = [
      { regex: /weather\s+(?:in|at|for)\s+([a-zA-Z\s]+)/i, group: 1 },
      { regex: /cuaca\s+(?:di|untuk)\s+([a-zA-Z\s]+)/i, group: 1 },
      {
        regex: /(?:what's|how's)\s+the\s+weather\s+(?:in|at)\s+([a-zA-Z\s]+)/i,
        group: 1,
      },
      { regex: /bagaimana\s+cuaca\s+(?:di|untuk)\s+([a-zA-Z\s]+)/i, group: 1 },
    ];

    for (const pattern of weatherPatterns) {
      const match = input.match(pattern.regex);
      if (match) {
        return { isWeather: true, location: match[pattern.group].trim() };
      }
    }

    const generalWeatherKeywords = [
      "weather",
      "cuaca",
      "temperature",
      "suhu",
      "forecast",
      "prakiraan cuaca",
    ];

    if (
      generalWeatherKeywords.some((keyword) =>
        input.toLowerCase().includes(keyword)
      )
    ) {
      return { isWeather: true };
    }

    return { isWeather: false };
  };

  // Function to fetch weather data
  const fetchWeatherData = async (
    location?: string,
    latitude?: number,
    longitude?: number
  ): Promise<WeatherData | null> => {
    try {
      const url =
        latitude && longitude
          ? `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${REACT_APP_WEATHER_API_KEY}&lang=id&units=metric`
          : `${WEATHER_API_URL}?q=${encodeURIComponent(
              location || "Jakarta"
            )}&appid=${REACT_APP_WEATHER_API_KEY}&lang=id&units=metric`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Weather data fetch failed");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Weather fetch error:", error);
      return null;
    }
  };

  const generateWeatherWidget = (weatherData: WeatherData) => {
    return `
      <div class="weather-widget bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md my-2">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white">${
              weatherData.name
            }</h2>
            <p class="text-gray-600 dark:text-gray-300 capitalize">${
              weatherData.weather[0].description
            }</p>
          </div>
          <img 
            src="https://openweathermap.org/img/wn/${
              weatherData.weather[0].icon
            }@2x.png" 
            alt="Weather Icon" 
            class="w-16 h-16"
          />
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Temp</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white">${weatherData.main.temp.toFixed(
              1
            )}°C</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Feels Like</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white">${weatherData.main.feels_like.toFixed(
              1
            )}°C</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Humidity</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white">${
              weatherData.main.humidity
            }%</p>
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Wind Speed: ${weatherData.wind.speed} m/s
        </div>
      </div>
    `;
  };

  const generateWeatherDescription = (weatherData: WeatherData): string => {
    const temp = weatherData.main.temp;
    const feelsLike = weatherData.main.feels_like;
    const humidity = weatherData.main.humidity;
    const description = weatherData.weather[0].description;
    const windSpeed = weatherData.wind.speed;

    let commentary = "";

    // Temperature commentary
    if (temp >= 30) {
      commentary += "Hari ini cukup panas. ";
    } else if (temp >= 25) {
      commentary += "Suhunya hangat. ";
    } else if (temp >= 20) {
      commentary += "Suhunya nyaman. ";
    } else {
      commentary += "Suhunya relatif sejuk. ";
    }

    // Feels like commentary
    if (Math.abs(temp - feelsLike) > 2) {
      commentary += `Suhu sebenarnya adalah ${temp.toFixed(
        1
      )}°C, terasa seperti ${feelsLike.toFixed(1)}°C. `;
    }

    // Humidity commentary
    if (humidity > 80) {
      commentary +=
        "Kelembapan sangat tinggi, yang mungkin membuat terasa kurang nyaman. ";
    } else if (humidity < 30) {
      commentary += "Udara hari ini cukup kering. ";
    }

    commentary += `Saat ini, cuacanya ${description}. `;

    if (windSpeed > 10) {
      commentary += `Selain itu, anginnya cukup kencang dengan kecepatan ${windSpeed.toFixed(
        1
      )} m/s.`;
    } else if (windSpeed > 5) {
      commentary += `Ada angin sepoi-sepoi dengan kecepatan ${windSpeed.toFixed(
        1
      )} m/s.`;
    } else {
      commentary += `Kecepatan angin tenang di ${windSpeed.toFixed(1)} m/s.`;
    }

    return commentary;
  };

  // Save user ID to localStorage (only once).
  useEffect(() => {
    localStorage.setItem("user-id", userId.current);
  }, []);

  // Refs
  useLayoutEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort(); // Clean up on unmount.
  }, []);

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
    isImage: boolean = false,
    imageUrl?: string
  ): Message => ({
    id: uuidv4(),
    content,
    type,
    timestamp: new Date(),
    isImage,
    imageUrl,
  });

  // Message Handlers
  const addMessage = (
    content: string,
    type: MessageType,
    isImage: boolean = false,
    imageUrl?: string
  ) => {
    setMessages((prev) => [
      ...prev,
      createMessage(content, type, isImage, imageUrl),
    ]);
  };

  const updateLastAssistantMessage = (rawContent: string) => {
    const formatted = formatMessage(rawContent);
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastAssistantIndex = newMessages.length - 1;
      if (
        lastAssistantIndex >= 0 &&
        newMessages[lastAssistantIndex].type === "assistant"
      ) {
        newMessages[lastAssistantIndex].content = formatted.content;
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

    const sanitizedInput = sanitizeInput(userInput);
    const messagesPayload = [{ role: "user", content: sanitizedInput }];

    if (weatherContext) {
      messagesPayload.unshift({
        role: "system",
        content: `Current weather context: Location: ${weatherContext.location}, 
                 Temperature: ${weatherContext.data?.main.temp}°C, 
                 Condition: ${weatherContext.data?.weather[0].description}`,
      });
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId.current,
          messages: messagesPayload,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("API request failed");

      return response.body;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Modify handleWeatherRequest to explicitly set isHTML flag
  const handleWeatherRequest = async (location?: string) => {
    setIsWeatherLoading(true);
    addMessage("Menghubungi pakar Cuaca...", "assistant");
    setTimeout(async () => {
      // Fungsi untuk handle fetch data cuaca dengan lokasi atau fallback
      const fetchWithLocation = async () => {
        if (location) {
          // Jika lokasi diberikan, pakai nama kota tersebut
          return await fetchWeatherData(location);
        } else if (navigator.geolocation) {
          // Jika lokasi tidak diberikan, coba dapatkan koordinat user
          return new Promise<WeatherData | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                const data = await fetchWeatherData(
                  undefined,
                  latitude,
                  longitude
                );
                resolve(data);
              },
              async (error) => {
                console.error("Geolocation error:", error);
                const fallbackData = await fetchWeatherData("Jakarta"); // Default fallback
                resolve(fallbackData);
              }
            );
          });
        } else {
          return await fetchWeatherData("Jakarta");
        }
      };

      // Panggil fetch dengan handling lokasi
      const weatherData = await fetchWithLocation();

      if (weatherData) {
        setWeatherContext({
          location: location || "Your location",
          data: weatherData,
          lastUpdated: new Date(),
        });

        const weatherDescription = generateWeatherDescription(weatherData);
        const response = `${weatherDescription}\n${generateWeatherWidget(
          weatherData
        )}\n\nData provided by <em style="color: #eb6e4b;">OpenWeather</em>.`;

        setMessages((prev) => {
          const newMessages = prev.filter(
            (msg) => msg.content !== "Menghubungi pakar Cuaca..."
          );
          return [
            ...newMessages,
            {
              id: uuidv4(),
              content: response,
              type: "assistant",
              timestamp: new Date(),
              isHTML: true,
            },
          ];
        });
      } else {
        updateLastAssistantMessage(
          `I'm sorry, I couldn't find weather information for ${
            location || "your location"
          }. Could you please verify the location name or try another city?`
        );
      }

      setIsWeatherLoading(false);
    }, 2000); // Add a 2-second loading delay
  };

  // Add CSS to ensure proper widget rendering
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .message-widget {
        margin: 1rem 0;
      }
      .weather-widget {
        overflow: hidden;
        transition: all 0.3s ease;
      }
      .weather-widget img {
        display: block;
        width: 64px;
        height: 64px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update fungsi processStream
  const processStream = async (
    stream: ReadableStream<Uint8Array>,
    onResponse: (response: string) => void
  ) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedHTML = "";
    let inCodeBlock = false;
    let codeBlockLang = "";

    const updateFrequency = 10; // milliseconds
    let lastUpdate = Date.now();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "" || !line.startsWith("data: ")) continue;

          let jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const outerData = JSON.parse(jsonStr);
            if (outerData.response && outerData.response.startsWith("data: ")) {
              jsonStr = outerData.response.slice(6).trim();
              if (jsonStr === "[DONE]") break;

              const innerData = JSON.parse(jsonStr);
              if (innerData.response) {
                const formattedChunk = formatChunk(
                  innerData.response,
                  inCodeBlock,
                  codeBlockLang
                );
                accumulatedHTML += formattedChunk.content;

                // Update code block state
                inCodeBlock = formattedChunk.inCodeBlock;
                codeBlockLang = formattedChunk.codeBlockLang || "";

                // Only update on a specific interval to smooth out rendering
                if (Date.now() - lastUpdate > updateFrequency) {
                  onResponse(accumulatedHTML);
                  lastUpdate = Date.now();
                }
              }
            }
          } catch (error) {
            console.warn("Failed to parse JSON:", line, error);
          }
        }
      }
      // Final flush of any remaining content
      if (accumulatedHTML) {
        onResponse(accumulatedHTML);
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Enhanced formatChunk function to handle code blocks
  const formatChunk = (
    chunk: string,
    inCodeBlock: boolean,
    codeBlockLang: string
  ) => {
    let result = {
      content: "",
      inCodeBlock: inCodeBlock,
      codeBlockLang: codeBlockLang,
    };

    if (chunk.trim().startsWith("```")) {
      if (!inCodeBlock) {
        // Start of new code block
        const langMatch = chunk.match(/^```(\w*)/);
        result.inCodeBlock = true;
        result.codeBlockLang = langMatch ? langMatch[1] : "";
        result.content = `<div class="code-box"><pre class="code-block" data-language="${result.codeBlockLang}"><code>`;
        return result;
      } else {
        // End of existing code block
        result.inCodeBlock = false;
        result.codeBlockLang = "";
        result.content = `</code></pre></div>`;
        return result;
      }
    }

    if (inCodeBlock) {
      // Inside a code block, no special formatting needed except escaping HTML
      result.content = chunk
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    } else {
      // Outside of code blocks, apply all other formatting
      result.content = chunk
        .replace(/\n/g, "<br/>")
        .replace(/`([^`\r\n]+)`/g, '<code class="inline-code">$1</code>')
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/~~(.*?)~~/g, "<del>$1</del>");
    }

    return result;
  };

  // Event Handlers
  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading) return;

    let translated = "";

    setInputText("");
    setIsLoading(true);
    addMessage(trimmedInput, "user");

    try {
      const weatherIntent = extractWeatherIntent(trimmedInput);
      if (weatherIntent.isWeather) {
        await handleWeatherRequest(weatherIntent.location);
        //addMessage("Fetching weather data...", "assistant");
      } else if (isImageRequest(trimmedInput)) {
        translated = await translatePrompt(trimmedInput);

        addMessage("Generating image...", "assistant");
        const generatedImageUrl = await sendImageRequest(translated);

        if (generatedImageUrl) {
          const imageMessage: Message = {
            id: uuidv4(),
            content: "",
            type: "assistant",
            timestamp: new Date(),
            isImage: true,
            imageUrl: generatedImageUrl,
          };

          setMessages((prev) => {
            const newMessages = prev.filter(
              (msg) =>
                !(
                  msg.type === "assistant" &&
                  msg.content === "Membuat Gambar..."
                )
            );
            return [...newMessages, imageMessage];
          });
        } else {
          updateLastAssistantMessage(
            "Maaf, gue sedang nggak bisa bikin gambar x_x. Silakan dicoba lagi"
          );
        }
      } else {
        addMessage("", "assistant");
        const stream = await sendMessageToAPI(trimmedInput);
        if (stream) {
          await processStream(stream, (response) =>
            updateLastAssistantMessage(response)
          );
        }
      }
    } catch (error) {
      console.error(error);
      updateLastAssistantMessage("Error kwkwkwk. Please try again.");
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

      <div className="flex-grow overflow-y-auto ml-1 chat-container">
        <MessageList messages={messages} isLoading={isLoading} />
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
          placeholder="Apa yang bisa saya bantu?"
          className="input-field flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-full
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             dark:bg-[#4a4a4a] dark:text-white"
          style={{ marginRight: "-6px" }}
          disabled={isLoading}
        />

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          className={`send-button text-white ${
            !inputText.trim() || isLoading ? "bg-grey-500" : "bg-blue-500"
          }`}
          style={{ marginRight: "-1px" }} // Inline style override
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

  // Check if the content contains a weather widget
  const hasWeatherWidget = rawContent.includes('class="weather-widget"');

  if (hasWeatherWidget) {
    // Split the content into text and widget parts
    const [textPart, ...widgetParts] = rawContent.split(
      '<div class="weather-widget"'
    );

    // Format the text part
    let formattedContent = textPart;

    // Add the widget back with proper formatting
    if (widgetParts.length > 0) {
      formattedContent += `<div class="message-widget"><div class="weather-widget"${widgetParts.join(
        '<div class="weather-widget"'
      )}</div>`;
    }

    return {
      content: formattedContent,
      isHTML: true,
    };
  }

  let formattedContent = rawContent;

  // Handle paragraphs
  formattedContent = formattedContent
    .split("\n\n")
    .map((para) => `<p>${para}</p>`)
    .join("");

  // Handle paragraphs
  formattedContent = formattedContent
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

  // Handle bullet lists
  formattedContent = formattedContent.replace(
    /(?:^|\n)- (.+)/g,
    (_, text) => `<li>${text.trim()}</li>`
  );
  if (formattedContent.includes("<li>") && !formattedContent.includes("<ol>")) {
    formattedContent = `<ul>${formattedContent}</ul>`;
  }

  // Handle inline code
  formattedContent = formattedContent.replace(
    /`([^`\r\n]+)`/g,
    '<code class="inline-code">$1</code>'
  );

  // Handle code blocks with syntax highlighting
  formattedContent = formattedContent.replace(
    /```(\w*)\s*\n?([\s\S]*?)\n?```/g,
    (_, lang, code) => `
      <pre class="code-block" data-language="${lang || "plaintext"}">
        <code>${code.trim()}</code>
      </pre>
    `
  );

  // Handle bold text
  formattedContent = formattedContent
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Handle italic text
  formattedContent = formattedContent
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>");

  // Handle strikethrough
  formattedContent = formattedContent.replace(/~~(.*?)~~/g, "<del>$1</del>");

  // Handle links
  formattedContent = formattedContent.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return {
    content: formattedContent,
    isHTML: false,
  };
};

export default ChatInterface;
