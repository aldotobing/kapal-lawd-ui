import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { marked } from "marked";
import DOMPurify from "dompurify";
import ThinkingIndicator from "./ThinkingIndicator";

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
          className="max-w-full rounded-lg"
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
      return (
        <div
          className="text-base"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
      );
    }

    return (
      <div
        className="text-base"
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
      <div
        className={`flex ${
          isUser ? "justify-end" : "justify-start"
        } mb-4 items-end`}
      >
        <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
          <div className="flex flex-col">
            <div
              className={`px-4 py-3 text-base rounded-2xl ${
                isUser
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-white"
              } shadow-md`}
            >
              <MessageContent message={message} />
            </div>
            <div
              className={`mt-1 text-xs text-gray-400 ${
                isUser ? "text-right" : "text-left"
              }`}
            >
              <p>{formattedTime}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 relative overflow-y-auto h-full">
      <div className="space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {showThinking && <ThinkingIndicator isVisible={true} />}
      </div>
    </div>
  );
};

export default MessageList;
