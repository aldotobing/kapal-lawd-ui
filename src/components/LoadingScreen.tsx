import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../assets/LoadingScreen.css";

interface LoadingScreenProps {
  minimumDuration?: number;
  onLoadingComplete: () => void;
  steps?: string[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  minimumDuration = 1000,
  onLoadingComplete,
  steps = ["Initializing...", "Loading models...", "Ready!"],
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [, setIsExiting] = useState(false);
  const startTime = Date.now();

  const handleLoadingSequence = useCallback(() => {
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep < steps.length - 1) {
          return prevStep + 1;
        }
        clearInterval(interval);
        return prevStep;
      });
    }, 600);

    return interval;
  }, [steps.length]);

  useEffect(() => {
    const interval = handleLoadingSequence();
    const loadingTimeout = setTimeout(() => {
      setShowCheckmark(true);
    }, Math.max(minimumDuration - (Date.now() - startTime), 500));

    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onLoadingComplete, 500);
    }, Math.max(minimumDuration - (Date.now() - startTime) + 500, 0));

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
      clearTimeout(exitTimeout);
    };
  }, [minimumDuration, onLoadingComplete, handleLoadingSequence, startTime]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 flex justify-center items-center flex-col bg-gradient-to-br 
          from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-sf-pro
          transition-all duration-800 ease-ios`}
        role="progressbar"
        aria-valuetext={steps[currentStep]}
      >
        {!showCheckmark ? (
          <motion.div
            className="flex flex-col items-center space-y-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <div className="w-8 h-8 relative">
              <svg
                className="animate-spin-slow"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-600 dark:text-gray-300"
            >
              {steps[currentStep]}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-500"
          >
            <svg className="w-16 h-16" viewBox="0 0 52 52">
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
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen;
