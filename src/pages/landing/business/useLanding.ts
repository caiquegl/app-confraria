import { useCallback, useEffect, useState } from "react";

import {
  getWelcomeModalShown,
  setWelcomeModalShown,
} from "../services/landing.service";
import type { UseLandingResult } from "../types/landing.types";

export function useLanding(): UseLandingResult {
  const [modalVisible, setModalVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getWelcomeModalShown().then((alreadyShown) => {
      setModalVisible(!alreadyShown);
      setIsReady(true);
    });
  }, []);

  const handleModalContinue = useCallback(async () => {
    setModalVisible(false);
    await setWelcomeModalShown();
  }, []);

  return {
    handleModalContinue,
    isReady,
    modalVisible,
  };
}
