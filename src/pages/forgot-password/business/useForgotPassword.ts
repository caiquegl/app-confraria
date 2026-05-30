import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";

import { getApiErrorMessage, requestPasswordReset } from "@/lib/password-reset";

import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../types/forgot-password.types";

export function useForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(data.email);
      router.push({
        params: { email: data.email },
        pathname: "/verify-reset-code",
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Erro ao enviar código",
        text2: getApiErrorMessage(err, "Não foi possível enviar o código. Tente novamente."),
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
