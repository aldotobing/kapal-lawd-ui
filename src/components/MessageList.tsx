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
  isLoading: boolean | string;
  onSendMessage: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const [showThinking, setShowThinking] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Detect new messages
  useEffect(() => {
    if (messages.length > 0) {
      setHasSentMessage(true);
    }
  }, [messages]);

  // Control when to show "Thinking..."
  useEffect(() => {
    if (isLoading && hasSentMessage) {
      setShowThinking(true);
    } else {
      setShowThinking(false);
    }
  }, [isLoading, hasSentMessage]);

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === "user";

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[100%] ${isUser ? "order-2" : "order-1"}`}>
          <div className="flex flex-col">
            <div
              className={`px-4 py-2 rounded-lg text-base ${
                isUser
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "dark:text-white rounded-bl-none ml-2"
              }`}
              style={{ fontSize: "18px" }}
            >
              {message.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(message.content.trim())),
                  }}
                />
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
      {showThinking && (
        <div className="flex justify-start">
          <div className="px-2 py-1">
            <span className="blink text-left text-white">Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;