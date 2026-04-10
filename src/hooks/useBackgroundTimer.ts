import { useState, useEffect } from 'react';

export const useBackgroundTimer = (limitMinutes: number = 20) => {
  const [activeTime, setActiveTime] = useState(0); // in seconds
  const [showWellnessModal, setShowWellnessModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTime((prev) => {
        const next = prev + 1;
        if (next >= limitMinutes * 60 && !showWellnessModal) {
          setShowWellnessModal(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [limitMinutes, showWellnessModal]);

  const resetTimer = () => {
    setActiveTime(0);
    setShowWellnessModal(false);
  };

  return { activeTime, showWellnessModal, setShowWellnessModal, resetTimer };
};
