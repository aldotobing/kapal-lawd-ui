import React, { useEffect, useState } from "react";

const ThinkingIndicator = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length < 3) return prevDots + ".";
        return "";
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="thinking-indicator fixed bottom-20 left-1/2 transform -translate-x-1/2 text-center text-sm italic text-gray-400">
      Thinking{dots}
    </div>
  );
};

export default ThinkingIndicator;
