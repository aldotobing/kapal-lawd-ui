import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { marked } from "marked";
import DOMPurify from "dompurify";
import ThinkingIndicator from "./Thingking";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
  isImage?: boolean;
  imageUrl?: string;
  isHTML?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const [showThinking, setShowThinking] = useState(false);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    const currentBlobUrls = blobUrlsRef.current;
    return () => {
      currentBlobUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error revoking blob URL:", error);
        }
      });
    };
  }, []);

  useEffect(() => {
    setShowThinking(isLoading && messages.some((msg) => msg.type === "user"));
  }, [isLoading, messages]);

  const MessageContent = ({ message }: { message: Message }) => {
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (message.isImage && message.imageUrl) {
        blobUrlsRef.current.add(message.imageUrl);
      }
    }, [message.isImage, message.imageUrl]);

    if (message.isImage && message.imageUrl) {
      return (
        <img
          ref={imgRef}
          src={message.imageUrl}
          alt="Generated"
          className="max-w-full h-auto rounded-lg"
          onError={(e) => {
            console.error("Image load error:", e);
            if (message.imageUrl) {
              blobUrlsRef.current.delete(message.imageUrl);
            }
          }}
        />
      );
    }
    if (message.isHTML) {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />;
    }

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(marked(message.content.trim())),
        }}
      />
    );
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === "user";
    const formattedTime = message.timestamp
      ? format(message.timestamp, "HH:mm")
      : "Invalid Date";

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[90%] ${
            isUser ? "order-2 self-end" : "order-1 self-start"
          } -ml-1`}
        >
          <div className="flex flex-col">
            <div
              className={`inline-block text-base transition-all duration-200 ${
                isUser
                  ? "text-white rounded-2xl rounded-br-2xl text-pretty"
                  : "dark:text-white rounded-md rounded-bl-3xl text-pretty"
              }`}
              style={{
                padding: isUser ? "8px 15px" : "1px 10px",
                ...(isUser ? { backgroundColor: "#2f2f2f" } : {}),
                maxWidth: "100%", // Allow bubble to expand to full width of its container
                wordBreak: "break-word",
                alignSelf: isUser ? "flex-end" : "flex-start",
              }}
            >
              <MessageContent message={message} />
            </div>
            <div
              className={`mt-1 text-[12px] tracking-wide text-gray-400 ${
                isUser ? "text-right" : "text-left"
              }`}
            >
              <p className="ml-2.5 text-xs">{formattedTime}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 relative">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {showThinking && <ThinkingIndicator />}
    </div>
  );
};

export default MessageList;
