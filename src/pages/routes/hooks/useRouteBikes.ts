import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";

import { fetchUserBikes } from "@/pages/bikes/services/bikes.service";
import type { UserBike } from "@/pages/bikes/types/bikes.types";

export function useRouteBikes() {
  const [bikes, setBikes] = useState<UserBike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBikes = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextBikes = await fetchUserBikes();
      setBikes(nextBikes);
      return nextBikes;
    } catch {
      Toast.show({
        text1: "Erro ao carregar motos",
        text2: "Não foi possível buscar suas motos agora.",
        type: "error",
      });
      setBikes([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBikes();
    }, [loadBikes]),
  );

  return {
    bikes,
    isLoading,
    reloadBikes: loadBikes,
  };
}
