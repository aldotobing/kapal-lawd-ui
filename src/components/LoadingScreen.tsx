import { useEffect, useState } from "react";
import "../assets/LoadingScreen.css";

const LoadingSpinner = () => (
  <div className="w-8 h-8 relative">
    <svg className="animate-spin-slow" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="#007AFF"
        strokeWidth="3"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="#007AFF"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

const LoadingScreen = ({ minimumDuration = 5000, onLoadingComplete }) => {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const steps = [
    "Loading...",
    "Checking system health...",
    "Connecting to backend...",
  ];
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      setStep((prevStep) => {
        if (prevStep < steps.length - 1) {
          return prevStep + 1;
        } else {
          clearInterval(interval);
          return prevStep;
        }
      });
    }, 1500);

    const loadingTimeout = setTimeout(() => {
      setShowCheckmark(true);
    }, Math.max(minimumDuration - (Date.now() - startTime), 0));

    // Add exit animation timeout after checkmark appears
    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete before calling onLoadingComplete
      setTimeout(() => {
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 800); // Match this with CSS transition duration
    }, Math.max(minimumDuration - (Date.now() - startTime) + 2000, 0)); // Add 2s delay after minimum duration

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
      clearTimeout(exitTimeout);
    };
  }, [steps.length, minimumDuration, onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 flex justify-center items-center flex-col bg-gradient-to-br from-gray-50 to-gray-100 font-sf-pro
        transition-opacity duration-800 ease-ios
        ${isExiting ? "opacity-0" : "opacity-100"}`}
    >
      {!showCheckmark ? (
        <div className="flex flex-col items-center space-y-6">
          <LoadingSpinner />
          <p className="text-[#8E8E93] font-medium text-lg tracking-tight animate-ios-fade-in">
            {steps[step]}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center scale-100 animate-ios-scale-in">
          <div className="relative w-20 h-20 mb-6">
            <svg className="w-full h-full" viewBox="0 0 52 52">
              <circle
                className="animate-ios-circle-draw"
                cx="26"
                cy="26"
                r="25"
                fill="none"
                stroke="#34C759"
                strokeWidth="2"
              />
              <path
                className="animate-ios-check-draw"
                fill="none"
                stroke="#34C759"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
          </div>
          <p className="text-[#1C1C1E] font-semibold text-xl tracking-tight animate-ios-fade-in-delayed">
            All set! Ready to go!
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
