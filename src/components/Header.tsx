import React from "react";
import { Sun, Moon, Settings } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentLanguage: { code: string; name: string };
  languages: { code: string; name: string }[];
  setCurrentLanguage: (lang: { code: string; name: string }) => void;
}

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleDarkMode,
  //currentLanguage,
  languages,
  setCurrentLanguage,
}) => (
  <div className="p-2 flex justify-between items-center">
    <h1
      className="text-xl font-bold flex items-center ml-5 mt-1"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 400,
        color: "#c4c4c4",
      }}
    >
      <i className="fas fa-terminal mr-3" style={{ color: "#c4c4c4" }}></i>{" "}
      {/* Icon terminal */}
      Kapal Lawd GPT
    </h1>

    <div
      className="flex gap-1 p-2 rounded-xl mr-5"
      style={{ backgroundColor: "#2a2a2a" }}
    >
      <button onClick={toggleDarkMode} className="p-2 rounded-full">
        {isDarkMode ? (
          <Sun size={15} color="#ffffff" />
        ) : (
          <Moon size={15} color="#ffffff" />
        )}
      </button>
      <button className="p-2 rounded-full">
        <Settings size={15} color="#ffffff" />
      </button>
    </div>
  </div>
);

export default Header;
