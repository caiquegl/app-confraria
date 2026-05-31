import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { registerUser } from "../services/wizard.service";
import type { UseWizardResult, WizardFormData } from "../types/wizard.types";

const TOTAL_STEPS = 5;

function getErrorMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Erro ao criar conta. Tente novamente."
  );
}

export function useWizard(): UseWizardResult {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({});
  const [isPreparingProfile, setIsPreparingProfile] = useState(false);

  const registerPromiseRef = useRef<Promise<unknown> | null>(null);
  const dismissedRef = useRef(false);

  const isLastStep = currentStep === TOTAL_STEPS;

  const goNext = useCallback((stepData: WizardFormData) => {
    const merged = { ...formData, ...stepData };
    setFormData(merged);

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      return;
    }

    dismissedRef.current = false;
    setIsPreparingProfile(true);

    registerPromiseRef.current = registerUser(merged as Required<WizardFormData>).catch((err) => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        setIsPreparingProfile(false);
        Toast.show({
          type: "error",
          text1: "Erro no cadastro",
          text2: getErrorMessage(err),
          visibilityTime: 4000,
        });
      }
      throw err;
    });
  }, [currentStep, formData]);

  const onPreparingComplete = useCallback(async () => {
    if (dismissedRef.current) return;

    try {
      await registerPromiseRef.current;
      if (dismissedRef.current) return;

      setIsPreparingProfile(false);
      Toast.show({
        type: "success",
        text1: "Conta criada!",
        text2: "Bem-vindo à Confraria 🏍️",
        visibilityTime: 3000,
      });
      router.replace("/feed");
    } catch {
      // erro já tratado no catch do registerUser
    }
  }, []);

  const goBack = useCallback(() => {
    if (isPreparingProfile) return;

    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      router.back();
    }
  }, [currentStep, isPreparingProfile]);

  const submitForm = useCallback(async () => {
    goNext({});
  }, [goNext]);

  return {
    currentStep,
    formData,
    goBack,
    goNext,
    isLastStep,
    isPreparingProfile,
    onPreparingComplete,
    submitForm,
    userName: formData.firstName ?? "",
  };
}
