import { router, useLocalSearchParams } from "expo-router";

import { VerifyResetCodeView } from "@/pages/verify-reset-code";

export default function VerifyResetCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();

  if (!email) {
    router.replace("/forgot-password");
    return null;
  }

  return <VerifyResetCodeView email={email} onBack={() => router.back()} />;
}
