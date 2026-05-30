import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";

import { getApiErrorMessage, verifyResetCode } from "@/lib/password-reset";

import {
  verifyResetCodeSchema,
  type VerifyResetCodeFormData,
} from "../types/verify-reset-code.types";

export function useVerifyResetCode(email: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyResetCodeFormData>({
    defaultValues: {
      code: "",
    },
    resolver: zodResolver(verifyResetCodeSchema),
  });

  const onSubmit = async (data: VerifyResetCodeFormData) => {
    setIsSubmitting(true);
    try {
      await verifyResetCode(email, data.code);
      router.push({
        params: { code: data.code, email },
        pathname: "/reset-password",
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Código inválido",
        text2: getApiErrorMessage(err, "Verifique o código e tente novamente."),
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
