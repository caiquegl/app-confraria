import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

import { LoginView } from "@/pages/login";

export default function LoginScreen() {
  const { passwordChanged } = useLocalSearchParams<{ passwordChanged?: string }>();

  useEffect(() => {
    if (passwordChanged === "1") {
      Toast.show({
        type: "success",
        text1: "Senha alterada com sucesso!",
        text2: "Faça login com sua nova senha.",
        visibilityTime: 4000,
      });
    }
  }, [passwordChanged]);

  return <LoginView onBack={() => router.back()} />;
}
