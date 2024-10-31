// Translate.tsx
import React, { useState } from "react";
import { translateToEnglish } from "./components/Translate";

type TranslateProps = {
  onTranslate: (translatedMessage: string) => void; // Callback untuk hasil terjemahan
};

const Translate: React.FC<TranslateProps> = ({ onTranslate }) => {
  const [userMessage, setUserMessage] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk handle terjemahan
  const handleTranslate = async () => {
    setIsTranslating(true);
    setError(null);

    try {
      const translatedMessage = await translateToEnglish(userMessage);

      if (!translatedMessage) {
        setError("Terjemahan gagal atau kosong");
        return;
      }

      // Kirim hasil terjemahan ke parent via onTranslate prop
      onTranslate(translatedMessage);

      // Reset pesan user
      setUserMessage("");
    } catch (error) {
      console.error("Error translating message:", error);
      setError("Error menerjemahkan pesan, coba lagi.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div>
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Ketik pesan dalam bahasa Indonesia"
        disabled={isTranslating}
      />
      <button onClick={handleTranslate} disabled={isTranslating}>
        {isTranslating ? "Menerjemahkan..." : "Terjemahkan"}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Translate;
