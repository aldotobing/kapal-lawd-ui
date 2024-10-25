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
  currentLanguage,
  languages,
  setCurrentLanguage,
}) => (
  <div className="p-4 border-b flex justify-between items-center">
    <h1 className="text-xl font-bold">Kapal Lawd</h1>
    <div className="flex gap-4">
      <select
        value={currentLanguage.code}
        onChange={(e) =>
          setCurrentLanguage(
            languages.find((lang) => lang.code === e.target.value) ||
              languages[0]
          )
        }
        className="rounded border p-1"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <button onClick={toggleDarkMode} className="p-2 rounded-full">
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button className="p-2 rounded-full">
        <Settings size={20} />
      </button>
    </div>
  </div>
);

export default Header;
