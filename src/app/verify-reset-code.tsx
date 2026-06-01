import { Redirect, router, useLocalSearchParams } from "expo-router";

import { VerifyResetCodeView } from "@/pages/verify-reset-code";

export default function VerifyResetCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();

  if (!email) {
    return <Redirect href="/forgot-password" />;
  }

  return <VerifyResetCodeView email={email} onBack={() => router.back()} />;
}
