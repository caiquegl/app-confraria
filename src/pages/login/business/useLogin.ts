import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";

import { loginUser } from "../services/login.service";
import { loginSchema, type LoginFormData } from "../types/login.types";

function getErrorMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Erro ao fazer login. Tente novamente."
  );
}

export function useLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await loginUser(data);
      Toast.show({
        type: "success",
        text1: "Login realizado!",
        text2: "Bem-vindo de volta 🏍️",
        visibilityTime: 3000,
      });
      router.replace("/home");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Erro no login",
        text2: getErrorMessage(err),
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    control,
    errors,
    handleSubmit,
    isSubmitting,
    onSubmit,
  };
}
