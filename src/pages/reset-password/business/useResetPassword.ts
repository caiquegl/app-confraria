import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";

import { getApiErrorMessage, resetPassword } from "@/lib/password-reset";

import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../types/reset-password.types";

export function useResetPassword(email: string, code: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await resetPassword({
        code,
        email,
        password: data.password,
      });
      router.replace({
        params: { passwordChanged: "1" },
        pathname: "/login",
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Erro ao alterar senha",
        text2: getApiErrorMessage(err, "Não foi possível alterar a senha. Tente novamente."),
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
