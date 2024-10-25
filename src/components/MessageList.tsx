import React from "react";
import { Message } from "../ChatInterface"; // Import tipe `Message`

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string; // Tambahin className
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  messagesEndRef,
  className,
}) => (
  <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}>
    {messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${
          message.sender === "user" ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            message.sender === "user"
              ? "bg-blue-500 bg-opacity-60 text-white"
              : "bg-gray-200 bg-opacity-60 dark:bg-gray-700 dark:bg-opacity-60"
          }`}
        >
          <div
            className="text-sm md:text-base opacity-70 mb-1"
            style={{ fontSize: "1rem" }}
          >
            {" "}
            {/* Set font size manual */}
            {message.username} • {message.timestamp.toLocaleTimeString()}
          </div>
          <div className="text-base md:text-lg" style={{ fontSize: "1.2rem" }}>
            {" "}
            {/* Set font size manual */}
            {message.text}
          </div>
        </div>
      </div>
    ))}
    {isTyping && (
      <div className="flex gap-2 items-center text-gray-500">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>
);

export default MessageList;
