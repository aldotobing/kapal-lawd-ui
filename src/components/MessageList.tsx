import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => {
    setShowThinking(isLoading && messages.some((msg) => msg.type === "user"));
  }, [isLoading, messages]);

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === "user";
    const formattedTime = message.timestamp
      ? format(message.timestamp, "HH:mm")
      : "Invalid Date";

    return (
      <div
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 ml-5`}
      >
        <div className={`max-w-[95%] ${isUser ? "order-2" : "order-1"}`}>
          <div className="flex flex-col">
            <div
              className={`px-4 py-2 rounded-lg text-base ${
                isUser
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "dark:text-white rounded-bl-none"
              }`}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked(message.content.trim())),
                }}
              />
            </div>
            <div
              className={`text-xs mt-1 ${isUser ? "text-right" : "text-left"}`}
            >
              <p className="text-white text-[10px] ml-4">{formattedTime}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {showThinking && (
        <div className="thinking-indicator text-white text-sm p-2 mt-4 ml-6 animate-pulse">
          Thinking...
        </div>
      )}
    </div>
  );
};

export default MessageList;
