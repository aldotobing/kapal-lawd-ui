import React from "react";
import { format } from "date-fns";
import { marked } from "marked"; // Pastikan marked diimport
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
  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === "user";

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[100%] ${isUser ? "order-2" : "order-1"}`}>
          <div className={`flex flex-col`}>
            <div
              className={`px-4 py-2 rounded-lg text-base ${
                isUser
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "dark:text-white rounded-bl-none ml-2"
              }`}
              style={{ fontSize: "18px" }}
            >
              {/* Render markdown yang sudah disanitasi */}
              {message.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(message.content.trim())), // Sanitasi konten
                  }}
                />
              ) : isLoading ? (
                <div className="spinner"></div>
              ) : (
                "Error: Empty message"
              )}
            </div>
            <div
              className={`text-xs text-gray-500 mt-1 ${
                isUser ? "text-right" : "text-left"
              } ml-6`}
            >
              {format(message.timestamp, "HH:mm")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[#3a3a3a] rounded-lg px-4 py-2 animate-pulse">
            <div className="h-4 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
