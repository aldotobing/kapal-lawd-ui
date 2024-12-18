import { useEffect, useState } from "react";
import "../assets/LoadingScreen.css";

function LoadingScreen({
  minimumDuration = 5000,
}: {
  minimumDuration?: number;
}) {
  const [step, setStep] = useState(0);
  const steps = [
    "Processing data...",
    "Checking system health...",
    "Connecting to backend...",
    "Finalizing setup...",
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
    }, 1500); // Delay between steps

    const timeout = setTimeout(() => {
      setShowCheckmark(true);
    }, Math.max(minimumDuration - (Date.now() - startTime), 0));

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [steps.length, minimumDuration]);

  return (
    <div className="loader-container">
      {!showCheckmark ? (
        <>
          <div className="loader">{/* <div className="spinner"></div> */}</div>
          <p className="loading-text">{steps[step]}</p>
        </>
      ) : (
        <div className="checkmark-container fade-in">
          <div className="checkmark">✔</div>
          <p className="completion-text">All set! Ready to go!</p>
        </div>
      )}
    </div>
  );
}

export default LoadingScreen;
