import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
  isImage?: boolean;
  imageUrl?: string;
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
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1`}>
        <div className={`max-w-[95%] ${isUser ? "order-2" : "order-1"} -ml-1`}>
          <div className="flex flex-col">
            <div
              className={`px-2 py-1 text-base transition-all duration-200 ${
                isUser
                  ? "bg-blue-500 text-white rounded-lg rounded-br-none"
                  : " dark:text-white rounded-md rounded-bl-none"
              }`}
            >
              <MessageContent message={message} />
            </div>
            <div
              className={`mt-1 text-[15px] tracking-wide text-gray-400 ${
                isUser ? "text-right" : "text-left"
              }`}
            >
              <p className="ml-2 text-xs">{formattedTime}</p>
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
      {showThinking && (
        <div className="thinking-indicator text-center text-white text-sm p-1"></div>
      )}
    </div>
  );
};

export default MessageList;
