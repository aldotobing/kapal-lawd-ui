import "../assets/Thinking.css";

interface ThinkingBubbleProps {
  isVisible?: boolean;
}

const ThinkingIndicator: React.FC<ThinkingBubbleProps> = ({
  isVisible = false,
}) => {
  return (
    <div
      className={`flex justify-start mb-2 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="max-w-[90%] order-1 self-start -ml-1">
        <div className="flex flex-col">
          <div className="flex items-center justify-center space-x-1 text-left">
            <div
              className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-200 animate-pulse"
              style={{
                animationDelay: "0s",
              }}
            ></div>
            <div
              className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-200 animate-pulse"
              style={{
                animationDelay: "0.2s",
              }}
            ></div>
            <div
              className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-200 animate-pulse"
              style={{
                animationDelay: "0.4s",
              }}
            ></div>
            <div className="mt-0.5 text-xs text-gray-400 text-left">
              <p className="ml-1.5">Thinking...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
