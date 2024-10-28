import React from "react";
import { format } from "date-fns";

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
        <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
          <div
            className={`px-4 py-2 rounded-lg text-base ${
              isUser
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-200 dark:bg-[#3a3a3a] dark:text-white rounded-bl-none"
            }`}
            style={{ fontSize: "18px" }} // Tambahkan ini buat atur ukuran font
          >
            {message.content || (isLoading ? "..." : "Error: Empty message")}
          </div>
          <div
            className={`text-xs text-gray-500 mt-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {format(message.timestamp, "HH:mm")}
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
