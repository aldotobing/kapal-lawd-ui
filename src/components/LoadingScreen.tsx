import { useEffect, useState } from "react";

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    "Processing data...",
    "Connecting to backend...",
    "Finalizing setup...",
  ];
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prevStep) => {
        if (prevStep < steps.length - 1) {
          return prevStep + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCheckmark(true), 4500); // Show checkmark after 1 second
          return prevStep;
        }
      });
    }, 1500); // Delay between steps
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="loader-container">
      {!showCheckmark ? (
        <>
          <div className="loader"></div>
          <p>{steps[step]}</p>
        </>
      ) : (
        <div className="checkmark-container">
          <div className="checkmark">✔</div>
          <p>All set! Ready to go!</p>
        </div>
      )}
    </div>
  );
}

export default LoadingScreen;
